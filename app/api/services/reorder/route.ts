import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db, schema } from "@/lib/db";

interface ReorderUpdate {
  id: number;
  categoryId: number;
  sortOrder: number;
}

export async function PUT(request: Request) {
  const authError = await requireAuth();
  if (authError) return authError;

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
      return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });
    }
  }

  for (const update of updates) {
    await db
      .update(schema.services)
      .set({
        categoryId: update.categoryId,
        sortOrder: update.sortOrder ?? 0,
      })
      .where(eq(schema.services.id, update.id));
  }

  return NextResponse.json({ success: true });
}
