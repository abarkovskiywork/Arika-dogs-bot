import { InlineKeyboard } from "grammy";
import type { Conversation } from "@grammyjs/conversations";
import { getActiveServiceEvents } from "../db/serviceEventData";
import { getBelgradeDateKey, isValidDate } from "../utils/utils";
import type { EContext } from "../types";

type AnyConversation = Conversation<EContext, EContext>;

export type ServicePeriodInput = {
  serviceIds: number[];
  startDate: string;
  endDate: string;
};

export async function collectServicePeriod(
  conversation: AnyConversation,
  ctx: EContext,
  periodSelection: "dates" | "months" = "dates"
): Promise<ServicePeriodInput | null> {
  const services = await getActiveServiceEvents();

  if (!services.length) {
    await ctx.reply("Нет активных сервисов.");
    return null;
  }

  const keyboard = new InlineKeyboard()
    //.text("Все", "srv_sel:all")
    //.text("Список", "srv_sel:list")
    //.row();

  services.forEach((s, i) => {
    keyboard.text(`#${s.id} ${s.dogName} (${s.serviceType})`, `srv_sel:${s.id}`);
    if ((i + 1) % 2 === 0) keyboard.row();
  });

  await ctx.reply("Выбери сервис:", { reply_markup: keyboard });

  const cb = await conversation.waitFor("callback_query:data");
  await cb.answerCallbackQuery();

  const data = cb.callbackQuery.data;
  let serviceIds: number[];

  if (data === "srv_sel:all") {
    serviceIds = services.map((s) => s.id);
    await cb.editMessageText("Выбрано: все сервисы");
  } else if (data === "srv_sel:list") {
    await cb.editMessageText("Ввод списка ID...");
    const hint = services.map((s) => `${s.id} (${s.dogName})`).join(", ");
    await ctx.reply(`Введи ID через пробел или запятую:\nДоступные: ${hint}`);

    const textCtx = await conversation.waitFor("message:text");
    const raw = textCtx.message.text;
    const parsed = raw
      .split(/[\s,]+/)
      .map(Number)
      .filter((n) => !Number.isNaN(n) && n > 0);

    const validIds = new Set(services.map((s) => s.id));
    serviceIds = parsed.filter((id) => validIds.has(id));

    if (!serviceIds.length) {
      await ctx.reply("Не нашла ни одного корректного ID. Запусти команду заново.");
      return null;
    }
  } else {
    const id = Number(data.replace("srv_sel:", ""));
    const chosen = services.find((s) => s.id === id);

    if (!chosen) {
      await ctx.reply("Неверный выбор. Запусти команду заново.");
      return null;
    }

    serviceIds = [id];
    await cb.editMessageText(`Выбрано: #${chosen.id} ${chosen.dogName}`);
  }

  if (periodSelection === "months") {
    // Keep the offered months stable when the conversation is replayed.
    const today = await conversation.external(() => getBelgradeDateKey());
    const [year, month] = today.split("-").map(Number);
    const formatter = new Intl.DateTimeFormat("ru-RU", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
    const months = Array.from({ length: 5 }, (_, offset) => {
      const start = new Date(Date.UTC(year, month - 1 - offset, 1));
      const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0));
      const startDate = start.toISOString().slice(0, 10);
      const label = formatter.format(start);
      return {
        label: label.charAt(0).toUpperCase() + label.slice(1),
        data: `srv_month:${startDate.slice(0, 7)}`,
        startDate,
        endDate: end.toISOString().slice(0, 10),
      };
    });
    const monthKeyboard = new InlineKeyboard();
    for (const month of months) {
      monthKeyboard.text(month.label, month.data).row();
    }
    const prompt = await ctx.reply("Выбери месяц:", { reply_markup: monthKeyboard });

    while (true) {
      const monthCtx = await conversation.waitFor("callback_query:data");
      const chosen = months.find((month) => month.data === monthCtx.callbackQuery.data);
      if (!chosen || monthCtx.callbackQuery.message?.message_id !== prompt.message_id) {
        await monthCtx.answerCallbackQuery({ text: "Выбери месяц на кнопках ниже." });
        continue;
      }
      await monthCtx.answerCallbackQuery();
      await monthCtx.editMessageText(`Месяц: ${chosen.label}`);
      return { serviceIds, startDate: chosen.startDate, endDate: chosen.endDate };
    }
  }

  await ctx.reply("Дата начала? Формат YYYY-MM-DD");
  const startCtx = await conversation.waitFor("message:text");
  const startDate = startCtx.message.text.trim();

  if (!isValidDate(startDate)) {
    await ctx.reply("Неверная дата начала. Запусти команду заново.");
    return null;
  }

  await ctx.reply("Дата конца? Формат YYYY-MM-DD");
  const endCtx = await conversation.waitFor("message:text");
  const endDate = endCtx.message.text.trim();

  if (!isValidDate(endDate)) {
    await ctx.reply("Неверная дата конца. Запусти команду заново.");
    return null;
  }

  return { serviceIds, startDate, endDate };
}
