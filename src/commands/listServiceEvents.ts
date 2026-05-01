import type { Composer } from "grammy";
import { prisma } from "../db/prisma";
import type { EContext } from "../types";

export function registerListServicesCommand(composer: Composer<EContext>) {
  composer.command("list_services", async (ctx) => {
    const services = await prisma.serviceEvent.findMany({
      orderBy: { createdAt: "desc" },
    });

    if (!services.length) {
      return ctx.reply("Сервисов нет");
    }

    const text = services
      .map((s) => {
        return (
          `#${s.id} ${s.dogName} type: ${s.serviceType} price: ${s.price} walks/day: ${s.walksPerDay} mode: ${s.trackingMode} checkTime: ${s.checkTime ?? "-"} active: ${s.isActive ? "✅" : "❌"}\n`
        );
      })
      .join("\n----------------\n");

    return ctx.reply(text);
  });
}