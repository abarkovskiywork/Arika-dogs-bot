import type { Composer } from "grammy";
import { syncServices } from "../../jobs/serviceSyncJob";
import type { EContext } from "../../types";


export function registerSyncServicesCommand(composer: Composer<EContext>): void {
  composer.command("sync_services", async (ctx) => {

    const result = await syncServices();

    return ctx.reply(
      `Sync done.\n` +
      `Checked: ${result.checked}\n` +
      `Deactivated: ${result.deactivated}\n` +
      `Errors: ${result.errors}`
    );
  });
}