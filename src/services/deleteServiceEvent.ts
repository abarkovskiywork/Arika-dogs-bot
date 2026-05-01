import { prisma } from "../db/prisma";
import { deleteCalendarEvent } from "./googleCalendarService";

export async function deleteServiceEvent(
  serviceEventId: number
): Promise<void> {
  const serviceEvent = await prisma.serviceEvent.findUnique({
    where: { id: serviceEventId },
  });

  if (!serviceEvent) {
    throw new Error("ServiceEvent not found");
  }

  try {
    await deleteCalendarEvent({
      calendarId: serviceEvent.calendarId,
      eventId: serviceEvent.googleEventId,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Google delete failed:", error.message);
    } else {
      console.error("Google delete failed:", error);
    }
  }

  await prisma.serviceEvent.delete({
    where: { id: serviceEventId },
  });
}