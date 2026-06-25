import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
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

  const [page] = await db
    .update(schema.pages)
    .set({
      name: body.name,
      sortOrder: body.sortOrder,
      enabled: body.enabled,
    })
    .where(eq(schema.pages.id, Number(id)))
    .returning();

  return NextResponse.json(page);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const t = await getTranslations("api");
  const { id } = await params;
  const pageId = Number(id);

  const allPages = await db.select().from(schema.pages);
  if (allPages.length <= 1) {
    return NextResponse.json(
      { error: t("cannotDeleteLastPage") },
      { status: 400 },
    );
  }

  await db.delete(schema.pages).where(eq(schema.pages.id, pageId));
  return NextResponse.json({ success: true });
}
