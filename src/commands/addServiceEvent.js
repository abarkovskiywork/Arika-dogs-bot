const { createServiceEvent } = require("../services/googleCalendarService");

module.exports = (bot) => {

    const allowed = [
        process.env.ANTON_CHAT_ID,
        process.env.SASHA_CHAT_ID
    ]

    bot.command("addservice", async (ctx) => {
        if (!allowed.includes(String(ctx.from.id))) {
            return ctx.reply("Не для тебя 😌");
        }

        console.log('pizda');
        const text = ctx.message.text.replace("/addservice", "").trim();

        // формат:
        // /addservice Mike walk 10 2 all_day 2026-04-30 2026-12-31
        // /addservice Mike walk 10 1 timed 2026-04-30 2026-12-31 09:00 10:00

        const parts = text.split(/\s+/);

        const [dogName, serviceType, price, walksPerDay, mode, startDate, endDate, startTime, endTime] = parts;

        if (!dogName || !serviceType || !price || !walksPerDay || !mode || !startDate || !endDate) {
            return ctx.reply(
                "Формат:\n" +
                "/addservice Mike walk 10 2 all_day 2026-04-30 2026-12-31\n\n" +
                "или:\n" +
                "/addservice Mike walk 10 1 timed 2026-04-30 2026-12-31 09:00 10:00"
            );
        }

        const isAllDay = mode === "all_day";

        if (!isAllDay && (!startTime || !endTime)) {
            return ctx.reply("Для timed события нужны startTime и endTime.");
        }

        const event = await createServiceEvent({
            calendarId: process.env.GOOGLE_CALENDAR_ID,
            dogName,
            serviceType,
            price: Number(price),
            walksPerDay: Number(walksPerDay),
            isAllDay,
            startDate,
            endDate,
            startTime,
            endTime,
        });

        await ctx.reply(`Создал событие: ${event.summary}\n${event.htmlLink}`);
    });
};