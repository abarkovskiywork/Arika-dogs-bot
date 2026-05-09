import cron from "node-cron";
import { Bot } from "grammy";
import type { EContext } from "../types";
import { getAllUserSettings } from "../db/userSettingsData";
import { getTodayServiceEvents, getNeedsSetupServiceEvents } from "../db/serviceEventData";
import { getBelgradeTime } from "../utils/utils";

async function sendDailyDigest(bot: Bot<EContext>, userId: string): Promise<void> {
  const [todayEvents, needsSetupEvents] = await Promise.all([
    getTodayServiceEvents(),
    getNeedsSetupServiceEvents(),
  ]);

  if (!todayEvents.length && !needsSetupEvents.length) return;

  const serviceTypeLabel: Record<string, string> = {
    walk: "выгул",
    boarding: "передержка",
    home_visit: "визит",
  };

  let message = "📋 <b>Услуги на сегодня:</b>\n\n";

  if (todayEvents.length) {
    for (const event of todayEvents) {
      const type = serviceTypeLabel[event.serviceType] ?? event.serviceType;
      message += `• ${event.dogName} — ${type}\n`;
    }
    message += "\nОтметь выполнение командой /check";
  } else {
    message += "Услуг на сегодня нет.";
  }

  if (needsSetupEvents.length) {
    message +=
      `\n\n⚠️ <b>${needsSetupEvents.length} событий без настройки.</b>\n` +
      `Запусти /setup_services чтобы заполнить детали.`;
  }

  await bot.api.sendMessage(userId, message, { parse_mode: "HTML" });
}

export function registerDigestJob(bot: Bot<EContext>): void {
  cron.schedule(
    "* * * * *",
    async () => {
      const currentTime = getBelgradeTime();
      const allSettings = await getAllUserSettings();

      console.log(currentTime, allSettings[0].digestTime)
      for (const settings of allSettings) {
        if (settings.digestTime === currentTime) {
          try {
            await sendDailyDigest(bot, settings.userId);
          } catch (error) {
            console.error("[digest_job] error for user:", settings.userId, error);
          }
        }
      }
    },
    { timezone: "Europe/Belgrade" }
  );
}
