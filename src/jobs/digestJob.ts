import cron from "node-cron";
import { ServiceType } from "@prisma/client";
import { Bot } from "grammy";
import type { EContext } from "../types";
import { getAllUserSettings, getUserSettings } from "../db/userSettingsData";
import { getTodayServiceEvents, getNeedsSetupServiceEvents } from "../db/serviceEventData";
import { getBelgradeTime } from "../utils/utils";

const SERVICE_TYPE_LABEL: Partial<Record<ServiceType, string>> = {
  [ServiceType.walk]: "выгул",
  [ServiceType.boarding]: "передержка",
  [ServiceType.home_visit]: "визит",
  [ServiceType.cleaning]: "уборка",
};

export async function buildDigestMessage(userId?: string): Promise<{ text: string; hasContent: boolean }> {
  const [todayEvents, needsSetupEvents, settings] = await Promise.all([
    getTodayServiceEvents(),
    getNeedsSetupServiceEvents(),
    userId ? getUserSettings(userId) : Promise.resolve(null),
  ]);

  let text = "📋 <b>Услуги на сегодня:</b>\n\n";

  if (todayEvents.length) {
    for (const event of todayEvents) {
      const type = SERVICE_TYPE_LABEL[event.serviceType] ?? event.serviceType;
      text += `• ${event.dogName} — ${type}\n`;
    }
    text += "\nОтметь выполнение командой /check";
  } else {
    text += "Услуг на сегодня нет.";
  }

  if (needsSetupEvents.length) {
    text +=
      `\n\n⚠️ <b>${needsSetupEvents.length} событий без настройки.</b>\n` +
      `Запусти /setup_services чтобы заполнить детали.`;
  }

  if (settings) {
    text +=
      `\n\n⚙️ <b>Настройки:</b>\n` +
      `Дайджест: ${settings.digestTime}\n` +
      `Напоминание: ${settings.reminderTime}`;
  }

  return { text, hasContent: todayEvents.length > 0 || needsSetupEvents.length > 0 };
}

async function sendDailyDigest(bot: Bot<EContext>, userId: string): Promise<void> {
  const { text, hasContent } = await buildDigestMessage(userId);
  if (!hasContent) return;
  await bot.api.sendMessage(userId, text, { parse_mode: "HTML" });
}

export function registerDigestJob(bot: Bot<EContext>): void {
  cron.schedule(
    "* * * * *",
    async () => {
      const currentTime = getBelgradeTime();
      const allSettings = await getAllUserSettings();

      if( allSettings.length === 0 ) return;

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
