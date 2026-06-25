import fs from "fs";
import { NextResponse } from "next/server";
import path from "path";
import { requireAuth } from "@/lib/auth";
import { setSetting } from "@/lib/db/queries";
import {
  DASHBOARD_LOGO_SETTING_KEY,
  ensureUploadsDir,
  getDashboardLogoPublicUrl,
  isAllowedImage,
  MAX_LOGO_SIZE_BYTES,
  removeDashboardLogoFiles,
} from "@/lib/uploads";

export async function POST(request: Request) {
  const authError = await requireAuth();
  if (authError) return authError;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Keine Datei übermittelt" }, { status: 400 });
  }

  if (!isAllowedImage(file)) {
    return NextResponse.json(
      { error: "Nur JPG, PNG, WebP, GIF, SVG oder ICO erlaubt" },
      { status: 400 },
    );
  }

  if (file.size > MAX_LOGO_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Datei zu groß (max. 1 MB)" },
      { status: 400 },
    );
  }

  const ext = path.extname(file.name).toLowerCase() || ".png";
  const filename = `dashboard-logo${ext}`;
  const uploadsDir = ensureUploadsDir();

  removeDashboardLogoFiles();

  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(uploadsDir, filename), buffer);

  const publicUrl = getDashboardLogoPublicUrl(filename);
  await setSetting(DASHBOARD_LOGO_SETTING_KEY, publicUrl);

  return NextResponse.json({
    success: true,
    url: publicUrl,
  });
}

export async function DELETE() {
  const authError = await requireAuth();
  if (authError) return authError;

  removeDashboardLogoFiles();
  await setSetting(DASHBOARD_LOGO_SETTING_KEY, "");

  return NextResponse.json({ success: true });
}
