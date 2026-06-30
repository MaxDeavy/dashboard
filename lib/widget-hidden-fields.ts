export function parseHiddenWidgetFields(
  raw: string | null | undefined,
): string[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is string => typeof entry === "string");
  } catch {
    return [];
  }
}

export function serializeHiddenWidgetFields(ids: Iterable<string>): string {
  return JSON.stringify([...new Set(ids)]);
}
