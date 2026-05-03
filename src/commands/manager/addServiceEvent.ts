import type { Composer } from "grammy";
import type { EContext } from "../../types";

export function registerAddServiceCommand(composer: Composer<EContext>) {
  composer.command("add_service", async (ctx) => {
    await ctx.conversation.enter("addServiceEventConversation");
  });
}
