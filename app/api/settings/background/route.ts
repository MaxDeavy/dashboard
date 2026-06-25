import fs from "fs";
import { NextResponse } from "next/server";
import path from "path";
import { requireAuth } from "@/lib/auth";
import { setSetting } from "@/lib/db/queries";
import {
  BACKGROUND_SETTING_KEY,
  ensureUploadsDir,
  getBackgroundPublicUrl,
  isAllowedImage,
  MAX_BACKGROUND_SIZE_BYTES,
  removeBackgroundFiles,
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
      { error: "Nur JPG, PNG, WebP oder GIF erlaubt" },
      { status: 400 },
    );
  }

  if (file.size > MAX_BACKGROUND_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Datei zu groß (max. 5 MB)" },
      { status: 400 },
    );
  }

  const ext = path.extname(file.name).toLowerCase() || ".jpg";
  const filename = `background${ext}`;
  const uploadsDir = ensureUploadsDir();

  removeBackgroundFiles();

  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(uploadsDir, filename), buffer);

  const publicUrl = getBackgroundPublicUrl(filename);
  await setSetting(BACKGROUND_SETTING_KEY, publicUrl);

  return NextResponse.json({
    success: true,
    url: publicUrl,
  });
}

export async function DELETE() {
  const authError = await requireAuth();
  if (authError) return authError;

  removeBackgroundFiles();
  await setSetting(BACKGROUND_SETTING_KEY, "");

  return NextResponse.json({ success: true });
}
