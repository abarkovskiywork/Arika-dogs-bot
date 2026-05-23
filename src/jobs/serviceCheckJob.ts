import cron from "node-cron";
import { getTodayAskDailyServiceEvents } from "../db/serviceEventData";
import { getAllUserSettings } from "../db/userSettingsData";
import { Bot } from "grammy";
import type { EContext } from "../types";
import { getBelgradeTime } from "../utils/utils";
import { buildReminderContent } from "../handlers/reminderCheckActions";

export function registerServiceCheckJob(bot: Bot<EContext>) {
  cron.schedule(
    "* * * * *",
    async () => {
      const currentTime = getBelgradeTime();
      const allSettings = await getAllUserSettings();
      const shouldCheck = allSettings.some((s) => s.reminderTime === currentTime);
      if (!shouldCheck) return;

      const services = await getTodayAskDailyServiceEvents();
      if (services.length === 0 || services.every((s) => s.walkLogs.length > 0)) return;

      const { text, keyboard } = buildReminderContent(services);
      await bot.api.sendMessage(process.env.SASHA_CHAT_ID!, text, {
        reply_markup: keyboard,
      });
    },
    { timezone: "Europe/Belgrade" }
  );
}
