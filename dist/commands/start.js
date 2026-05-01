"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerStartCommand = registerStartCommand;
function registerStartCommand(bot) {
    bot.command("start", (ctx) => ctx.reply("Test"));
}
