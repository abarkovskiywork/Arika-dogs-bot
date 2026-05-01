import "dotenv/config"
import { Bot } from "grammy"
import { conversations } from "@grammyjs/conversations"
import { registerSyncServicesJob } from "./jobs/serviceSyncJob"
import { registerServiceCheckJob } from "./jobs/serviceCheckJob"
import { registerWalkCheckActions } from "./handlers/walkCheckActions"
import { registerCommands } from "./commands"
import type { EContext } from "./types";

const bot = new Bot<EContext>(process.env.BOT_TOKEN!);

async function main() {
    await bot.api.setMyCommands([
        { command: "add_service", description: "name type price count all_day start(YYYY-MM-DD) end(YYYY-MM-DD) " },
        { command: "update_service", description: "Обновить сервис" },
        { command: "list_services", description: "Список сервисов" },
        { command: "sync_services", description: "Синк с календарем" },
    ]);

    bot.use(conversations());

    // const bookingConversation = require("./conversations/bookingConversation");
    // bot.use(createConversation(bookingConversation));

    // const bookingConversationCalendar = require("./conversations/bookingConversationCalendar");
    // bot.use(createConversation(bookingConversationCalendar));

    registerSyncServicesJob()
    registerServiceCheckJob(bot)
    registerWalkCheckActions(bot)
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