
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
