import cron from "node-cron";
import { getAskDailyServiceEvents } from "../db/serviceEventData";
import type { ServiceEvent } from "@prisma/client";
import { Bot } from "grammy";
import type { EContext } from "../types";
import { InlineKeyboardButton } from "grammy/types";
import { getBelgradeTime } from "../utils/utils";

export function registerServiceCheckJob(bot: Bot<EContext>) {
  cron.schedule(
    "* * * * *", // каждую минуту
    async () => {
      const now = new Date();
      const currentTime = getBelgradeTime();

      const services = await getAskDailyServiceEvents(currentTime);

      for (const service of services) {
        const serviceOptions = buildServiceOptions(service)
        await bot.api.sendMessage(
          process.env.SASHA_CHAT_ID!,
          `${service.dogName}: сколько прогулок было сегодня?`,
          {
            reply_markup: {
              inline_keyboard: [
                serviceOptions,
              ],
            },
          }
        );
      }
    },
    {
      timezone: "Europe/Belgrade",
    }
  );
}

function buildServiceOptions(service: ServiceEvent): InlineKeyboardButton[] {
  const res = []
  for (let i = 0; i <= service.walksPerDay; i++) {
    res.push({text: `${i}`, callback_data: `walk:${service.id}:${i}`})
  }
  console.log(res);
  return res;
}