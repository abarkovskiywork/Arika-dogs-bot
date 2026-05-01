import type { Bot } from "grammy"
import { EContext } from "../types";

export function registerMyIdCommand(bot: Bot<EContext>) {
    bot.command("myid", async (ctx) => {
        await ctx.reply(`Your id: ${ctx?.from?.id}`);
    });
}
