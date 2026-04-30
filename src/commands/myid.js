module.exports = (bot) => {
    bot.command("myid", (ctx) => {
        ctx.reply(`Your id: ${ctx.from.id}`);
    });
};