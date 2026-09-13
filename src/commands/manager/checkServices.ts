import { Composer, InlineKeyboard } from "grammy";
import type { EContext } from "../../types";
import { getTodayServiceEvents } from "../../db/serviceEventData";
import { getWalkLogsForEventToday } from "../../db/walkLogData";
import { getBelgradeDateKey, toDayDate } from "../../utils/utils";

export function registerCheckCommand(composer: Composer<EContext>) {
  composer.command("check", async (ctx) => {
    const todayKey = getBelgradeDateKey();
    const today = toDayDate(todayKey);
    const events = await getTodayServiceEvents();

    if (!events.length) {
      await ctx.reply("Сегодня нет активных услуг.");
      return;
    }

    const keyboard = new InlineKeyboard();

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const logsToday = await getWalkLogsForEventToday(event.id, today);
      const label = logsToday.length > 0 ? `✅ ${event.dogName}` : event.dogName;

      keyboard.text(label, `checkview:${event.id}:${todayKey}`);
      if ((i + 1) % 2 === 0) keyboard.row();
    }

    await ctx.reply("Выбери услугу для отметки:", { reply_markup: keyboard });
  });
}
