import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSessionFromRequest, verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const t = await getTranslations("api");
  const { password } = await request.json();

  if (!password || !(await verifyPassword(password))) {
    return NextResponse.json({ error: t("invalidPassword") }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  const session = await getSessionFromRequest(request, response);
  session.isLoggedIn = true;
  await session.save();

  return response;
}
