import { prisma } from "./prisma";
import { getBelgradeDateKey, toDayDate } from "../utils/utils";

export async function getWalkLogsForEventToday(serviceEventId: number, date: Date) {
  return prisma.walkLog.findMany({
    where: { serviceEventId, date },
  });
}

export async function createWalkLogEntry(data: {
  serviceEventId: number;
  date: Date;
  walksCount: number;
  completed: boolean;
}) {
  return prisma.walkLog.create({ data });
}

export async function sumCompletedWalkLogs(serviceEventId: number) {
  const result = await prisma.walkLog.aggregate({
    where: { serviceEventId, completed: true },
    _sum: { walksCount: true },
  });
  return result._sum.walksCount ?? 0;
}

export async function upsertReminderWalkLog(data: {
  serviceEventId: number;
  date: Date;
  walksCount: number;
  note?: string | null;
  durationMinutes?: number;
}) {
  await prisma.walkLog.deleteMany({ where: { serviceEventId: data.serviceEventId, date: data.date } });
  return prisma.walkLog.create({
    data: { ...data, completed: data.walksCount > 0 },
  });
}

export async function backfillWalkLogsForPastDays(
  serviceEventId: number,
  startDate: Date,
  walksPerDay: number
) {
  const todayDate = toDayDate(getBelgradeDateKey());
  const cursor = new Date(startDate);

  while (cursor < todayDate) {
    const date = new Date(cursor);
    const existing = await prisma.walkLog.findFirst({ where: { serviceEventId, date } });
    if (!existing) {
      await prisma.walkLog.create({ data: { serviceEventId, date, walksCount: walksPerDay, completed: true } });
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
}
