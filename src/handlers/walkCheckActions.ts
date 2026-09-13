import type { Bot } from "grammy";
import type { EContext } from "../types";
import { dateKeyToUtcDate, isManager } from "../utils/utils";
import { getCheckDate } from "../utils/checkDate";
import { upsertReminderWalkLog } from "../db/walkLogData";

export function registerWalkCheckActions(bot: Bot<EContext>): void {
  bot.callbackQuery(/^walk:(\d+):(\d+)(?::(\d{4}-\d{2}-\d{2}))?$/, async (ctx) => {
    if (!ctx.from || !isManager(ctx.from.id)) {
      return ctx.answerCallbackQuery({
        text: "prohibited",
        show_alert: true,
      });
    }

    const serviceEventId = Number(ctx.match[1]);
    const walksCount = Number(ctx.match[2]);

    const todayKey = getCheckDate(ctx, ctx.match[3])
    const today = dateKeyToUtcDate(todayKey)

    console.log(serviceEventId, walksCount)
    await upsertReminderWalkLog({ serviceEventId, date: today, walksCount });

    await ctx.answerCallbackQuery(`Отмечено: ${walksCount}`);

    await ctx.editMessageText(
      `✅ Записал за ${todayKey}: ${walksCount} прогулок`
    );
  });
}
