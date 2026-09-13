import type { Bot } from "grammy";
import { InlineKeyboard } from "grammy";
import { ServiceType } from "@prisma/client";
import type { EContext } from "../types";
import { isManager, toDayDate } from "../utils/utils";
import { getServiceEventById } from "../db/serviceEventData";
import { upsertReminderWalkLog, sumCompletedWalkLogs } from "../db/walkLogData";
import { CLEANING_DURATIONS } from "../utils/constants";
import { getCheckDate } from "../utils/checkDate";

export function registerCheckEventActions(bot: Bot<EContext>): void {
  bot.callbackQuery(/^checkview:(\d+)(?::(\d{4}-\d{2}-\d{2}))?$/, async (ctx) => {
    if (!ctx.from || !isManager(ctx.from.id)) {
      return ctx.answerCallbackQuery({ text: "prohibited", show_alert: true });
    }

    const id = Number(ctx.match[1]);
    const dateKey = getCheckDate(ctx, ctx.match[2]);
    const event = await getServiceEventById(id);

    if (!event) {
      return ctx.answerCallbackQuery({ text: "Событие не найдено", show_alert: true });
    }

    await ctx.answerCallbackQuery();

    if (event.serviceType === ServiceType.walk) {
      const keyboard = new InlineKeyboard();
      for (let i = 0; i <= event.walksPerDay; i++) {
        keyboard.text(`${i}`, `checkdo:${id}:${i}:${dateKey}`);
      }
      await ctx.editMessageText(`${event.dogName}: сколько прогулок за ${dateKey}?`, {
        reply_markup: keyboard,
      });
    } else if (event.serviceType === ServiceType.cleaning) {
      const keyboard = new InlineKeyboard();
      CLEANING_DURATIONS.forEach(({ label, minutes }, i) => {
        keyboard.text(label, `rem_c:${id}:${minutes}:${dateKey}`);
        if ((i + 1) % 3 === 0) keyboard.row();
      });
      await ctx.editMessageText(`${event.dogName}: сколько длилась уборка за ${dateKey}?`, {
        reply_markup: keyboard,
      });
    } else {
      await ctx.editMessageText(`${event.dogName}, ${dateKey}\nОтметить как:`, {
        reply_markup: new InlineKeyboard()
          .text("✅ Выполнено", `checkdo:${id}:1:${dateKey}`)
          .text("❌ Отмена", `checkdo:${id}:0:${dateKey}`),
      });
    }
  });

  bot.callbackQuery(/^checkdo:(\d+):(\d+)(?::(\d{4}-\d{2}-\d{2}))?$/, async (ctx) => {
    if (!ctx.from || !isManager(ctx.from.id)) {
      return ctx.answerCallbackQuery({ text: "Не для тебя 😌", show_alert: true });
    }

    const id = Number(ctx.match[1]);
    const walksCount = Number(ctx.match[2]);

    const event = await getServiceEventById(id);
    if (!event) {
      return ctx.answerCallbackQuery({ text: "Событие не найдено", show_alert: true });
    }

    const todayKey = getCheckDate(ctx, ctx.match[3]);
    const today = toDayDate(todayKey);

    await upsertReminderWalkLog({ serviceEventId: id, date: today, walksCount });

    const resultLabel =
      event.serviceType === ServiceType.walk
        ? walksCount > 0 ? `✅ ${walksCount}` : "❌ 0"
        : walksCount > 0 ? "✅ Выполнено" : "❌ Отмена";

    const endKey = event.endDate.toISOString().slice(0, 10);
    const isLastDay = endKey === todayKey;

    if (isLastDay) {
      const totalWalks = await sumCompletedWalkLogs(id);
      const earnings = event.price * totalWalks;

      await ctx.answerCallbackQuery();
      await ctx.editMessageText(
        `${resultLabel}\n\n` +
          `🎉 Услуга для ${event.dogName} завершена ${todayKey}!\n` +
          `Выполнено прогулок: ${totalWalks}\n` +
          `Заработано: ${earnings} 💰`
      );
    } else {
      await ctx.answerCallbackQuery(resultLabel);
      await ctx.editMessageText(`${todayKey}: ${resultLabel}`);
    }
  });
}
