import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db, schema } from "@/lib/db";

export async function GET() {
  const links = await db
    .select()
    .from(schema.navLinks)
    .orderBy(asc(schema.navLinks.sortOrder));
  return NextResponse.json(links);
}

export async function POST(request: Request) {
  const authError = await requireAuth();
  if (authError) return authError;

  const body = await request.json();

  if (!body.barId) {
    return NextResponse.json({ error: "barId erforderlich" }, { status: 400 });
  }

  const [link] = await db
    .insert(schema.navLinks)
    .values({
      barId: body.barId,
      label: body.label,
      url: body.url,
      icon: body.icon ?? null,
      sortOrder: body.sortOrder ?? 0,
      enabled: body.enabled ?? true,
      linkOpenMode: body.linkOpenMode ?? "same_tab",
    })
    .returning();

  return NextResponse.json(link, { status: 201 });
}
