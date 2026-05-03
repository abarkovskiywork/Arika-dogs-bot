import type { Bot } from "grammy";
import type { EContext } from "../types";
import { requestTimezoneBigdatacloud } from "../services/timezoneService";

export function registerLocationHandler(bot: Bot<EContext>): void {
  bot.on("message:location", async (ctx) => {
    const { latitude, longitude } = ctx.message.location;

    console.log("location:", latitude, longitude);

    const timezone = await requestTimezoneBigdatacloud(latitude, longitude)
    console.log(timezone)
    await ctx.reply("Приняла 📍");
  });
}