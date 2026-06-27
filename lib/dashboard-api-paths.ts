const DASHBOARD_DATA_API_PREFIXES = [
  "/api/dashboard",
  "/api/settings",
  "/api/services",
  "/api/health",
  "/api/widgets",
  "/api/categories",
  "/api/nav-links",
  "/api/pages",
  "/api/link-bars",
  "/api/uploads",
] as const;

const DASHBOARD_API_EXCLUDED_PREFIXES = ["/api/auth", "/api/locale"] as const;

export function isDashboardDataApiPath(pathname: string): boolean {
  if (
    DASHBOARD_API_EXCLUDED_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix),
    )
  ) {
    return false;
  }

  return DASHBOARD_DATA_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
