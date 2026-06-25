import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getSettings, setSetting } from "@/lib/db/queries";
import { invalidateHealthCache } from "@/lib/health";
import { invalidateWidgetCache } from "@/lib/widgets";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  const authError = await requireAuth();
  if (authError) return authError;

  const body = await request.json();

  for (const [key, value] of Object.entries(body)) {
    await setSetting(key, String(value));
  }

  invalidateHealthCache();
  invalidateWidgetCache();

  const settings = await getSettings();
  return NextResponse.json(settings);
}
