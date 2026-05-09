import type { Bot } from "grammy";
import { InlineKeyboard } from "grammy";
import type { EContext } from "../types";
import { isManager, getBelgradeDateKey, toDayDate } from "../utils/utils";
import { getServiceEventById } from "../db/serviceEventData";
import {
  getWalkLogsForEventToday,
  createWalkLogEntry,
  countCompletedWalkLogs,
} from "../db/walkLogData";

export function registerCheckEventActions(bot: Bot<EContext>): void {
  // Show check/cancel buttons for a specific event
  bot.callbackQuery(/^checkview:(\d+)$/, async (ctx) => {
    if (!ctx.from || !isManager(ctx.from.id)) {
      return ctx.answerCallbackQuery({ text: "Не для тебя 😌", show_alert: true });
    }

    const id = Number(ctx.match[1]);
    const event = await getServiceEventById(id);

    if (!event) {
      return ctx.answerCallbackQuery({ text: "Событие не найдено", show_alert: true });
    }

    const todayKey = getBelgradeDateKey();
    const today = toDayDate(todayKey);
    const logsToday = await getWalkLogsForEventToday(id, today);
    const walkNumber = logsToday.length + 1;

    if (walkNumber > event.walksPerDay) {
      return ctx.answerCallbackQuery({
        text: "Все прогулки на сегодня уже отмечены ✅",
        show_alert: true,
      });
    }

    const label =
      event.walksPerDay > 1
        ? `${event.dogName} — прогулка ${walkNumber}/${event.walksPerDay}`
        : event.dogName;

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(`${label}\nОтметить как:`, {
      reply_markup: new InlineKeyboard()
        .text("✅ Выполнено", `checkdo:${id}:1`)
        .text("❌ Отмена", `checkdo:${id}:0`),
    });
  });

  // Record the check or cancel action
  bot.callbackQuery(/^checkdo:(\d+):(0|1)$/, async (ctx) => {
    if (!ctx.from || !isManager(ctx.from.id)) {
      return ctx.answerCallbackQuery({ text: "Не для тебя 😌", show_alert: true });
    }

    const id = Number(ctx.match[1]);
    const completed = ctx.match[2] === "1";

    const event = await getServiceEventById(id);
    if (!event) {
      return ctx.answerCallbackQuery({ text: "Событие не найдено", show_alert: true });
    }

    const todayKey = getBelgradeDateKey();
    const today = toDayDate(todayKey);

    await createWalkLogEntry({ serviceEventId: id, date: today, walksCount: 1, completed });

    const resultLabel = completed ? "✅ Выполнено" : "❌ Отмена";

    const endKey = getBelgradeDateKey(event.endDate);
    const isLastDay = endKey === todayKey;

    if (isLastDay) {
      const completedCount = await countCompletedWalkLogs(id);
      const earnings = event.price * completedCount;

      await ctx.answerCallbackQuery();
      await ctx.editMessageText(
        `${resultLabel}\n\n` +
          `🎉 Услуга для ${event.dogName} завершена сегодня!\n` +
          `Выполнено прогулок: ${completedCount}\n` +
          `Заработано: ${earnings} 💰`
      );
    } else {
      await ctx.answerCallbackQuery(resultLabel);
      await ctx.editMessageText(resultLabel);
    }
  });
}
