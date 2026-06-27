import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCookieSecure, isAppBuildTime } from "@/lib/env";
import { getSettings } from "@/lib/db/queries";
import {
  DASHBOARD_AUTH_COOKIE,
  isDashboardAuthRequired,
} from "@/lib/dashboard-auth-constants";

export {
  DASHBOARD_AUTH_COOKIE,
  DASHBOARD_AUTH_REQUIRED_SETTING,
  isDashboardAuthRequired,
} from "@/lib/dashboard-auth-constants";

const cookieOptions = {
  path: "/",
  sameSite: "lax" as const,
  secure: getCookieSecure(),
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 365,
};

export function applyDashboardAuthCookie(
  response: NextResponse,
  required: boolean,
): void {
  if (required) {
    response.cookies.set(DASHBOARD_AUTH_COOKIE, "1", cookieOptions);
    return;
  }

  response.cookies.set(DASHBOARD_AUTH_COOKIE, "", { path: "/", maxAge: 0 });
}

export async function persistDashboardAuthCookie(): Promise<void> {
  const settings = await getSettings();
  const cookieStore = await cookies();

  if (isDashboardAuthRequired(settings)) {
    cookieStore.set(DASHBOARD_AUTH_COOKIE, "1", cookieOptions);
    return;
  }

  cookieStore.delete(DASHBOARD_AUTH_COOKIE);
}

export async function requireDashboardAccess(): Promise<NextResponse | null> {
  if (isAppBuildTime()) {
    return null;
  }

  const settings = await getSettings();

  if (!isDashboardAuthRequired(settings)) {
    return null;
  }

  const session = await getSession();
  if (session.isLoggedIn) {
    return null;
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
