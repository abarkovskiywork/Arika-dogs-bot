module.exports = (bot) => {
    bot.command("book", async (ctx) => {
        await ctx.conversation.enter("bookingConversationCalendar");
    });
};