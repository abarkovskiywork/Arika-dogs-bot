import type { Composer } from "grammy";
import type { EContext } from "../../types";
import { getAskDailyServiceEventsForDate } from "../../db/serviceEventData";
import { getBelgradeDateKey } from "../../utils/utils";
import { buildReminderContent } from "../../handlers/reminderCheckActions";

export function registerSendReminderCommand(composer: Composer<EContext>) {
  composer.command("reminder", async (ctx) => {
    const dateKey = getBelgradeDateKey();
    const services = await getAskDailyServiceEventsForDate(dateKey);

    if (services.length === 0) {
      await ctx.reply("Нет активных услуг с режимом 'спрашивать каждый день'.");
      return;
    }

    const { text, keyboard } = buildReminderContent(services, dateKey);
    await ctx.reply(text, { reply_markup: keyboard, parse_mode: "HTML" });
  });
}
