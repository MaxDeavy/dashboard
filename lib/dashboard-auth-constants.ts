export const DASHBOARD_AUTH_REQUIRED_SETTING = "dashboard_requires_auth";
export const DASHBOARD_AUTH_COOKIE = "dashboard-auth-required";

export function isDashboardAuthRequired(
  settings: Record<string, string | undefined> | null | undefined,
): boolean {
  return settings?.[DASHBOARD_AUTH_REQUIRED_SETTING] === "true";
}
