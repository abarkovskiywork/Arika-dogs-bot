import type { Composer } from "grammy";
import type { EContext } from "../../types";
import { dateKeyToUtcDate, getBelgradeDateKey, getBelgradeTime, toDayDate, todayDateBG } from "../../utils/utils";

export function registerAdminTestTime(composer: Composer<EContext>) {
  composer.command("admin_test_time", async (ctx) => {
    
    const text = `new Date(): ${new Date()} \n` +
        `getBelgradeDateKey: ${getBelgradeDateKey()} \n` +
        `getBelgradeTime: ${getBelgradeTime()} \n` +
        `dateKeyToUtcDate(getBelgradeDateKey): ${dateKeyToUtcDate(getBelgradeDateKey())} \n` +
        `todayDateBG: ${todayDateBG()} \n` + 
        `toDayDate: ${toDayDate(getBelgradeDateKey())}`
    return ctx.reply(text);
  });
}
