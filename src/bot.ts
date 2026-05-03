import "dotenv/config"
import { Bot } from "grammy"
import { conversations, createConversation } from "@grammyjs/conversations"
import { registerSyncServicesJob } from "./jobs/serviceSyncJob"
import { registerServiceCheckJob } from "./jobs/serviceCheckJob"
import { registerWalkCheckActions } from "./handlers/walkCheckActions"
import { registerCommands } from "./commands"
import type { EContext } from "./types";
import { COMMANDS_HELP_LIST } from "./utils/constants"
import { addServiceEventConversation } from "./conversations/addServiceEventConversation"
import { registerLocationHandler } from "./handlers/locationHandler"

const bot = new Bot<EContext>(process.env.BOT_TOKEN!);

async function main() {
    await bot.api.setMyCommands(COMMANDS_HELP_LIST);

    bot.use(conversations());

    // const bookingConversation = require("./conversations/bookingConversation");
    bot.use(createConversation(addServiceEventConversation));

    // const bookingConversationCalendar = require("./conversations/bookingConversationCalendar");
    // bot.use(createConversation(bookingConversationCalendar));

    registerSyncServicesJob()
    registerServiceCheckJob(bot)
    registerWalkCheckActions(bot)
    // registerLocationHandler(bot)
    registerCommands(bot)

    bot.on("message:text", async (ctx) => {
        const text = ctx.message.text;
        if (text == "/start") return;
        if (text.startsWith("/")) return;

        await ctx.reply(`You wrote: ${ctx.message.text}`);

    })

    bot.catch((err) => {
        console.error("Bot error:", err);
    });

    bot.start();
}

main();