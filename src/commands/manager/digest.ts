import type { Composer } from "grammy";
import type { EContext } from "../../types";
import { buildDigestMessage } from "../../jobs/digestJob";

export function registerDigestCommand(composer: Composer<EContext>) {
  composer.command("digest", async (ctx) => {
    if (!ctx.from) return;
    const { text } = await buildDigestMessage(String(ctx.from.id));
    await ctx.reply(text, { parse_mode: "HTML" });
  });
}
