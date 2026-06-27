import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import {
  establishAuthenticatedSession,
  validateLogin,
} from "@/lib/auth-login";
import { getClientIp } from "@/lib/login-rate-limit";

export async function POST(request: Request) {
  const t = await getTranslations("api");
  const ip = getClientIp(request);
  const { password } = await request.json();

  const error = await validateLogin(String(password ?? ""), ip);

  if (error === "rate-limit") {
    return NextResponse.json(
      { error: t("tooManyLoginAttempts") },
      { status: 429 },
    );
  }

  if (error === "invalid") {
    return NextResponse.json({ error: t("invalidPassword") }, { status: 401 });
  }

  await establishAuthenticatedSession();
  return NextResponse.json({ success: true });
}
