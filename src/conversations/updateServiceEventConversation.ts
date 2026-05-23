import { InlineKeyboard } from "grammy";
import { ServiceType, TrackingMode } from "@prisma/client";
import type { Conversation } from "@grammyjs/conversations";
import { getAllServiceEvents, updateServiceEvent } from "../db/serviceEventData";
import type { EContext } from "../types";
import {
  askDogName,
  askServiceType,
  askPrice,
  askWalksPerDay,
  askTrackingMode,
} from "./addServiceEventConversation";

type UpdateConversation = Conversation<EContext, EContext>;

async function selectServiceToUpdate(
  conversation: UpdateConversation,
  ctx: EContext
): Promise<number | null> {
  const services = await getAllServiceEvents();

  if (!services.length) {
    await ctx.reply("Нет сервисов.");
    return null;
  }

  const keyboard = new InlineKeyboard();

  services.forEach((s, i) => {
    const label = `${s.isActive ? "" : "⏸ "}#${s.id} ${s.dogName} (${s.serviceType})`;
    keyboard.text(label, `upd_sel:${s.id}`);
    if ((i + 1) % 2 === 0) keyboard.row();
  });

  await ctx.reply("Какой сервис обновить?", { reply_markup: keyboard });

  const cb = await conversation.waitFor("callback_query:data");
  await cb.answerCallbackQuery();

  const id = Number(cb.callbackQuery.data.replace("upd_sel:", ""));
  const chosen = services.find((s) => s.id === id);

  if (!chosen) {
    await ctx.reply("Неверный выбор. Запусти /update_service заново.");
    return null;
  }

  await cb.editMessageText(`Обновляем: #${chosen.id} ${chosen.dogName}`);
  return id;
}

async function askIsActive(
  conversation: UpdateConversation,
  ctx: EContext
): Promise<boolean | null> {
  await ctx.reply("Статус сервиса:", {
    reply_markup: new InlineKeyboard()
      .text("✅ Активен", "upd_active:true")
      .text("⏸ Неактивен", "upd_active:false"),
  });

  const cb = await conversation.waitFor("callback_query:data");
  await cb.answerCallbackQuery();

  const value = cb.callbackQuery.data.replace("upd_active:", "");
  await cb.editMessageText(`Статус: ${value === "true" ? "активен" : "неактивен"}`);
  return value === "true";
}

export async function updateServiceEventConversation(
  conversation: UpdateConversation,
  ctx: EContext
): Promise<void> {
  const id = await selectServiceToUpdate(conversation, ctx);
  if (id === null) return;

  const dogName = await askDogName(conversation, ctx);
  if (!dogName) return;

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

    const mode = await askTrackingMode(conversation, ctx);
    if (!mode) return;
    trackingMode = mode;
  }

  const isActive = await askIsActive(conversation, ctx);
  if (isActive === null) return;

  const updated = await updateServiceEvent(id, {
    dogName,
    serviceType,
    price,
    walksPerDay,
    trackingMode,
    isActive,
  });

  await ctx.reply(
    `✅ Сервис #${updated.id} обновлён\n` +
      `Собака: ${updated.dogName}\n` +
      `Тип: ${updated.serviceType}\n` +
      `Цена: ${updated.price}\n` +
      (updated.serviceType === ServiceType.walk
        ? `В день: ${updated.walksPerDay}\nРежим: ${updated.trackingMode}\n`
        : "") +
      `Статус: ${updated.isActive ? "активен" : "неактивен"}`
  );
}
