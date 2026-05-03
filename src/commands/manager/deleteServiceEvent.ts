import { Composer, InlineKeyboard } from "grammy";
import type { EContext } from "../../types";
import { getActiveCurrentServiceEvents } from "../../db/serviceEventData";
import { deleteServiceEvent } from "../../services/deleteServiceEvent";

export function registerDeleteServiceCommand(composer: Composer<EContext>): void {
    composer.command("delete_service", async (ctx) => {
        const events = await getActiveCurrentServiceEvents();

        if (events.length === 0) {
            return ctx.reply("Нет активных сервисов.");
        }

        const keyboard = new InlineKeyboard();

        events.forEach((event, i) => {
            keyboard.text(`#${event.id} ${event.dogName} (${event.serviceType})`, `delete:${event.id}`);
            if ((i + 1) % 2 === 0) keyboard.row();
        });

        return ctx.reply("Какой сервис удалить?", { reply_markup: keyboard });
    });

    composer.callbackQuery(/^delete:(\d+)$/, async (ctx) => {
        const id = Number(ctx.match[1]);
        await ctx.answerCallbackQuery();

        try {
            await deleteServiceEvent(id);
            await ctx.editMessageText(`Сервис #${id} удалён.`);
        } catch (error) {
            console.error("Failed to delete service event:", error);
            await ctx.editMessageText(`Не получилось удалить сервис #${id}.`);
        }
    });
}
