import { ServiceType, TrackingMode } from "@prisma/client";
import { prisma } from "./prisma";
import { getBelgradeDateKey, toDayDate } from "../utils/utils";

type ServiceEventCreateData = {
  googleEventId: string;
  calendarId: string;
  dogName: string;
  serviceType: ServiceType;
  trackingMode: TrackingMode;
  price: number;
  walksPerDay: number;
  startDate: Date;
  endDate: Date;
  needsSetup?: boolean;
};

type ServiceEventUpdateData = {
  dogName?: string;
  serviceType?: ServiceType;
  price?: number;
  walksPerDay?: number;
  trackingMode?: TrackingMode;
  isActive?: boolean;
  needsSetup?: boolean;
  startDate?: Date;
  endDate?: Date;
};

function today(): Date {
  return toDayDate(getBelgradeDateKey());
}

export async function getAllServiceEvents() {
  return prisma.serviceEvent.findMany({
    orderBy: { startDate: "asc" },
  });
}

export async function getActiveServiceEvents() {
  return prisma.serviceEvent.findMany({
    where: { isActive: true },
    orderBy: { startDate: "asc" },
  });
}

export async function getCurrentServiceEvents() {
  return prisma.serviceEvent.findMany({
    where: { endDate: { gte: today() } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getActiveCurrentServiceEvents() {
  return prisma.serviceEvent.findMany({
    where: { isActive: true, endDate: { gte: today() } },
    orderBy: { startDate: "asc" },
  });
}

export async function getTodayAskDailyServiceEvents() {
  const todayKey = getBelgradeDateKey();
  const today = toDayDate(todayKey);
  return prisma.serviceEvent.findMany({
    where: {
      isActive: true,
      trackingMode: TrackingMode.ask_daily,
      startDate: { lte: today },
      endDate: { gte: today },
    },
    include: {
      walkLogs: { where: { date: today } },
    },
    orderBy: { dogName: "asc" },
  });
}

export async function getServiceEventsByIds(ids: number[]) {
  return prisma.serviceEvent.findMany({
    where: { id: { in: ids } },
    orderBy: { dogName: "asc" },
  });
}

export async function getServiceEventById(id: number) {
  return prisma.serviceEvent.findUnique({ where: { id } });
}

export async function createServiceEventRecord(data: ServiceEventCreateData) {
  return prisma.serviceEvent.create({ data });
}

export async function updateServiceEvent(id: number, data: ServiceEventUpdateData) {
  return prisma.serviceEvent.update({ where: { id }, data });
}

export async function deactivateServiceEvent(id: number) {
  return prisma.serviceEvent.update({
    where: { id },
    data: { isActive: false },
  });
}

export async function deleteServiceEventRecord(id: number) {
  return prisma.serviceEvent.delete({ where: { id } });
}

export async function getServiceEventByGoogleId(googleEventId: string) {
  return prisma.serviceEvent.findUnique({ where: { googleEventId } });
}

export async function getTodayServiceEvents() {
  const todayKey = getBelgradeDateKey();
  const today = toDayDate(todayKey);
  return prisma.serviceEvent.findMany({
    where: {
      isActive: true,
      startDate: { lte: today },
      endDate: { gte: today },
    },
    orderBy: { dogName: "asc" },
  });
}

export async function getNeedsSetupServiceEvents() {
  const todayKey = getBelgradeDateKey();
  const today = toDayDate(todayKey);
  const twoWeeks = new Date(today);
  twoWeeks.setDate(twoWeeks.getDate() + 14)

  return prisma.serviceEvent.findMany({
    where: { 
      needsSetup: true,
      isActive: true,
      endDate: { gte: today },
      startDate: { lte: twoWeeks }
    },
    orderBy: { startDate: "asc" },
  });
}
