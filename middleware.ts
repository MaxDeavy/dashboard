import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { isDashboardDataApiPath } from "@/lib/dashboard-api-paths";
import { DASHBOARD_AUTH_COOKIE } from "@/lib/dashboard-auth-constants";
import { sanitizeNextPath } from "@/lib/safe-redirect";
import { buildRequestUrl } from "@/lib/request-origin";
import { withSecurityHeaders } from "@/lib/security-headers";
import {
  getSessionOptionsForRequest,
  type SessionData,
} from "@/lib/session-config";

async function getSessionFromRequest(
  request: NextRequest,
  response: NextResponse,
) {
  return getIronSession<SessionData>(
    request,
    response,
    getSessionOptionsForRequest(request),
  );
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname === "/login") {
    const response = NextResponse.next();
    const session = await getSessionFromRequest(request, response);

    if (session.isLoggedIn) {
      const next = sanitizeNextPath(request.nextUrl.searchParams.get("next"));
      return withSecurityHeaders(
        NextResponse.redirect(buildRequestUrl(request, next)),
      );
    }

    return withSecurityHeaders(response);
  }

  if (isDashboardDataApiPath(pathname)) {
    const dashboardAuthRequired =
      request.cookies.get(DASHBOARD_AUTH_COOKIE)?.value === "1";

    if (dashboardAuthRequired) {
      const response = NextResponse.next();
      const session = await getSessionFromRequest(request, response);

      if (!session.isLoggedIn) {
        return withSecurityHeaders(
          NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        );
      }

      return withSecurityHeaders(response);
    }

    return withSecurityHeaders(NextResponse.next());
  }

  const dashboardAuthRequired =
    request.cookies.get(DASHBOARD_AUTH_COOKIE)?.value === "1";

  const requiresAuth =
    pathname.startsWith("/admin") ||
    pathname === "/preview" ||
    (pathname === "/" && dashboardAuthRequired);

  if (!requiresAuth) {
    return withSecurityHeaders(NextResponse.next());
  }

  const response = NextResponse.next();
  const session = await getSessionFromRequest(request, response);

  if (!session.isLoggedIn) {
    const loginUrl = buildRequestUrl(request, "/login");
    const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    loginUrl.searchParams.set("next", nextPath);
    return withSecurityHeaders(NextResponse.redirect(loginUrl));
  }

  return withSecurityHeaders(response);
}

export const config = {
  matcher: ["/", "/login", "/admin/:path*", "/preview", "/api/:path*"],
};
