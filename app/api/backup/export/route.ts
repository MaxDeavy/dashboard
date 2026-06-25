import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createBackupArchive } from "@/lib/backup";

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const archive = createBackupArchive();
    const date = new Date().toISOString().slice(0, 10);

    return new NextResponse(new Uint8Array(archive), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="dashboard-backup-${date}.zip"`,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Backup-Export fehlgeschlagen";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
