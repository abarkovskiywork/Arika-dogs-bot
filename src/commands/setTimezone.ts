

import type { Composer } from "grammy"
import { EContext } from "../types";

export function registerStartCommand(composer: Composer<EContext>) {
    composer.command("set_timezone", async (ctx) => {
        await ctx.reply("Скинь свою локацию 📍", {
            reply_markup: {
                keyboard: [
                    [{ text: "Отправить локацию", request_location: true }],
                ],
                resize_keyboard: true,
                one_time_keyboard: true,
            },
        });
    });

}

