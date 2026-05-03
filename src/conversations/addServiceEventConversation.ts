import { InlineKeyboard } from "grammy";
import type { Conversation } from "@grammyjs/conversations";
import type { EContext } from "../types";
import { createServiceEventWithDb } from "../services/googleCalendarService";
import { CALENDAR_COLORS, SERVICE_TYPES, TRACKING_MODES } from "../utils/constants";
import { isValidDate, isValidTime } from "../utils/utils";

type AddServiceConversation = Conversation<EContext, EContext>;


export async function waitText(conversation: AddServiceConversation): Promise<string> {
  const ctx = await conversation.waitFor("message:text");
  return ctx.message.text.trim();
}

export async function askDogName(conversation: AddServiceConversation, ctx: EContext): Promise<string | null> {
  await ctx.reply("Имя собаки?");
  return waitText(conversation);
}

export async function askServiceType(conversation: AddServiceConversation, ctx: EContext): Promise<string | null> {
  await ctx.reply("Тип услуги:", {
    reply_markup: new InlineKeyboard()
      .text("Выгул", "service:walk")
      .text("Передержка", "service:boarding")
      .row()
      .text("Визит домой", "service:home_visit"),
  });

  const cb = await conversation.waitFor("callback_query:data");
  await cb.answerCallbackQuery();

  const serviceType = cb.callbackQuery.data.replace("service:", "");

  if (!SERVICE_TYPES.includes(serviceType as (typeof SERVICE_TYPES)[number])) {
    await ctx.reply("Неверный тип услуги. Запусти /addservice заново.");
    return null;
  }

  await cb.editMessageText(`Тип услуги: ${serviceType}`);
  return serviceType;
}

export async function askPrice(conversation: AddServiceConversation, ctx: EContext): Promise<number | null> {
  await ctx.reply("Цена за день/услугу? Например: 10");
  const raw = await waitText(conversation);
  const price = Number(raw);

  if (Number.isNaN(price)) {
    await ctx.reply("Цена должна быть числом. Запусти /addservice заново.");
    return null;
  }

  return price;
}

export async function askWalksPerDay(conversation: AddServiceConversation, ctx: EContext): Promise<number | null> {
  await ctx.reply("Сколько прогулок в день? Например: 2");
  const raw = await waitText(conversation);
  const walksPerDay = Number(raw);

  if (!Number.isInteger(walksPerDay) || walksPerDay < 1) {
    await ctx.reply("Количество должно быть целым числом больше 0. Запусти /addservice заново.");
    return null;
  }

  return walksPerDay;
}

export async function askTrackingMode(conversation: AddServiceConversation, ctx: EContext): Promise<string | null> {
  await ctx.reply("Режим трекинга:", {
    reply_markup: new InlineKeyboard()
      .text("По умолчанию выполнено", "tracking:auto_done")
      .row()
      .text("Спрашивать каждый день", "tracking:ask_daily"),
  });

  const cb = await conversation.waitFor("callback_query:data");
  await cb.answerCallbackQuery();

  const trackingMode = cb.callbackQuery.data.replace("tracking:", "");

  if (!TRACKING_MODES.includes(trackingMode as (typeof TRACKING_MODES)[number])) {
    await ctx.reply("Неверный режим. Запусти /addservice заново.");
    return null;
  }

  await cb.editMessageText(`Режим: ${trackingMode}`);
  return trackingMode;
}

export async function askCheckTime(conversation: AddServiceConversation, ctx: EContext): Promise<string | null> {
  await ctx.reply("Во сколько спрашивать каждый день? Формат HH:mm, например 22:00");
  const checkTime = await waitText(conversation);

  if (!isValidTime(checkTime)) {
    await ctx.reply("Время должно быть в формате HH:mm. Запусти /addservice заново.");
    return null;
  }

  return checkTime;
}

async function askEventMode(conversation: AddServiceConversation, ctx: EContext): Promise<boolean | null> {
  await ctx.reply("Тип события:", {
    reply_markup: new InlineKeyboard()
      .text("All day", "mode:all_day")
      .text("С временем", "mode:timed"),
  });

  const cb = await conversation.waitFor("callback_query:data");
  await cb.answerCallbackQuery();

  const mode = cb.callbackQuery.data.replace("mode:", "");
  await cb.editMessageText(`Тип события: ${mode}`);
  return mode === "all_day";
}

