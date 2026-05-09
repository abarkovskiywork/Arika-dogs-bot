import { prisma } from "./prisma";

export async function getUserSettings(userId: string) {
  return prisma.userSettings.findUnique({ where: { userId } });
}

export async function upsertUserSettings(userId: string, digestTime: string) {
  return prisma.userSettings.upsert({
    where: { userId },
    update: { digestTime },
    create: { userId, digestTime },
  });
}

export async function getAllUserSettings() {
  return prisma.userSettings.findMany();
}
