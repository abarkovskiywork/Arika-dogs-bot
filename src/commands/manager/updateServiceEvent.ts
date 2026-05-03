import type { Composer } from "grammy";
import { createConversation } from "@grammyjs/conversations";
import { updateServiceEventConversation } from "../../conversations/updateServiceEventConversation";
import type { EContext } from "../../types";

export function registerUpdateServiceCommand(composer: Composer<EContext>) {
  composer.use(createConversation(updateServiceEventConversation));

  composer.command("update_service", async (ctx) => {
    await ctx.conversation.enter("updateServiceEventConversation");
  });
}
