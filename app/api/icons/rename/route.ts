import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth";
import { renameCustomIcon } from "@/lib/custom-icons";

/** @deprecated Prefer PATCH /api/icons/label */
export async function PATCH(request: Request) {
  const authError = await requireAuth();
  if (authError) return authError;

  const t = await getTranslations("api");

  let body: { filename?: string; label?: string };
  try {
    body = (await request.json()) as { filename?: string; label?: string };
  } catch {
    return NextResponse.json({ error: t("invalidData") }, { status: 400 });
  }

  const filename = body.filename?.trim();
  const label = body.label?.trim();

  if (!filename || !label) {
    return NextResponse.json({ error: t("invalidData") }, { status: 400 });
  }

  try {
    const savedLabel = renameCustomIcon(filename, label);
    return NextResponse.json({
      filename,
      label: savedLabel,
      url: `/api/uploads/custom-icon?file=${encodeURIComponent(filename)}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "File not found") {
      return NextResponse.json({ error: t("fileNotFound") }, { status: 404 });
    }
    return NextResponse.json({ error: t("invalidData") }, { status: 400 });
  }
}
