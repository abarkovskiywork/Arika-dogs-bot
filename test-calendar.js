const { createCalendarEvent } = require("./src/services/googleCalendarService");
require("dotenv").config();

async function main() {
    const event = await createCalendarEvent({
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        summary: "test event",
        description: "first test record",
        startDateTime: "2026-04-16T10:00:00+02:00",
        endDateTime: "2026-04-16T11:00:00+02:00",
        timeZone: "Europe/Belgrade"
    });

    console.log("Created event ID: ", event.id);
    console.log("Link: ", event.htmlLink);
}

main().catch(console.error);