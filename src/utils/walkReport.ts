import { toDayDate } from "./utils";

type WalkReportInput = {
  logs: { date: Date; walksCount: number }[];
  startDate: string;
  endDate: string;
  today: string;
};

export function buildWalkReportLines(input: WalkReportInput): string[] {
  const counts = new Map<string, number>();
  for (const log of input.logs) {
    const key = log.date.toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + log.walksCount);
  }
  const first = input.startDate;
  const last = [input.endDate, input.today].sort()[0];
  for (const cursor = toDayDate(first); cursor.toISOString().slice(0, 10) <= last; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const key = cursor.toISOString().slice(0, 10);
    if (!counts.has(key)) counts.set(key, NaN);
  }
  const formatter = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
  return [...counts].sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) =>
    `${date.slice(8, 10)} ${formatter.format(toDayDate(date))} - ${Number.isNaN(count) ? "нет отметки" : count}`
  );
}
