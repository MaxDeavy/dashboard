import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db, schema } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json();

  const [category] = await db
    .update(schema.categories)
    .set({
      name: body.name,
      sortOrder: body.sortOrder,
      columnPosition: body.columnPosition,
      enabled: body.enabled,
      color: body.color ?? null,
    })
    .where(eq(schema.categories.id, Number(id)))
    .returning();

  return NextResponse.json(category);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  await db.delete(schema.categories).where(eq(schema.categories.id, Number(id)));
  return NextResponse.json({ success: true });
}
