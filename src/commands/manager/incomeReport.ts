import { TrackingMode } from "@prisma/client";
import type { Composer } from "grammy";
import { createConversation } from "@grammyjs/conversations";
import type { Conversation } from "@grammyjs/conversations";
import { prisma } from "../../db/prisma"; 
import { getServiceEventsByIds } from "../../db/serviceEventData";
import { getEventInstances } from "../../services/googleCalendarService";
import { getBelgradeDateKey, getInstanceDate, toDayDate } from "../../utils/utils";
import { buildWalkReportLines } from "../../utils/walkReport";
import { collectServicePeriod } from "../../conversations/collectServicePeriod";
import type { EContext } from "../../types";

async function incomeReportConversation(
  conversation: Conversation<EContext, EContext>,
  ctx: EContext
): Promise<void> {
  const input = await collectServicePeriod(conversation, ctx, "months");
  if (!input) return;

  const { serviceIds, startDate, endDate } = input;

  const services = await getServiceEventsByIds(serviceIds);

  const timeMin = `${startDate}T00:00:00+02:00`;
  const nextDay = toDayDate(endDate);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  const timeMax = `${nextDay.toISOString().slice(0, 10)}T00:00:00+02:00`;
  const today = await conversation.external(() => getBelgradeDateKey());

  let totalIncome = 0;
  let totalActualWalks = 0;

  const reportLines: string[] = [];

  for (const service of services) {
    let actualWalks: number;
    let serviceIncome: number;
    let line: string;

    if (service.trackingMode === TrackingMode.auto_done) {
      const instances = await getEventInstances({
        calendarId: service.calendarId,
        eventId: service.googleEventId,
        timeMin,
        timeMax,
      });
      const dayCount = instances.filter(
        (i) => i.status !== "cancelled" && getInstanceDate(i)
      ).length;
      actualWalks = dayCount * service.walksPerDay;
      serviceIncome = actualWalks * service.price;
      line =
        `${service.dogName} #${service.id}\n` +
        `type: ${service.serviceType}\n` +
        `price: ${service.price}\n` +
        `days: ${dayCount}\n` +
        `walks: ${actualWalks}\n` +
        `income: ${serviceIncome}`;
      reportLines.push(line);
    } else {
      const logs = await prisma.walkLog.findMany({
        where: {
          serviceEventId: service.id,
          date: { gte: toDayDate(startDate), lt: nextDay },
        },
      });
      actualWalks = logs.reduce((sum, l) => sum + l.walksCount, 0);
      serviceIncome = actualWalks * service.price;
      reportLines.push(`${service.dogName} #${service.id}\n` + buildWalkReportLines({
        logs, startDate, endDate, today,
      }).join("\n"));
      
    }

    totalIncome += serviceIncome;
    totalActualWalks += actualWalks;
    
  }

  await ctx.reply(
    `Income report\n` +
      `Period: ${new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(toDayDate(startDate))}\n\n` +
      reportLines.join("\n\n---\n\n") +
      `\n\nTOTAL\n` +
      `walks: ${totalActualWalks}\n` +
      `income: ${totalIncome}`
  );
}

export function registerIncomeReportCommand(composer: Composer<EContext>): void {
  composer.use(createConversation(incomeReportConversation));

  composer.command("income_report", async (ctx) => {
    await ctx.conversation.enter("incomeReportConversation");
  });
}
