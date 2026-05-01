import { Composer } from "grammy";
import { EContext } from "../types";
import { deleteServiceEvent } from "../services/deleteServiceEvent";

export function registerDeleteServiceCommand(composer: Composer<EContext>): void {
    composer.command("delete_service", async (ctx) => {
        const id = Number(ctx?.message?.text.replace("/deleteService", "").trim());

        if (!id) return ctx.reply("Формат: /deleteService 3");

        await deleteServiceEvent(id);

        await ctx.reply(`Сервис ${id} удалён.`);
    });
}
