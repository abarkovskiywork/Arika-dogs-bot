import type { Composer } from "grammy";
import { createConversation } from "@grammyjs/conversations";
import type { Conversation } from "@grammyjs/conversations";
import { TrackingMode } from "@prisma/client";
import { prisma } from "../../db/prisma";
import { getServiceEventsByIds } from "../../db/serviceEventData";
import { getEventInstances } from "../../services/googleCalendarService";
import { addOneDay, getInstanceDate } from "../../utils/utils";
import { collectServicePeriod } from "../../conversations/collectServicePeriod";
import type { EContext } from "../../types";

async function countPriceConversation(
  conversation: Conversation<EContext, EContext>,
  ctx: EContext
): Promise<void> {
  const input = await collectServicePeriod(conversation, ctx);
  if (!input) return;

  const { serviceIds, startDate, endDate } = input;

  const services = await getServiceEventsByIds(serviceIds);

  const timeMin = `${startDate}T00:00:00+02:00`;
  const timeMax = `${addOneDay(endDate)}T00:00:00+02:00`;

  let total = 0;
  const lines: string[] = [];

  for (const service of services) {
    const instances = await getEventInstances({
      calendarId: service.calendarId,
      eventId: service.googleEventId,
      timeMin,
      timeMax,
    });

    let serviceWalks = 0;
    let serviceTotal = 0;

    for (const instance of instances) {
      const dateKey = getInstanceDate(instance);
      if (!dateKey) continue;

      const date = new Date(`${dateKey}T00:00:00.000Z`);

      const logs = await prisma.walkLog.findMany({
        where: { serviceEventId: service.id, date },
      });

      const walksCount = logs.length
        ? logs.reduce((sum, l) => sum + l.walksCount, 0)
        : service.trackingMode === TrackingMode.auto_done
          ? service.walksPerDay
          : 0;

      serviceWalks += walksCount;
      serviceTotal += walksCount * service.price;
    }

    total += serviceTotal;

    lines.push(
      `${service.dogName} #${service.id}\n` +
        `walks: ${serviceWalks}\n` +
        `price: ${service.price}\n` +
        `sum: ${serviceTotal}`
    );
  }

  await ctx.reply(
    `Период: ${startDate} → ${endDate}\n\n` +
      lines.join("\n\n---\n\n") +
      `\n\nИтого: ${total}`
  );
}

export function registerCountPriceCommand(composer: Composer<EContext>): void {
  composer.use(createConversation(countPriceConversation));

  composer.command("count_price", async (ctx) => {
    await ctx.conversation.enter("countPriceConversation");
  });
}
