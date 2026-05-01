import type { Composer } from "grammy"
import { EContext } from "../types";

export function registerStartCommand(composer: Composer<EContext>) {
    composer.command("start", (ctx) => ctx.reply("Test"));

}
