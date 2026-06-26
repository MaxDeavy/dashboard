import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { MAX_SERVICES_PER_ROW } from "@/lib/service-rows";

interface ReorderUpdate {
  id: number;
  categoryId: number;
  sortOrder: number;
  rowOrder?: number;
  slotIndex?: number;
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
      !Number.isFinite(update.categoryId) ||
      !Number.isFinite(update.sortOrder) ||
      update.id < 1 ||
      update.categoryId < 1
    ) {
      return NextResponse.json({ error: t("invalidData") }, { status: 400 });
    }

    const rowOrder = update.rowOrder ?? 0;
    const slotIndex = update.slotIndex ?? 0;

    if (
      !Number.isFinite(rowOrder) ||
      !Number.isFinite(slotIndex) ||
      rowOrder < 0 ||
      slotIndex < 0 ||
      slotIndex >= MAX_SERVICES_PER_ROW
    ) {
      return NextResponse.json({ error: t("invalidData") }, { status: 400 });
    }
  }

  for (const update of updates) {
    const rowOrder = update.rowOrder ?? 0;
    const slotIndex = update.slotIndex ?? 0;

    await db
      .update(schema.services)
      .set({
        categoryId: update.categoryId,
        sortOrder: update.sortOrder ?? 0,
        rowOrder,
        slotIndex,
      })
      .where(eq(schema.services.id, update.id));
  }

  return NextResponse.json({ success: true });
}
