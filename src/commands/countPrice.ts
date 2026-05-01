import type { Composer } from "grammy";
import { prisma } from "../db/prisma";
import { getEventInstances } from "../services/googleCalendarService";
import { addOneDay, getInstanceDate, isAllowed, parseArgs } from "../utils/utils";
import type { EContext } from "../types";

export function registerCountPriceCommand(composer: Composer<EContext>): void {
  composer.command("count_price", async (ctx) => {

    const text = ctx.message?.text.replace("/count_price", "").trim() ?? "";
    const { dogName, startDate, endDate } = parseArgs(text);

    if (!startDate || !endDate) {
      return ctx.reply(
        'Формат:\n/count_price 2026-05-01 2026-05-31\n\nили:\n/count_price name="Mike" 2026-05-01 2026-05-31'
      );
    }

    const services = await prisma.serviceEvent.findMany({
      where: {
        isActive: true,
        ...(dogName ? { dogName } : {}),
      },
    });

    if (!services.length) {
      return ctx.reply("Сервисов за этот фильтр нет.");
    }

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

        const log = await prisma.walkLog.findUnique({
          where: {
            serviceEventId_date: {
              serviceEventId: service.id,
              date,
            },
          },
        });

        const walksCount =
          log?.walksCount ??
          (service.trackingMode === "auto_done" ? service.walksPerDay : 0);

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

    return ctx.reply(
      `Период: ${startDate} → ${endDate}\n\n` +
        lines.join("\n\n---\n\n") +
        `\n\nИтого: ${total}`
    );
  });
}