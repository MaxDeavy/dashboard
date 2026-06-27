import "server-only";

import { getSession, verifyPassword } from "@/lib/auth";
import { persistDashboardAuthCookie } from "@/lib/dashboard-auth";
import {
  checkLoginRateLimit,
  clearLoginAttempts,
  recordLoginFailure,
} from "@/lib/login-rate-limit";

export type LoginError = "invalid" | "rate-limit";

export async function validateLogin(
  password: string,
  ip: string,
): Promise<LoginError | null> {
  const rateLimit = checkLoginRateLimit(ip);

  if (!rateLimit.allowed) {
    return "rate-limit";
  }

  if (!password || !(await verifyPassword(password))) {
    recordLoginFailure(ip);
    return "invalid";
  }

  clearLoginAttempts(ip);
  return null;
}

export async function establishAuthenticatedSession(): Promise<void> {
  const session = await getSession();
  session.isLoggedIn = true;
  await session.save();
  await persistDashboardAuthCookie();
}
