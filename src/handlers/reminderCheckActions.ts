import type { Bot } from "grammy";
import { InlineKeyboard } from "grammy";
import { ServiceType } from "@prisma/client";
import { getServiceEventById, getTodayAskDailyServiceEvents } from "../db/serviceEventData";
import { upsertReminderWalkLog } from "../db/walkLogData";
import type { EContext } from "../types";
import { getBelgradeDateKey, isManager, toDayDate } from "../utils/utils";
import { CLEANING_DURATIONS } from "../utils/constants";

type ServiceWithTodayLogs = Awaited<ReturnType<typeof getTodayAskDailyServiceEvents>>[number];


export function buildReminderContent(services: ServiceWithTodayLogs[]) {
  const pending = services.filter((s) => s.walkLogs.length === 0);
  const done = services.filter((s) => s.walkLogs.length > 0);

  const doneText = done.length > 0
    ? "\n\n" + done.map((s) => `✅ ${s.dogName}`).join("\n")
    : "";

  const keyboard = new InlineKeyboard();

  if (pending.length === 0) {
    return { text: `🔔 Всё отмечено!${doneText}`, keyboard };
  }

  pending.forEach((s, i) => {
    keyboard.text(s.dogName, `rem_s:${s.id}`);
    if ((i + 1) % 2 === 0) keyboard.row();
  });

  return { text: `🔔 Отметь события:${doneText}`, keyboard };
}

export function registerReminderCheckActions(bot: Bot<EContext>): void {
  bot.callbackQuery(/^rem_s:(\d+)$/, async (ctx) => {
    if (!ctx.from || !isManager(ctx.from.id)) {
      return ctx.answerCallbackQuery({ text: "prohibited", show_alert: true });
    }

    const id = Number(ctx.match[1]);
    const service = await getServiceEventById(id);
    if (!service) {
      return ctx.answerCallbackQuery({ text: "Событие не найдено", show_alert: true });
    }

    await ctx.answerCallbackQuery();

    if (service.serviceType === ServiceType.walk) {
      const keyboard = new InlineKeyboard();
      for (let i = 0; i <= service.walksPerDay; i++) {
        keyboard.text(`${i}`, `rem_w:${id}:${i}`);
      }
      await ctx.editMessageText(`${service.dogName}: сколько прогулок сегодня?`, {
        reply_markup: keyboard,
      });
    } else if (service.serviceType === ServiceType.cleaning) {
      ctx.session.cleaningNote = {
        serviceId: service.id
      }
      await ctx.conversation.enter("cleaningNoteConversation", {serivceId: service.id})
    }
  });

  bot.callbackQuery(/^rem_w:(\d+):(\d+)$/, async (ctx) => {
    if (!ctx.from || !isManager(ctx.from.id)) {
      return ctx.answerCallbackQuery({ text: "prohibited", show_alert: true });
    }

    const serviceId = Number(ctx.match[1]);
    const walksCount = Number(ctx.match[2]);
    const today = toDayDate(getBelgradeDateKey());

    await upsertReminderWalkLog({ serviceEventId: serviceId, date: today, walksCount });
    await ctx.answerCallbackQuery();

    const services = await getTodayAskDailyServiceEvents();
    const { text, keyboard } = buildReminderContent(services);
    await ctx.editMessageText(text, { reply_markup: keyboard });
  });

  bot.callbackQuery(/^rem_c:(\d+):(\d+)$/, async (ctx) => {
    if (!ctx.from || !isManager(ctx.from.id)) {
      return ctx.answerCallbackQuery({ text: "prohibited", show_alert: true });
    }

    const serviceId = Number(ctx.match[1]);
    const durationMinutes = Number(ctx.match[2]);
    const walksCount = durationMinutes > 0 ? 1 : 0;
    const today = toDayDate(getBelgradeDateKey());

    await upsertReminderWalkLog({ serviceEventId: serviceId, date: today, walksCount, durationMinutes });
    await ctx.answerCallbackQuery();

    const services = await getTodayAskDailyServiceEvents();
    const { text, keyboard } = buildReminderContent(services);
    await ctx.editMessageText(text, { reply_markup: keyboard });
  });
}
