import type { Composer } from "grammy";
import { getAllServiceEvents } from "../../db/serviceEventData";
import type { EContext } from "../../types";
import { todayDateBG } from "../../utils/utils";

export function registerAdminListServicesCommand(composer: Composer<EContext>) {
  composer.command("admin_list_services", async (ctx) => {
    const services = await getAllServiceEvents();

    if (!services.length) {
      return ctx.reply("Сервисов нет.");
    }

    const text = services
      .map((s) => {
        const old = s.endDate >= todayDateBG() ? " | 🟡 passed!" : ""
        return(`#${s.id} ${s.dogName} | ${s.serviceType} | ${s.price} | walks: ${s.walksPerDay} | mode: ${s.trackingMode} | checkTime: ${s.checkTime ?? "-"} | active: ${s.isActive ? "✅" : "❌"}${old}`)
      })
      .join("\n----------------\n");

    return ctx.reply(text);
  });
}
