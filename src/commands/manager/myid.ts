import type { Composer } from "grammy"
import { EContext } from "../../types";

export function registerMyIdCommand(composer: Composer<EContext>) {
    composer.command("myid", async (ctx) => {
        console.log(ctx?.from?.id)
        await ctx.reply(`Your id: ${ctx?.from?.id}`);
    });
}
