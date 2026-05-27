import { Composer } from "grammy";
import type { EContext } from "../../types";
import { upsertReminderTime } from "../../db/userSettingsData";
import { isValidTime } from "../../utils/utils";

export function registerSetReminderTimeCommand(composer: Composer<EContext>) {
  composer.command("set_reminder_time", async (ctx) => {
    const args = ctx.message?.text?.split(" ").slice(1).join(" ").trim() ?? "";

    if (!args || !isValidTime(args)) {
      await ctx.reply(
        "Укажи время в формате HH:mm\nПример: /set_reminder_time 22:00"
      );
      return;
    }

    if (!ctx.from) return;
    await upsertReminderTime(String(ctx.from.id), args);
    await ctx.reply(`✅ Время напоминания установлено: ${args}`);
  });
}
