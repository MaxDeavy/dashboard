import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db, schema } from "@/lib/db";

interface ReorderUpdate {
  id: number;
  columnPosition: number;
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
      !Number.isFinite(update.columnPosition) ||
      update.id < 1 ||
      update.columnPosition < 0
    ) {
      return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });
    }
  }

  for (const update of updates) {
    await db
      .update(schema.categories)
      .set({
        columnPosition: update.columnPosition,
        sortOrder: update.columnPosition,
      })
      .where(eq(schema.categories.id, update.id));
  }

  return NextResponse.json({ success: true });
}
