export const SEARCH_ENABLED_SETTING = "search_enabled";

export function isSearchEnabled(
  settings: Record<string, string | undefined>,
): boolean {
  return settings[SEARCH_ENABLED_SETTING] !== "false";
}
