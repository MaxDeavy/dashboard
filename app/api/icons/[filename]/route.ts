import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth";
import {
  deleteCustomIcon,
  getCustomIconPublicUrl,
} from "@/lib/custom-icons";
import { db, schema } from "@/lib/db";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const t = await getTranslations("api");
  const { filename } = await params;
  const safeName = decodeURIComponent(filename);

  try {
    const iconUrl = getCustomIconPublicUrl(safeName);
    deleteCustomIcon(safeName);

    await db
      .update(schema.services)
      .set({ icon: null })
      .where(eq(schema.services.icon, iconUrl));

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "File not found" || message === "Invalid filename") {
      return NextResponse.json({ error: t("fileNotFound") }, { status: 404 });
    }
    return NextResponse.json({ error: t("invalidData") }, { status: 400 });
  }
}
