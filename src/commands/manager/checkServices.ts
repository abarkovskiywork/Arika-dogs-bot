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
    let hasButtons = false;

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const logsToday = await getWalkLogsForEventToday(event.id, today);
      const doneCount = logsToday.length;

      if (doneCount >= event.walksPerDay) continue;

      const nextWalk = doneCount + 1;
      const label =
        event.walksPerDay > 1
          ? `${event.dogName} ${nextWalk}/${event.walksPerDay}`
          : event.dogName;

      keyboard.text(label, `checkview:${event.id}`);
      if (i % 2 === 1) keyboard.row();
      hasButtons = true;
    }

    if (!hasButtons) {
      await ctx.reply("Все услуги на сегодня уже отмечены! ✅");
      return;
    }

    await ctx.reply("Выбери услугу для отметки:", { reply_markup: keyboard });
  });
}
