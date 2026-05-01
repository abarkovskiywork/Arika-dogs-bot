"use strict";
const bookignService = require("../services/bookingService");
const ANTOXA_CHAT_ID = process.env.SASHA_CHAT_ID;
module.exports = (bot) => {
    bot.command("testbooking", async (ctx) => {
        const booking = await bookignService.createBooking({
            userTelegramId: String(ctx.from.id),
            username: ctx.from.username || null,
            serviceType: "walk",
            startDate: new Date("2026-04-06"),
            endDate: new Date("2026-04-07"),
            walkTime: "18:00"
        });
        await ctx.reply(`Booking created, id: ${booking.id}`);
        await bot.api.sendMessage(ANTOXA_CHAT_ID, `ZAYAVKA #${booking.id}\n usluga: ${booking.serviceType}\n user: @${booking.username}`, {
            reply_markup: {
                inline_keyboard: [[
                        { text: "Accept", callback_data: `approve:${booking.id}` },
                        { text: "Reject", callback_data: `reject:${booking.id}` }
                    ]]
            }
        });
    });
};
