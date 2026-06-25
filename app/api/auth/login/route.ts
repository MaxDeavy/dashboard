import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession, verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const t = await getTranslations("api");
  const { password } = await request.json();

  if (!password || !(await verifyPassword(password))) {
    return NextResponse.json({ error: t("invalidPassword") }, { status: 401 });
  }

  const session = await getSession();
  session.isLoggedIn = true;
  await session.save();

  return NextResponse.json({ success: true });
}
