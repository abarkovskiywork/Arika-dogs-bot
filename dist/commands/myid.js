"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMyIdCommand = registerMyIdCommand;
function registerMyIdCommand(bot) {
    bot.command("myid", async (ctx) => {
        await ctx.reply(`Your id: ${ctx?.from?.id}`);
    });
}
