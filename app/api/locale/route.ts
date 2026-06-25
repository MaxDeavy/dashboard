import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { isLocale, LOCALE_COOKIE, type Locale } from "@/i18n/config";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export async function POST(request: Request) {
  const t = await getTranslations("api");
  let locale: unknown;

  try {
    const body = (await request.json()) as { locale?: string };
    locale = body.locale;
  } catch {
    return NextResponse.json({ error: t("invalidData") }, { status: 400 });
  }

  if (typeof locale !== "string" || !isLocale(locale)) {
    return NextResponse.json({ error: t("invalidLocale") }, { status: 400 });
  }

  const response = NextResponse.json({ success: true, locale });
  response.cookies.set(LOCALE_COOKIE, locale satisfies Locale, {
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    sameSite: "lax",
    httpOnly: false,
  });

  return response;
}
