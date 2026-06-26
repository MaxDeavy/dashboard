import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSessionFromRequest, verifyPassword } from "@/lib/auth";
import {
  checkLoginRateLimit,
  clearLoginAttempts,
  getClientIp,
  recordLoginFailure,
} from "@/lib/login-rate-limit";

export async function POST(request: Request) {
  const t = await getTranslations("api");
  const ip = getClientIp(request);
  const rateLimit = checkLoginRateLimit(ip);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: t("tooManyLoginAttempts") },
      {
        status: 429,
        headers: rateLimit.retryAfterSec
          ? { "Retry-After": String(rateLimit.retryAfterSec) }
          : undefined,
      },
    );
  }

  const { password } = await request.json();

  if (!password || !(await verifyPassword(password))) {
    recordLoginFailure(ip);
    return NextResponse.json({ error: t("invalidPassword") }, { status: 401 });
  }

  clearLoginAttempts(ip);

  const response = NextResponse.json({ success: true });
  const session = await getSessionFromRequest(request, response);
  session.isLoggedIn = true;
  await session.save();

  return response;
}
