"use strict";
const prisma = require("../db/prisma");
const { getCalendarEvent } = require("../services/googleCalendarService");
const { isAllowed } = require("../utils");
module.exports = (bot) => {
    bot.command("sync_services", async (ctx) => {
        if (!isAllowed(ctx.from.id)) {
            return ctx.reply("Не для тебя 😌");
        }
        const serviceEvents = await prisma.serviceEvent.findMany({
            where: {
                isActive: true,
            },
        });
        let checked = 0;
        let deactivated = 0;
        let errors = 0;
        for (const serviceEvent of serviceEvents) {
            checked++;
            try {
                await getCalendarEvent({
                    calendarId: serviceEvent.calendarId,
                    eventId: serviceEvent.googleEventId,
                });
            }
            catch (error) {
                const status = error?.code || error?.response?.status;
                if (status === 404 || status === 410) {
                    await prisma.serviceEvent.update({
                        where: { id: serviceEvent.id },
                        data: { isActive: false },
                    });
                    deactivated++;
                }
                else {
                    console.error(`Sync error for ServiceEvent ${serviceEvent.id}:`, error);
                    errors++;
                }
            }
        }
        await ctx.reply(`Sync done.\n` +
            `Checked: ${checked}\n` +
            `Deactivated: ${deactivated}\n` +
            `Errors: ${errors}`);
    });
};
