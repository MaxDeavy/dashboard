import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { restoreBackupArchive } from "@/lib/backup";

export async function POST(request: Request) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: "Keine Backup-Datei hochgeladen" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    restoreBackupArchive(buffer);

    return NextResponse.json({
      ok: true,
      message:
        "Backup importiert. Die Seite wird neu geladen, damit alle Daten übernommen werden.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Backup-Import fehlgeschlagen";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
