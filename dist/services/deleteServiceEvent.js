"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteServiceEvent = deleteServiceEvent;
const prisma_1 = require("../db/prisma");
const googleCalendarService_1 = require("./googleCalendarService");
async function deleteServiceEvent(serviceEventId) {
    const serviceEvent = await prisma_1.prisma.serviceEvent.findUnique({
        where: { id: serviceEventId },
    });
    if (!serviceEvent) {
        throw new Error("ServiceEvent not found");
    }
    try {
        await (0, googleCalendarService_1.deleteCalendarEvent)({
            calendarId: serviceEvent.calendarId,
            eventId: serviceEvent.googleEventId,
        });
    }
    catch (error) {
        if (error instanceof Error) {
            console.error("Google delete failed:", error.message);
        }
        else {
            console.error("Google delete failed:", error);
        }
    }
    await prisma_1.prisma.serviceEvent.delete({
        where: { id: serviceEventId },
    });
}
