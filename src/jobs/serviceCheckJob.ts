import cron from "node-cron";
import { prisma } from "../db/prisma";
import type { ServiceEvent } from "@prisma/client";
import { Bot } from "grammy";
import type { EContext } from "../types";
import { InlineKeyboardButton } from "grammy/types";

export function registerServiceCheckJob(bot: Bot<EContext>) {
  cron.schedule(
    "* * * * *", // каждую минуту
    async () => {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // "22:00"

      const services = await prisma.serviceEvent.findMany({
        where: {
          isActive: true,
          trackingMode: "ask_daily",
          checkTime: currentTime,
        },
      });

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