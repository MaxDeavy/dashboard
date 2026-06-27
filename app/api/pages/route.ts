import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { requireDashboardAccess } from "@/lib/dashboard-auth";
import { db, schema } from "@/lib/db";

export async function GET() {
  const authError = await requireDashboardAccess();
  if (authError) return authError;

  const pages = await db
    .select()
    .from(schema.pages)
    .orderBy(asc(schema.pages.sortOrder));
  return NextResponse.json(pages);
}

export async function POST(request: Request) {
  const authError = await requireAuth();
  if (authError) return authError;

  const body = await request.json();
  const existing = await db.select().from(schema.pages);
  const nextOrder =
    existing.length === 0
      ? 0
      : Math.max(...existing.map((page) => page.sortOrder)) + 1;

  const [page] = await db
    .insert(schema.pages)
    .values({
      name: body.name,
      sortOrder: nextOrder,
      enabled: body.enabled ?? true,
    })
    .returning();

  return NextResponse.json(page, { status: 201 });
}
