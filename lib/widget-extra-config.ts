export function parseWidgetExtraConfig(
  raw: string | null | undefined,
): Record<string, string> {
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string") {
        result[key] = value;
      }
    }
    return result;
  } catch {
    return {};
  }
}

export function serializeWidgetExtraConfig(
  config: Record<string, string>,
): string | null {
  const entries = Object.entries(config).filter(([, value]) => value !== "");
  if (entries.length === 0) return null;
  return JSON.stringify(Object.fromEntries(entries));
}

export function nextCycleOption(current: string, options: string[]): string {
  if (options.length === 0) return current;
  const index = options.indexOf(current);
  if (index === -1) return options[0]!;
  return options[(index + 1) % options.length]!;
}
