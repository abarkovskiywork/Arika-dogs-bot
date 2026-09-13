import cron from "node-cron";
import { getAskDailyServiceEventsForDate } from "../db/serviceEventData";
import { getAllUserSettings } from "../db/userSettingsData";
import { Bot } from "grammy";
import type { EContext } from "../types";
import { getBelgradeDateKey, getBelgradeTime } from "../utils/utils";
import { buildReminderContent } from "../handlers/reminderCheckActions";

export function registerServiceCheckJob(bot: Bot<EContext>) {
  cron.schedule(
    "* * * * *",
    async () => {
      const currentTime = getBelgradeTime();
      const allSettings = await getAllUserSettings();
      const matching = allSettings.filter((s) => s.reminderTime === currentTime);
      if (matching.length === 0) return;

      const dateKey = getBelgradeDateKey();
      const services = await getAskDailyServiceEventsForDate(dateKey);
      if (services.length === 0 || services.every((s) => s.walkLogs.length > 0)) return;

      const { text, keyboard } = buildReminderContent(services, dateKey);
      for (const settings of matching) {
        try {
          await bot.api.sendMessage(settings.userId, text, { reply_markup: keyboard });
        } catch (error) {
          console.error("[service_check_job] error for user:", settings.userId, error);
        }
      }
    },
    { timezone: "Europe/Belgrade" }
  );
}
