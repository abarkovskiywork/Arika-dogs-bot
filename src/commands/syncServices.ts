import type { Bot } from "grammy";
import { syncServices } from "../jobs/serviceSyncJob";
import { isAllowed } from "../utils";
import type { EContext } from "../types";


export function registerSyncServicesCommand(bot: Bot<EContext>): void {
  bot.command("sync_services", async (ctx) => {
    if (!ctx.from || !isAllowed(ctx.from.id)) {
      return ctx.reply("Не для тебя 😌");
    }

    const result = await syncServices();

    return ctx.reply(
      `Sync done.\n` +
      `Checked: ${result.checked}\n` +
      `Deactivated: ${result.deactivated}\n` +
      `Errors: ${result.errors}`
    );
  });
}