import type { Composer } from "grammy";
import { deleteServiceEvent } from "../../services/deleteServiceEvent";
import type { EContext } from "../../types";

export function registerAdminDeleteServiceCommand(composer: Composer<EContext>) {
  composer.command("admin_delete_service", async (ctx) => {
    const text = ctx.message?.text.replace("/admin_delete_service", "").trim() ?? "";
    const id = Number(text);

    if (!id) {
      return ctx.reply("Формат: /admin_delete_service 9");
    }

    try {
      await deleteServiceEvent(id);
      return ctx.reply(`Сервис #${id} удалён.`);
    } catch (error) {
      console.error("Failed to delete service event:", error);
      return ctx.reply(`Не получилось удалить сервис #${id}.`);
    }
  });
}
