import { Composer } from "grammy";
import type { EContext } from "../../types";
import { upsertUserSettings } from "../../db/userSettingsData";
import { isValidTime } from "../../utils/utils";

export function registerSetDigestTimeCommand(composer: Composer<EContext>) {
  composer.command("set_digest_time", async (ctx) => {
    const args = ctx.message?.text?.split(" ").slice(1).join(" ").trim() ?? "";

    if (!args || !isValidTime(args)) {
      await ctx.reply(
        "Укажи время в формате HH:mm\nПример: /set_digest_time 08:00"
      );
      return;
    }

    if (!ctx.from) return;
    await upsertUserSettings(String(ctx.from.id), args);
    await ctx.reply(`✅ Время дайджеста установлено: ${args}`);
  });
}
