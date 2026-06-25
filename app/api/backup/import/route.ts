import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth";
import { restoreBackupArchive } from "@/lib/backup";

export async function POST(request: Request) {
  const authError = await requireAuth();
  if (authError) return authError;

  const t = await getTranslations("api");

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: t("noBackupFile") },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    restoreBackupArchive(buffer);

    return NextResponse.json({
      ok: true,
      message: t("backupImported"),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : t("backupImportFailed");
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
