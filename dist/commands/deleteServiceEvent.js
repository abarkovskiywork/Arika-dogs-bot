"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDeleteServiceCommand = registerDeleteServiceCommand;
const deleteServiceEvent_1 = require("../services/deleteServiceEvent");
function registerDeleteServiceCommand(bot) {
    bot.command("deleteService", async (ctx) => {
        const id = Number(ctx?.message?.text.replace("/delete_service", "").trim());
        if (!id)
            return ctx.reply("Формат: /delete_service 3");
        await (0, deleteServiceEvent_1.deleteServiceEvent)(id);
        await ctx.reply(`Сервис ${id} удалён.`);
    });
}
