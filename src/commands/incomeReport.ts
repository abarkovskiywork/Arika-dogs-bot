import type { Composer } from "grammy";
import { prisma } from "../db/prisma";
import { getEventInstances } from "../services/googleCalendarService";
import { addOneDay, getInstanceDate, parseArgs, toDayDate } from "../utils/utils";
import type { EContext } from "../types";

export function registerIncomeReportCommand(composer: Composer<EContext>): void {
  composer.command("income_report", async (ctx) => {

    const rawText = ctx.message?.text.replace("/income_report", "").trim() ?? "";
    const { dogName, startDate, endDate } = parseArgs(rawText);

    console.log(dogName, startDate, endDate)
    if (!startDate || !endDate) {
      return ctx.reply(
        'Формат:\n/income_report 2026-05-01 2026-05-31\n\nили:\n/income_report name="Mike" 2026-05-01 2026-05-31'
      );
    }

    const services = await prisma.serviceEvent.findMany({
      where: {
        isActive: true,
        ...(dogName ? { dogName } : {}),
      },
      orderBy: {
        dogName: "asc",
      },
    });

    if (!services.length) {
      return ctx.reply("Активных сервисов по этому фильтру нет.");
    }

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

        const log = await prisma.walkLog.findUnique({
          where: {
            serviceEventId_date: {
              serviceEventId: service.id,
              date: toDayDate(dateKey),
            },
          },
        });

        let walksCount: number;

        console.log(toDayDate(dateKey), service.id, log)
        if (log) {
          walksCount = log.walksCount;
        } else if (service.trackingMode === "auto_done") {
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

    return ctx.reply(
      `Income report\n` +
        `Period: ${startDate} → ${endDate}\n\n` +
        reportLines.join("\n\n---\n\n") +
        `\n\nTOTAL\n` +
        `planned: ${totalPlannedWalks}\n` +
        `${totalActualWalks}\n` +
        `pending days: ${totalPendingDays}\n` +
        `income: ${totalIncome}`
    );
  });
}