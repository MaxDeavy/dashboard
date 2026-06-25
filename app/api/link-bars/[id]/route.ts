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

  const [bar] = await db
    .update(schema.linkBars)
    .set({
      sortOrder: body.sortOrder,
      title: body.title,
      enabled: body.enabled,
    })
    .where(eq(schema.linkBars.id, Number(id)))
    .returning();

  return NextResponse.json(bar);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  await db.delete(schema.linkBars).where(eq(schema.linkBars.id, Number(id)));
  return NextResponse.json({ success: true });
}
