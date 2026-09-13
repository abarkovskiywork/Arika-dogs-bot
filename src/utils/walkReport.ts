import { toDayDate } from "./utils";

type WalkReportInput = {
  logs: { date: Date; walksCount: number }[];
  startDate: string;
  endDate: string;
  serviceStart: Date;
  serviceEnd: Date;
  today: string;
};

export function buildWalkReportLines(input: WalkReportInput): string[] {
  const counts = new Map<string, number>();
  for (const log of input.logs) {
    const key = log.date.toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + log.walksCount);
  }
  const first = [input.startDate, input.serviceStart.toISOString().slice(0, 10)].sort().at(-1)!;
  const last = [input.endDate, input.serviceEnd.toISOString().slice(0, 10), input.today].sort()[0];
  // Include recorded dates even if the service's dates were subsequently edited.
  for (const cursor = toDayDate(first); cursor.toISOString().slice(0, 10) <= last; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const key = cursor.toISOString().slice(0, 10);
    if (!counts.has(key)) counts.set(key, NaN);
  }
  return [...counts].sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) =>
    `${date.slice(8, 10)}-${date.slice(5, 7)} - ${Number.isNaN(count) ? "нет отметки" : count}`
  );
}
