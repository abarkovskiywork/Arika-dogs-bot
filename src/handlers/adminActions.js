const bookingService = require("../services/bookingService");

module.exports = (bot) => {
    bot.callbackQuery(/^approve:(.+)$/, async (ctx) => {
        const id = Number(ctx.match[1]);

        await bookingService.updateBookingStatus(id, "approved");

        await ctx.answerCallbackQuery("Accepted");
        await ctx.editMessageText(`Request ${id} has been accepted`);

    });

    bot.callbackQuery(/^reject:(.+)$/, async (ctx) => {
        const id = Number(ctx.match[1]);

        await bookingService.updateBookingStatus(id, "rejected");

        await ctx.answerCallbackQuery("Rejected")
        await ctx.editMessageText(`Request ${id} has been rejected`);
    });
}