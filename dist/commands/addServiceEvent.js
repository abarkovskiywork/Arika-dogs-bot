"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAddServiceCommand = registerAddServiceCommand;
const googleCalendarService_1 = require("../services/googleCalendarService");
const utils_1 = require("../utils");
function registerAddServiceCommand(bot) {
    bot.command("addservice", async (ctx) => {
        if (!ctx.from || !(0, utils_1.isAllowed)(ctx.from.id)) {
            return ctx.reply("Не для тебя 😌");
        }
        const text = ctx.message?.text.replace("/addservice", "").trim() ?? "";
        const parts = text.split(/\s+/).filter(Boolean);
        const [dogName, serviceType, priceRaw, walksPerDayRaw, mode, startDate, endDate, startTime, endTime,] = parts;
        if (!dogName ||
            !serviceType ||
            !priceRaw ||
            !walksPerDayRaw ||
            !mode ||
            !startDate ||
            !endDate) {
            return ctx.reply("Формат:\n" +
                "/addservice Mike walk 10 2 all_day 2026-04-30 2026-12-31\n\n" +
                "или:\n" +
                "/addservice Mike walk 10 1 timed 2026-04-30 2026-12-31 09:00 10:00");
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
            const result = await (0, googleCalendarService_1.createServiceEventWithDb)({
                calendarId,
                dogName,
                serviceType,
                price,
                walksPerDay,
                isAllDay,
                startDate,
                endDate,
                startTime,
                endTime,
            });
            return ctx.reply(`Создал событие: ${result.calendarEvent.summary}\n` +
                `${result.calendarEvent.htmlLink}\n` +
                `ID в БД: ${result.serviceEvent.id}`);
        }
        catch (error) {
            console.error("Failed to create service event:", error);
            return ctx.reply("Не получилось создать событие. Я записала ошибку в консоль.");
        }
    });
}
