import type { Bot } from "grammy"
import { EContext } from "../types";

export function registerStartCommand(bot: Bot<EContext>) {
    bot.command("start", (ctx) => ctx.reply("Test"));

}