async function askCalendarColor(conversation: AddServiceConversation, ctx: EContext): Promise<number | null> {
  const keyboard = new InlineKeyboard();

  CALENDAR_COLORS.forEach(({ id, emoji }, i) => {
    keyboard.text(emoji, `color:${id}`);
    if ((i + 1) % 4 === 0) keyboard.row();
  });

  await ctx.reply("Цвет в календаре:", { reply_markup: keyboard });

  const cb = await conversation.waitFor("callback_query:data");
  await cb.answerCallbackQuery();

  const colorId = Number(cb.callbackQuery.data.replace("color:", ""));
  const color = CALENDAR_COLORS.find((c) => c.id === colorId);

  if (!color) {
    await ctx.reply("Неверный цвет. Запусти /addservice заново.");
    return null;
  }

  await cb.editMessageText(`Цвет: ${color.emoji} ${color.label}`);
  return colorId;
}

async function askDateRange(
  conversation: AddServiceConversation,
  ctx: EContext
): Promise<{ startDate: string; endDate: string } | null> {
  await ctx.reply("Дата начала? Формат YYYY-MM-DD");
  const startDate = await waitText(conversation);

  if (!isValidDate(startDate)) {
    await ctx.reply("Дата начала неверная. Запусти /addservice заново.");
    return null;
  }

  await ctx.reply("Дата конца повторения? Формат YYYY-MM-DD");
  const endDate = await waitText(conversation);

  if (!isValidDate(endDate)) {
    await ctx.reply("Дата конца неверная. Запусти /addservice заново.");
    return null;
  }

  return { startDate, endDate };
}

async function askTimeRange(
  conversation: AddServiceConversation,
  ctx: EContext
): Promise<{ startTime: string; endTime: string } | null> {
  await ctx.reply("Время начала? Формат HH:mm");
  const startTime = await waitText(conversation);

  if (!isValidTime(startTime)) {
    await ctx.reply("Время начала неверное. Запусти /addservice заново.");
    return null;
  }

  await ctx.reply("Время конца? Формат HH:mm");
  const endTime = await waitText(conversation);

  if (!isValidTime(endTime)) {
    await ctx.reply("Время конца неверное. Запусти /addservice заново.");
    return null;
  }

  return { startTime, endTime };
}

export async function addServiceEventConversation(
  conversation: AddServiceConversation,
  ctx: EContext
): Promise<void> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!calendarId) {
    await ctx.reply("GOOGLE_CALENDAR_ID не задан в .env");
    return;
  }

  const dogName = await askDogName(conversation, ctx);
  if (!dogName) return;

  const serviceType = await askServiceType(conversation, ctx);
  if (!serviceType) return;

  const price = await askPrice(conversation, ctx);
  if (price === null) return;

  let walksPerDay = 1;
  let trackingMode = "auto_done";
  let checkTime: string | undefined;

  if (serviceType === "walk") {
    const walks = await askWalksPerDay(conversation, ctx);
    if (walks === null) return;
    walksPerDay = walks;

    const mode = await askTrackingMode(conversation, ctx);
    if (!mode) return;
    trackingMode = mode;

    if (trackingMode === "ask_daily") {
      const time = await askCheckTime(conversation, ctx);
      if (!time) return;
      checkTime = time;
    }
  }

  const isAllDay = await askEventMode(conversation, ctx);
  if (isAllDay === null) return;

  const colorId = await askCalendarColor(conversation, ctx);
  if (colorId === null) return;

  const dateRange = await askDateRange(conversation, ctx);
  if (!dateRange) return;

  let startTime: string | undefined;
  let endTime: string | undefined;

  if (!isAllDay) {
    const timeRange = await askTimeRange(conversation, ctx);
    if (!timeRange) return;
    ({ startTime, endTime } = timeRange);
  }

  const result = await createServiceEventWithDb({
    calendarId,
    dogName,
    serviceType,
    price,
    walksPerDay,
    trackingMode,
    checkTime,
    isAllDay,
    colorId,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    startTime,
    endTime,
  });

  await ctx.reply(
    `✅ Сервис создан\n` +
      `Собака: ${dogName}\n` +
      `Тип: ${serviceType}\n` +
      `Цена: ${price}\n` +
      (serviceType === "walk"
        ? `В день: ${walksPerDay}\nРежим: ${trackingMode}\nCheck time: ${checkTime ?? "-"}\n`
        : "") +
      `ID в БД: ${result.serviceEvent.id}\n` +
      `${result.calendarEvent.htmlLink ?? ""}`
  );
}
