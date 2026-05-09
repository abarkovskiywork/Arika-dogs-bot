import cron from "node-cron";
import { listCalendarEvents } from "../services/googleCalendarService";
import { createServiceEventRecord, updateServiceEvent } from "../db/serviceEventData";
import { prisma } from "../db/prisma";
import { toDayDate } from "../utils/utils";

function parseEventStartDate(event: any): string | null {
  return event.start?.date ?? event.start?.dateTime?.slice(0, 10) ?? null;
}

function parseEventEndDate(event: any): string | null {
  // For recurring events, prefer RRULE UNTIL as the inclusive end date
  const rrule = (event.recurrence as string[] | undefined)?.find((r) =>
    r.startsWith("RRULE:")
  );
  if (rrule) {
    const match = rrule.match(/UNTIL=(\d{8})/);
    if (match) {
      const raw = match[1];
      return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
    }
  }

  // All-day events: end.date is exclusive, subtract one day
  if (event.end?.date) {
    const d = new Date(event.end.date + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
  }

  return event.end?.dateTime?.slice(0, 10) ?? null;
}

export async function syncCalendarEventsToDb(): Promise<{
  created: number;
  updated: number;
  errors: number;
}> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId) {
    console.error("[calendar_polling] GOOGLE_CALENDAR_ID not set");
    return { created: 0, updated: 0, errors: 0 };
  }

  const googleEvents = await listCalendarEvents({ calendarId });

  const googleEventIds = googleEvents
    .map((e) => e.id)
    .filter((id): id is string => Boolean(id));

  // Single batch query for all existing records
  const existingRecords = await prisma.serviceEvent.findMany({
    where: { googleEventId: { in: googleEventIds } },
  });
  const existingMap = new Map(existingRecords.map((r) => [r.googleEventId, r]));

  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const event of googleEvents) {
    if (!event.id || !event.summary) continue;

    const startDateStr = parseEventStartDate(event);
    const endDateStr = parseEventEndDate(event);
    if (!startDateStr || !endDateStr) continue;

    const isActive = event.status !== "cancelled";

    try {
      const existing = existingMap.get(event.id);

      if (!existing) {
        if (!isActive) continue; // don't import already-cancelled events

        await createServiceEventRecord({
          googleEventId: event.id,
          calendarId,
          dogName: event.summary,
          serviceType: "walk",
          price: 0,
          walksPerDay: 1,
          trackingMode: "auto_done",
          startDate: toDayDate(startDateStr),
          endDate: toDayDate(endDateStr),
          needsSetup: true,
        });
        created++;
      } else {
        const newStart = toDayDate(startDateStr);
        const newEnd = toDayDate(endDateStr);

        const changed =
          existing.dogName !== event.summary ||
          existing.startDate.getTime() !== newStart.getTime() ||
          existing.endDate.getTime() !== newEnd.getTime() ||
          existing.isActive !== isActive;

        if (changed) {
          await updateServiceEvent(existing.id, {
            dogName: event.summary,
            startDate: newStart,
            endDate: newEnd,
            isActive,
          });
          updated++;
        }
      }
    } catch (error) {
      console.error("[calendar_polling] error for event:", event.id, error);
      errors++;
    }
  }

  return { created, updated, errors };
}

export function registerSyncCalendarPollingJob(): void {
  cron.schedule(
    "*/15 * * * *",
    async () => {
      console.log("[calendar_polling] started");
      const result = await syncCalendarEventsToDb();
      console.log("[calendar_polling] finished:", result);
    },
    { timezone: "Europe/Belgrade" }
  );
}
