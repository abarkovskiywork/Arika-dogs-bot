import type { Composer } from "grammy";
import { prisma } from "../db/prisma";
import { parseArgs } from "../utils/utils";
import type { EContext } from "../types";

export function registerUpdateServiceCommand(composer: Composer<EContext>) {
  composer.command("update_service", async (ctx) => {
    const text = ctx.message?.text.replace("/update_service", "").trim() ?? "";

    // /update_service id=3 price=15 walksPerDay=2 checkTime=21:00

    console.log(text);
    const args = parseArgs(text);
    const id = Number(args.id);

    console.log(args)
    if (!id) {
      return ctx.reply("Формат: /update_service id=3 price=15 walksPerDay=2 checkTime=21:00");
    }

    const data: Record<string, number | string | boolean> = {};

    if (args.dogName !== undefined) data.dogName = args.dogName;
    if (args.serviceType !== undefined) data.serviceType = args.serviceType;
    if (args.price !== undefined) data.price = Number(args.price);
    if (args.walksPerDay !== undefined) data.walksPerDay = Number(args.walksPerDay);
    if (args.trackingMode !== undefined) data.trackingMode = args.trackingMode;
    if (args.checkTime !== undefined) data.checkTime = args.checkTime;
    if (args.isActive !== undefined) data.isActive = args.isActive === "true";

    console.log(data);
    const updated = await prisma.serviceEvent.update({
      where: { id },
      data,
    });

    return ctx.reply(`Обновил сервис ${updated.id}`);
  });
}
