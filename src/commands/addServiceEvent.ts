import type { Bot } from "grammy";
import { createServiceEventWithDb } from "../services/googleCalendarService";
import { isAllowed, parseArgs } from "../utils";
import type { EContext } from "../types";

export function registerAddServiceCommand(bot: Bot<EContext>): void {
  bot.command("add_service", async (ctx) => {
    if (!ctx.from || !isAllowed(ctx.from.id)) {
      return ctx.reply("Не для тебя 😌");
    }

    const text = ctx.message?.text.replace("/add_service", "").trim() ?? "";
    const args = parseArgs(text);

    const {
      dogName,
      serviceType,
      price: priceRaw,
      walksPerDay: walksPerDayRaw,
      mode,
      checkTime,
      startDate,
      endDate,
      startTime,
      endTime,
    } = args;

    if (
      !dogName ||
      !serviceType ||
      !priceRaw ||
      !walksPerDayRaw ||
      !mode ||
      !checkTime ||
      !startDate ||
      !endDate
    ) {
      return ctx.reply(
        "Формат:\n" +
          '/add_service dogName="Mike" serviceType="walk" price=10 walksPerDay=2 mode=all_day checkTime=21:00 startDate=2026-04-30 endDate=2026-12-31\n\n' +
          "или:\n" +
          '/add_service dogName="Mike" serviceType="walk" price=10 walksPerDay=1 mode=timed checkTime=21:00 startDate=2026-04-30 endDate=2026-12-31 startTime=09:00 endTime=10:00'
      );
    }

    const price = Number(priceRaw);
    const walksPerDay = Number(walksPerDayRaw);
    const isAllDay = mode === "all_day";

    if (Number.isNaN(price) || Number.isNaN(walksPerDay)) {
      return ctx.reply("Цена и количество прогулок должны быть числами.");
    }

    if (mode !== "all_day" && mode !== "timed") {
      return ctx.reply("mode должен быть all_day или timed.");
    }

    if (!isAllDay && (!startTime || !endTime)) {
      return ctx.reply("Для timed события нужны startTime и endTime.");
    }

    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    if (!calendarId) {
      return ctx.reply("GOOGLE_CALENDAR_ID не задан в .env");
    }

    try {
      const result = await createServiceEventWithDb({
        calendarId,
        dogName,
        serviceType,
        price,
        walksPerDay,
        isAllDay,
        checkTime,
        startDate,
        endDate,
        startTime,
        endTime,
      });

      return ctx.reply(
        `Создал событие: ${result.calendarEvent.summary}\n` +
          `${result.calendarEvent.htmlLink}\n` +
          `ID в БД: ${result.serviceEvent.id}`
      );
    } catch (error) {
      console.error("Failed to create service event:", error);
      return ctx.reply("Не получилось создать событие. Я записала ошибку в консоль.");
    }
  });
}
