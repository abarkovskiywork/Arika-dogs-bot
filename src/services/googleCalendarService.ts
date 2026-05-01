import { google } from "googleapis";
import { prisma } from "../db/prisma";
import { authorize } from "./googleAuthService";

type CalendarEventArgs = {
    calendarId: string;
    summary: string;
    description?: string;
    startDateTime: string;
    endDateTime: string;
    timeZone?: string;
};

type ServiceEventArgs = {
    calendarId: string;
    dogName: string;
    serviceType: string;
    price: number;
    walksPerDay: number;
    isAllDay: boolean;
    checkTime?: string;
    startDate: string; // "2026-04-30"
    endDate: string;   // "2026-12-31"
    startTime?: string; // "09:00"
    endTime?: string;   // "10:00"
    timezone?: string;
};

type EventIdArgs = {
    calendarId: string;
    eventId: string;
};

export async function getCalendarEvent({ calendarId, eventId }: EventIdArgs) {
    const auth = await authorize();
    const calendar = google.calendar({ version: "v3", auth });

    const res = await calendar.events.get({
        calendarId,
        eventId,
    });

    return res.data;
}

export async function deleteCalendarEvent({
    calendarId,
    eventId,
}: EventIdArgs): Promise<void> {
    const auth = await authorize();
    const calendar = google.calendar({ version: "v3", auth });

    await calendar.events.delete({
        calendarId,
        eventId,
    });
}

export async function createCalendarEvent({
    calendarId,
    summary,
    description,
    startDateTime,
    endDateTime,
    timeZone = "Europe/Belgrade",
}: CalendarEventArgs) {
    const auth = await authorize();
    const calendar = google.calendar({ version: "v3", auth });

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

export async function createServiceEvent(data: ServiceEventArgs) {
    const auth = await authorize();
    const calendar = google.calendar({ version: "v3", auth });

    const {
        calendarId,
        dogName,
        serviceType,
        price,
        walksPerDay,
        isAllDay,
        startDate,
        endDate,
        startTime,
        endTime,
        timezone = "Europe/Belgrade",
    } = data;

    if (!isAllDay && (!startTime || !endTime)) {
        throw new Error("startTime and endTime are required for timed events");
    }

    const event = {
        summary: dogName,
        description:
            `dogName = ${dogName}\n` +
            `serviceType=${serviceType} \n` +
            `price=${price} \n` +
            `walksPerDay=${walksPerDay}`,
        recurrence: [
            `RRULE:FREQ=DAILY;UNTIL=${endDate.replaceAll("-", "")}T235959Z`,
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

export async function createServiceEventWithDb(data: ServiceEventArgs) {
    let calendarEvent: Awaited<ReturnType<typeof createServiceEvent>> | null =
        null;

    try {
        calendarEvent = await createServiceEvent(data);

        if (!calendarEvent.id) {
            throw new Error("Google Calendar event was created without id");
        }

        const serviceEvent = await prisma.serviceEvent.create({
            data: {
                googleEventId: calendarEvent.id,
                calendarId: data.calendarId,
                dogName: data.dogName,
                serviceType: data.serviceType,
                checkTime: data.checkTime,
                price: data.price,
                walksPerDay: data.walksPerDay,
                trackingMode: "auto_done",
            },
        });

        return {
            calendarEvent,
            serviceEvent,
        };
    } catch (error) {
        console.error("Failed to create service event:", error);

        if (calendarEvent?.id) {
            try {
                await deleteCalendarEvent({
                    calendarId: data.calendarId,
                    eventId: calendarEvent.id,
                });

                console.log("Rolled back Google Calendar event:", calendarEvent.id);
            } catch (rollbackError) {
                console.error("Failed to rollback Google Calendar event:", rollbackError);
            }
        }

        throw error;
    }
}

function addOneDay(ymd: string): string {
    const [year, month, day] = ymd.split("-").map(Number);

    if (!year || !month || !day) {
        throw new Error(`Invalid date: ${ymd}`);
    }

    const date = new Date(year, month - 1, day + 1);
    return date.toISOString().slice(0, 10);
}