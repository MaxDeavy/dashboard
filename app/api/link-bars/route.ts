import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getLinkBarsWithLinks } from "@/lib/db/queries";
import { db, schema } from "@/lib/db";

export async function GET() {
  const data = await getLinkBarsWithLinks();
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const authError = await requireAuth();
  if (authError) return authError;

  const body = await request.json();
  const zone = body.zone === "footer" ? "footer" : "header";

  const existing = await db
    .select()
    .from(schema.linkBars)
    .where(eq(schema.linkBars.zone, zone));

  const [bar] = await db
    .insert(schema.linkBars)
    .values({
      zone,
      sortOrder: body.sortOrder ?? existing.length,
      title: body.title ?? null,
    })
    .returning();

  return NextResponse.json(bar, { status: 201 });
}
