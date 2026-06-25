import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth";
import { db, schema } from "@/lib/db";

interface ReorderUpdate {
  id: number;
  sortOrder: number;
}

export async function PUT(request: Request) {
  const authError = await requireAuth();
  if (authError) return authError;

  const t = await getTranslations("api");
  const body = (await request.json()) as { updates?: ReorderUpdate[] };
  const updates = body.updates ?? [];

  if (updates.length === 0) {
    return NextResponse.json({ success: true });
  }

  for (const update of updates) {
    if (
      !Number.isFinite(update.id) ||
      !Number.isFinite(update.sortOrder) ||
      update.id < 1 ||
      update.sortOrder < 0
    ) {
      return NextResponse.json({ error: t("invalidData") }, { status: 400 });
    }
  }

  for (const update of updates) {
    await db
      .update(schema.pages)
      .set({ sortOrder: update.sortOrder })
      .where(eq(schema.pages.id, update.id));
  }

  return NextResponse.json({ success: true });
}
