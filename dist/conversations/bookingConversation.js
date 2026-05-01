"use strict";
const { InlineKeyboard } = require("grammy");
const bookingService = require("../services/bookingService");
const SASHA_CHAT_ID = process.env.SASHA_CHAT_ID;
async function bookingConversation(conversation, ctx) {
    const keyboard = new InlineKeyboard()
        .text("Выгул", "service:walk")
        .text("Передержка", "service:boarding")
        .row()
        .text("Посещение", "service:home_visit");
    await ctx.reply("Выберете услугу", { reply_markup: keyboard });
    const cb = await conversation.waitFor("callback_query:data");
    const data = cb.callbackQuery.data;
    await cb.answerCallbackQuery();
    if (!data.startsWith("service:")) {
        await ctx.reply("Что-то пошло не так, попробуйте заново через /book");
        return;
    }
    const serviceType = data.replace("service:", "");
    await cb.editMessageText(`Услуга выбрана: ${serviceType}`);
    await ctx.reply("Теперь введи дату начала в формате YYYY-MM-DD");
    const startMsg = await conversation.waitFor("message:text");
    const startDateText = startMsg.message.text.trim();
    await ctx.reply("Введи дату конца в формате YYYY-MM-DD");
    const endMsg = await conversation.waitFor("message:text");
    const endDateText = endMsg.message.text.trim();
    let walkTime = null;
    if (serviceType === "walk") {
        await ctx.reply("Введи время выгула в формате HH:mm");
        const timeMsg = await conversation.waitFor("message:text");
        walkTime = timeMsg.message.text.trim();
    }
    const startDate = new Date(startDateText);
    const endDate = new Date(endDateText);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        await ctx.reply("С датами беда. Запусти заново через /book");
        return;
    }
    const booking = await bookingService.createBooking({
        userTelegramId: String(ctx.from.id),
        username: ctx.from.username || null,
        serviceType,
        startDate,
        endDate,
        walkTime,
    });
    await ctx.reply(`Заявка создана, id: ${booking.id}`);
    await ctx.api.sendMessage(SASHA_CHAT_ID, `Новая заявка #${booking.id}\n` +
        `Услуга: ${booking.serviceType}\n` +
        `user: @${booking.username || "без username"}\n` +
        `start: ${startDateText}\n` +
        `end: ${endDateText}\n` +
        `${walkTime ? `time: ${walkTime}\n` : ""}`, {
        reply_markup: {
            inline_keyboard: [[
                    { text: "✅ Принять", callback_data: `approve:${booking.id}` },
                    { text: "❌ Отклонить", callback_data: `reject:${booking.id}` },
                ]],
        },
    });
}
module.exports = bookingConversation;
