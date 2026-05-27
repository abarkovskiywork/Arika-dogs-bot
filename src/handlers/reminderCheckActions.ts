import type { Bot } from "grammy";
import { InlineKeyboard } from "grammy";
import { ServiceType } from "@prisma/client";
import { getServiceEventById, getTodayAskDailyServiceEvents } from "../db/serviceEventData";
import { upsertReminderWalkLog } from "../db/walkLogData";
import type { EContext } from "../types";
import { getBelgradeDateKey, isManager, toDayDate } from "../utils/utils";

type ServiceWithTodayLogs = Awaited<ReturnType<typeof getTodayAskDailyServiceEvents>>[number];

const CLEANING_DURATIONS = [
  { label: "0 мин",   minutes: 0 },
  { label: "15 мин",  minutes: 15 },
  { label: "30 мин",  minutes: 30 },
  { label: "1 час",   minutes: 60 },
  { label: "1.5 ч",   minutes: 90 },
  { label: "2 часа",  minutes: 120 },
] as const;

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

  return { text: `🔔 Отметь прогулки:${doneText}`, keyboard };
}

export function registerReminderCheckActions(bot: Bot<EContext>): void {
  bot.callbackQuery(/^rem_s:(\d+)$/, async (ctx) => {
    if (!ctx.from || !isManager(ctx.from.id)) {
      return ctx.answerCallbackQuery({ text: "Не для тебя 😌", show_alert: true });
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
    } else {
      const keyboard = new InlineKeyboard();
      CLEANING_DURATIONS.forEach(({ label, minutes }, i) => {
        keyboard.text(label, `rem_c:${id}:${minutes}`);
        if ((i + 1) % 3 === 0) keyboard.row();
      });
      await ctx.editMessageText(`${service.dogName}: сколько длилась уборка?`, {
        reply_markup: keyboard,
      });
    }
  });

  bot.callbackQuery(/^rem_w:(\d+):(\d+)$/, async (ctx) => {
    if (!ctx.from || !isManager(ctx.from.id)) {
      return ctx.answerCallbackQuery({ text: "Не для тебя 😌", show_alert: true });
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
      return ctx.answerCallbackQuery({ text: "Не для тебя 😌", show_alert: true });
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
