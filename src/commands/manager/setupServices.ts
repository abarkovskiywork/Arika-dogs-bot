import { Composer } from "grammy";
import type { EContext } from "../../types";

export function registerSetupServicesCommand(composer: Composer<EContext>) {
  composer.command("setup_services", async (ctx) => {
    await ctx.conversation.enter("setupServiceConversation");
  });
}
