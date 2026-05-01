"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const grammy_1 = require("grammy");
const conversations_1 = require("@grammyjs/conversations");
const commands_1 = require("./commands");
const bot = new grammy_1.Bot(process.env.BOT_TOKEN);
bot.use((0, conversations_1.conversations)());
// const bookingConversation = require("./conversations/bookingConversation");
// bot.use(createConversation(bookingConversation));
// const bookingConversationCalendar = require("./conversations/bookingConversationCalendar");
// bot.use(createConversation(bookingConversationCalendar));
(0, commands_1.registerCommands)(bot);
bot.on("message:text", async (ctx) => {
    const text = ctx.message.text;
    if (text == "/start")
        return;
    if (text.startsWith("/"))
        return;
    await ctx.reply(`You wrote: ${ctx.message.text}`);
});
bot.catch((err) => {
    console.error("Bot error:", err);
});
bot.start();
