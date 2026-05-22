import type { Composer } from "grammy";
import { getAllServiceEvents } from "../../db/serviceEventData";
import type { EContext } from "../../types";
import { todayDateBG } from "../../utils/utils";

export function registerAdminListServicesCommand(composer: Composer<EContext>) {
  composer.command("admin_list_services", async (ctx) => {
    console.log("admin get services");
    const services = await getAllServiceEvents();

    if (!services.length) {
      return ctx.reply("Сервисов нет.");
    }

    const text = services
      .map((s) => {
        console.log(s.endDate, todayDateBG(), s.endDate < todayDateBG());
        const old = s.endDate < todayDateBG() ? " | 🟡 passed!" : "";
        const start = new Intl.DateTimeFormat("en-GB", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }).format(s.startDate);
        const end = new Intl.DateTimeFormat("en-GB", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }).format(s.endDate);

        return (`#${s.id} ${s.dogName} | ${s.serviceType} | ${s.price} | ` +
          `walks: ${s.walksPerDay} | mode: ${s.trackingMode} | checkTime: ${s.checkTime ?? "-"} | ` +
          `start: ${start} ` +
          `end: ${end} ` +
          `active: ${s.isActive ? "✅" : "❌"}${old}`)
      })
      .join("\n----------------\n");

    return ctx.reply(text);
  });
}
