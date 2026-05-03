import type { MiddlewareFn } from "grammy";
import type { EContext } from "../types";
import { isManager } from "../utils/utils";

export const managerRole: MiddlewareFn<EContext> = async (ctx, next) => {
  if (!ctx.from || !isManager(ctx.from.id)) {
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
