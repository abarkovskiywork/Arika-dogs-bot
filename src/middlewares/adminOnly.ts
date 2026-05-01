import type { MiddlewareFn } from "grammy";
import type { EContext } from "../types";
import { isAllowed } from "../utils/utils";

export const adminOnly: MiddlewareFn<EContext> = async (ctx, next) => {
  if (!ctx.from || !isAllowed(ctx.from.id)) {
    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery({
        text: "Не для тебя 😌",
        show_alert: true,
      });
      return;
    }

    await ctx.reply("Не для тебя 😌");
    return;
  }

  return next();
};