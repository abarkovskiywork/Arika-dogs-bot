import type { EContext } from "../types";
import { getBelgradeDateKey, isValidDate } from "./utils";

// Older buttons have no date: Telegram retains the original message send time.
export function getCheckDate(ctx: EContext, explicitDate?: string): string {
  const sentAt = ctx.callbackQuery?.message?.date;
  const date = explicitDate ?? (sentAt ? getBelgradeDateKey(new Date(sentAt * 1000)) : undefined);
  if (!date || !isValidDate(date)) throw new Error("Не удалось определить дату отметки");
  return date;
}
