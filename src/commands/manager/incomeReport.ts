import { TrackingMode } from "@prisma/client";
import type { Composer } from "grammy";
import { createConversation } from "@grammyjs/conversations";
import type { Conversation } from "@grammyjs/conversations";
import { prisma } from "../../db/prisma";
import { getServiceEventsByIds } from "../../db/serviceEventData";
import { getEventInstances } from "../../services/googleCalendarService";
import { addOneDay, getInstanceDate, toDayDate } from "../../utils/utils";
import { collectServicePeriod } from "../../conversations/collectServicePeriod";
import type { EContext } from "../../types";

async function incomeReportConversation(
  conversation: Conversation<EContext, EContext>,
  ctx: EContext
): Promise<void> {
  const input = await collectServicePeriod(conversation, ctx);
  if (!input) return;

  const { serviceIds, startDate, endDate } = input;

  const services = await getServiceEventsByIds(serviceIds);

  const timeMin = `${startDate}T00:00:00+02:00`;
  const timeMax = `${addOneDay(endDate)}T00:00:00+02:00`;

  let totalIncome = 0;
  let totalPlannedWalks = 0;
  let totalActualWalks = 0;
  let totalPendingDays = 0;

  const reportLines: string[] = [];

  for (const service of services) {
    const instances = await getEventInstances({
      calendarId: service.calendarId,
      eventId: service.googleEventId,
      timeMin,
      timeMax,
    });

    let serviceIncome = 0;
    let plannedWalks = 0;
    let actualWalks = 0;
    let pendingDays = 0;
    let skippedWalks = 0;

    for (const instance of instances) {
      if (instance.status === "cancelled") continue;

      const dateKey = getInstanceDate(instance);
      if (!dateKey) continue;

      plannedWalks += service.walksPerDay;

      const logs = await prisma.walkLog.findMany({
        where: { serviceEventId: service.id, date: toDayDate(dateKey) },
      });

      let walksCount: number;

      if (logs.length) {
        walksCount = logs.reduce((sum, l) => sum + l.walksCount, 0);
      } else if (service.trackingMode === TrackingMode.auto_done) {
        walksCount = service.walksPerDay;
      } else {
        walksCount = 0;
        pendingDays++;
      }

      actualWalks += walksCount;
      skippedWalks += Math.max(service.walksPerDay - walksCount, 0);
      serviceIncome += walksCount * service.price;
    }

    totalIncome += serviceIncome;
    totalPlannedWalks += plannedWalks;
    totalActualWalks += actualWalks;
    totalPendingDays += pendingDays;

    reportLines.push(
      `${service.dogName} #${service.id}\n` +
        `type: ${service.serviceType}\n` +
        `price: ${service.price}\n` +
        `planned: ${plannedWalks}\n` +
        `actual: ${actualWalks}\n` +
        `skipped: ${skippedWalks}\n` +
        `pending days: ${pendingDays}\n` +
        `income: ${serviceIncome}`
    );
  }

  await ctx.reply(
    `Income report\n` +
      `Period: ${startDate} → ${endDate}\n\n` +
      reportLines.join("\n\n---\n\n") +
      `\n\nTOTAL\n` +
      `planned: ${totalPlannedWalks}\n` +
      `actual: ${totalActualWalks}\n` +
      `pending days: ${totalPendingDays}\n` +
      `income: ${totalIncome}`
  );
}

export function registerIncomeReportCommand(composer: Composer<EContext>): void {
  composer.use(createConversation(incomeReportConversation));

  composer.command("income_report", async (ctx) => {
    await ctx.conversation.enter("incomeReportConversation");
  });
}
