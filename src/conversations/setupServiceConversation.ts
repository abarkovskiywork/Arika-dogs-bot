import { InlineKeyboard } from "grammy";
import { ServiceType, TrackingMode } from "@prisma/client";
import type { Conversation } from "@grammyjs/conversations";
import { getNeedsSetupServiceEvents, updateServiceEvent } from "../db/serviceEventData";
import type { EContext } from "../types";
import {
  askServiceType,
  askPrice,
  askWalksPerDay,
  askTrackingMode,
} from "./addServiceEventConversation";

type SetupConversation = Conversation<EContext, EContext>;

export async function setupServiceConversation(
  conversation: SetupConversation,
  ctx: EContext
): Promise<void> {
  const events = await getNeedsSetupServiceEvents();

  if (!events.length) {
    await ctx.reply("Нет событий, требующих настройки. ✅");
    return;
  }

  const keyboard = new InlineKeyboard();
  events.forEach((e, i) => {
    const start = e.startDate.toISOString().slice(0, 10);
    const end = e.endDate.toISOString().slice(0, 10);
    keyboard.text(`${e.dogName} (${start} — ${end})`, `setup_sel:${e.id}`);
    if ((i + 1) % 2 === 0) keyboard.row();
  });

  await ctx.reply("Выбери событие для настройки:", { reply_markup: keyboard });

  const cb = await conversation.waitFor("callback_query:data");
  await cb.answerCallbackQuery();

  const match = cb.callbackQuery.data.match(/^setup_sel:(\d+)$/);
  if (!match) {
    await ctx.reply("Неверный выбор. Запусти /setup_services заново.");
    return;
  }

  const id = Number(match[1]);
  const event = events.find((e) => e.id === id);
  if (!event) {
    await ctx.reply("Событие не найдено. Запусти /setup_services заново.");
    return;
  }

  await cb.editMessageText(`Настраиваем: ${event.dogName}`);

  const serviceType = await askServiceType(conversation, ctx);
  if (!serviceType) return;

  const price = await askPrice(conversation, ctx);
  if (price === null) return;

  let walksPerDay = 1;
  let trackingMode: TrackingMode = TrackingMode.auto_done;

  if (serviceType === ServiceType.walk) {
    const walks = await askWalksPerDay(conversation, ctx);
    if (walks === null) return;
    walksPerDay = walks;
  }

  if (serviceType === ServiceType.walk || serviceType === ServiceType.cleaning) {
    const mode = await askTrackingMode(conversation, ctx);
    if (!mode) return;
    trackingMode = mode;
  }

  await updateServiceEvent(id, {
    serviceType,
    price,
    walksPerDay,
    trackingMode,
    needsSetup: false,
  });

  await ctx.reply(
    `✅ Настройка завершена для ${event.dogName}\n` +
      `Тип: ${serviceType}\n` +
      `Цена: ${price}\n` +
      (serviceType === ServiceType.walk
        ? `В день: ${walksPerDay}\nРежим: ${trackingMode}\n`
        : "")
  );
}
