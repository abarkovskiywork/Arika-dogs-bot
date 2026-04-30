require("dotenv").config();
const { Bot } = require("grammy");
const { conversations, createConversation } = require("@grammyjs/conversations");

const bot = new Bot(process.env.BOT_TOKEN);

bot.use(conversations());

const bookingConversation = require("./conversations/bookingConversation");
bot.use(createConversation(bookingConversation));

const bookingConversationCalendar = require("./conversations/bookingConversationCalendar");
bot.use(createConversation(bookingConversationCalendar));

require("./commands/myid")(bot);
require("./conversations/testBookingConversation")(bot);
require("./handlers/adminActions")(bot);
require("./commands/book")(bot);
require("./commands/addServiceEvent")(bot);

bot.command("start", (ctx) => ctx.reply("Test"));

bot.on("message:text", async (ctx) => {
    const text = ctx.message.text;
    if ( text == "/start") return;
    if ( text.startsWith("/")) return;
    
    await ctx.reply(`You wrote: ${ctx.message.text}`);
    
})

bot.catch((err) => {
    console.error("Bot error:", err);
});

bot.start();