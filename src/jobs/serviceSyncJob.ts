import cron from "node-cron";
import { prisma } from "../db/prisma";
import { getCalendarEvent } from "../services/googleCalendarService";

function getErrorStatus(error: unknown): number | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "number"
  ) {
    return error.code;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "status" in error.response &&
    typeof error.response.status === "number"
  ) {
    return error.response.status;
  }

  return undefined;
}

export async function syncServices(): Promise<{
  checked: number;
  deactivated: number;
  errors: number;
}> {
  const serviceEvents = await prisma.serviceEvent.findMany({
    where: { isActive: true },
  });

  let checked = 0;
  let deactivated = 0;
  let errors = 0;

  for (const serviceEvent of serviceEvents) {
    checked++;

    try {
      const event = await getCalendarEvent({
        calendarId: serviceEvent.calendarId,
        eventId: serviceEvent.googleEventId,
      });

      if (event.status === "cancelled") {
        await prisma.serviceEvent.update({
          where: { id: serviceEvent.id },
          data: { isActive: false },
        });

        deactivated++;
      }
    } catch (error) {
      const status = getErrorStatus(error);

      if (status === 404 || status === 410) {
        await prisma.serviceEvent.update({
          where: { id: serviceEvent.id },
          data: { isActive: false },
        });

        deactivated++;
      } else {
        console.error("Sync service error:", error);
        errors++;
      }
    }
  }

  return { checked, deactivated, errors };
}

export function registerSyncServicesJob(): void {
  cron.schedule(
    "0 3 * * *",
    async () => {
      console.log("[sync_services] started");

      const result = await syncServices();

      console.log("[sync_services] finished:", result);
    },
    {
      timezone: "Europe/Belgrade",
    }
  );
}