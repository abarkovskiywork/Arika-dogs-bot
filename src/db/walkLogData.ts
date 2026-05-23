import { prisma } from "./prisma";

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

export async function countCompletedWalkLogs(serviceEventId: number) {
  return prisma.walkLog.count({
    where: { serviceEventId, completed: true },
  });
}

export async function upsertReminderWalkLog(data: {
  serviceEventId: number;
  date: Date;
  walksCount: number;
  durationMinutes?: number;
}) {
  await prisma.walkLog.deleteMany({ where: { serviceEventId: data.serviceEventId, date: data.date } });
  return prisma.walkLog.create({ data });
}
