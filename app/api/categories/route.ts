import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db, schema } from "@/lib/db";

export async function GET() {
  const categories = await db
    .select()
    .from(schema.categories)
    .orderBy(asc(schema.categories.columnPosition));
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const authError = await requireAuth();
  if (authError) return authError;

  const body = await request.json();
  const pageId = Number(body.pageId);
  if (!Number.isFinite(pageId) || pageId < 1) {
    return NextResponse.json({ error: "pageId erforderlich" }, { status: 400 });
  }

  const existing = await db
    .select()
    .from(schema.categories)
    .where(eq(schema.categories.pageId, pageId));
  const nextPosition =
    existing.length === 0
      ? 0
      : Math.max(...existing.map((category) => category.columnPosition)) + 1;

  const [category] = await db
    .insert(schema.categories)
    .values({
      pageId,
      name: body.name,
      sortOrder: nextPosition,
      columnPosition: nextPosition,
      color: body.color ?? null,
    })
    .returning();

  return NextResponse.json(category, { status: 201 });
}
