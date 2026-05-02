
export function isAllowed(id: Number) {
    const allowed = [
          process.env.ADMIN_CHAT_ID,
          process.env.SASHA_CHAT_ID,
        ];

    return allowed.includes(String(id))
}

// Parses a string of key=value or key="value with spaces" pairs into a plain object.
export function parseArgs(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  const regex = /(\w+)=(?:"([^"]*)"|'([^']*)'|(\S+))/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    result[match[1]] = match[2] ?? match[3] ?? match[4];
  }
  return result;
}


export function getBelgradeDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Belgrade",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getBelgradeTime(): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Belgrade",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

export function dateKeyToUtcDate(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

export function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value).getTime());
}

export function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function addOneDay(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d + 1).toISOString().slice(0, 10);
}

export function toDayDate(ymd: string): Date {
  return new Date(`${ymd}T00:00:00.000Z`);
}

export function getInstanceDate(instance: any): string | null {
  const raw = instance.start?.date ?? instance.start?.dateTime;
  return raw ? raw.slice(0, 10) : null;
}
