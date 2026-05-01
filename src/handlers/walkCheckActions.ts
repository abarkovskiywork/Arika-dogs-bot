import type { Bot } from "grammy";
import { prisma } from "../db/prisma";
import type { EContext } from "../types";
import { dateKeyToUtcDate, getBelgradeDateKey, isAllowed } from "../utils/utils";

export function registerWalkCheckActions(bot: Bot<EContext>): void {
  bot.callbackQuery(/^walk:(\d+):(\d+)$/, async (ctx) => {
    if (!ctx.from || !isAllowed(ctx.from.id)) {
      return ctx.answerCallbackQuery({
        text: "Не для тебя 😌",
        show_alert: true,
      });
    }

    const serviceEventId = Number(ctx.match[1]);
    const walksCount = Number(ctx.match[2]);

    const todayKey = getBelgradeDateKey()
    const today = dateKeyToUtcDate(todayKey)

    console.log(serviceEventId, walksCount)
    await prisma.walkLog.upsert({
      where: {
        serviceEventId_date: {
          serviceEventId,
          date: today,
        },
      },
      update: {
        walksCount,
      },
      create: {
        serviceEventId,
        date: today,
        walksCount
      },
    });

    await ctx.answerCallbackQuery(`Отмечено: ${walksCount}`);

    await ctx.editMessageText(
      `✅ Записала: ${walksCount} прогулок`
    );
  });
}