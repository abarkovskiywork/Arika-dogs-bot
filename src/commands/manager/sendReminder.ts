import type { Composer } from "grammy";
import type { EContext } from "../../types";
import { getTodayAskDailyServiceEvents } from "../../db/serviceEventData";
import { buildReminderContent } from "../../handlers/reminderCheckActions";

export function registerSendReminderCommand(composer: Composer<EContext>) {
  composer.command("reminder", async (ctx) => {
    const services = await getTodayAskDailyServiceEvents();

    if (services.length === 0) {
      await ctx.reply("Нет активных услуг с режимом 'спрашивать каждый день'.");
      return;
    }

    const { text, keyboard } = buildReminderContent(services);
    await ctx.reply(text, { reply_markup: keyboard, parse_mode: "HTML" });
  });
}
