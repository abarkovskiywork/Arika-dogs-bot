"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCalendarEvent = getCalendarEvent;
exports.deleteCalendarEvent = deleteCalendarEvent;
exports.createCalendarEvent = createCalendarEvent;
exports.createServiceEvent = createServiceEvent;
exports.createServiceEventWithDb = createServiceEventWithDb;
const googleapis_1 = require("googleapis");
const prisma_1 = require("../db/prisma");
const googleAuthService_1 = require("./googleAuthService");
async function getCalendarEvent({ calendarId, eventId }) {
    const auth = await (0, googleAuthService_1.authorize)();
    const calendar = googleapis_1.google.calendar({ version: "v3", auth });
    const res = await calendar.events.get({
        calendarId,
        eventId,
    });
    return res.data;
}
async function deleteCalendarEvent({ calendarId, eventId, }) {
    const auth = await (0, googleAuthService_1.authorize)();
    const calendar = googleapis_1.google.calendar({ version: "v3", auth });
    await calendar.events.delete({
        calendarId,
        eventId,
    });
}
async function createCalendarEvent({ calendarId, summary, description, startDateTime, endDateTime, timeZone = "Europe/Belgrade", }) {
    const auth = await (0, googleAuthService_1.authorize)();
    const calendar = googleapis_1.google.calendar({ version: "v3", auth });
    const response = await calendar.events.insert({
        calendarId,
        requestBody: {
            summary,
            description,
            start: {
                dateTime: startDateTime,
                timeZone,
            },
            end: {
                dateTime: endDateTime,
                timeZone,
            },
        },
    });
    return response.data;
}
async function createServiceEvent(data) {
    const auth = await (0, googleAuthService_1.authorize)();
    const calendar = googleapis_1.google.calendar({ version: "v3", auth });
    const { calendarId, dogName, serviceType, price, walksPerDay, isAllDay, startDate, endDate, startTime, endTime, timezone = "Europe/Belgrade", } = data;
    if (!isAllDay && (!startTime || !endTime)) {
        throw new Error("startTime and endTime are required for timed events");
    }
    const event = {
        summary: dogName,
        description: `dogName = ${dogName}\n` +
            `serviceType=${serviceType} \n` +
            `price=${price} \n` +
            `walksPerDay=${walksPerDay}`,
        recurrence: [
            `RRULE: FREQ = DAILY; UNTIL = ${endDate.replaceAll("-", "")}T235959Z`,
        ],
        extendedProperties: {
            private: {
                dogName,
                serviceType,
                price: String(price),
                walksPerDay: String(walksPerDay),
            },
        },
        start: isAllDay
            ? {
                date: startDate,
            }
            : {
                dateTime: `${startDate}T${startTime}:00`,
                timeZone: timezone,
            },
        end: isAllDay
            ? {
                date: addOneDay(startDate),
            }
            : {
                dateTime: `${startDate}T${endTime}:00`,
                timeZone: timezone,
            },
    };
    const res = await calendar.events.insert({
        calendarId,
        requestBody: event,
    });
    return res.data;
}
async function createServiceEventWithDb(data) {
    let calendarEvent = null;
    try {
        calendarEvent = await createServiceEvent(data);
        if (!calendarEvent.id) {
            throw new Error("Google Calendar event was created without id");
        }
        const serviceEvent = await prisma_1.prisma.serviceEvent.create({
            data: {
                googleEventId: calendarEvent.id,
                calendarId: data.calendarId,
                dogName: data.dogName,
                serviceType: data.serviceType,
                price: data.price,
                walksPerDay: data.walksPerDay,
                trackingMode: "auto_done",
            },
        });
        return {
            calendarEvent,
            serviceEvent,
        };
    }
    catch (error) {
        console.error("Failed to create service event:", error);
        if (calendarEvent?.id) {
            try {
                await deleteCalendarEvent({
                    calendarId: data.calendarId,
                    eventId: calendarEvent.id,
                });
                console.log("Rolled back Google Calendar event:", calendarEvent.id);
            }
            catch (rollbackError) {
                console.error("Failed to rollback Google Calendar event:", rollbackError);
            }
        }
        throw error;
    }
}
function addOneDay(ymd) {
    const [year, month, day] = ymd.split("-").map(Number);
    if (!year || !month || !day) {
        throw new Error(`Invalid date: ${ymd}`);
    }
    const date = new Date(year, month - 1, day + 1);
    return date.toISOString().slice(0, 10);
}
