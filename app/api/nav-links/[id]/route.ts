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

  const [link] = await db
    .update(schema.navLinks)
    .set({
      barId: body.barId,
      label: body.label,
      url: body.url,
      icon: body.icon,
      sortOrder: body.sortOrder,
      enabled: body.enabled,
      linkOpenMode: body.linkOpenMode ?? "same_tab",
    })
    .where(eq(schema.navLinks.id, Number(id)))
    .returning();

  return NextResponse.json(link);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  await db.delete(schema.navLinks).where(eq(schema.navLinks.id, Number(id)));
  return NextResponse.json({ success: true });
}
