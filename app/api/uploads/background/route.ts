import fs from "fs";
import { NextResponse } from "next/server";
import { getSetting } from "@/lib/db/queries";
import {
  BACKGROUND_SETTING_KEY,
  findBackgroundFilename,
  getBackgroundFilePath,
} from "@/lib/uploads";

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function GET() {
  const storedUrl = await getSetting(BACKGROUND_SETTING_KEY);
  const filename =
    storedUrl?.split("file=")[1] != null
      ? decodeURIComponent(storedUrl.split("file=")[1]!)
      : findBackgroundFilename();

  if (!filename) {
    return NextResponse.json({ error: "Kein Hintergrundbild" }, { status: 404 });
  }

  let filePath: string;
  try {
    filePath = getBackgroundFilePath(filename);
  } catch {
    return NextResponse.json({ error: "Ungültiger Pfad" }, { status: 400 });
  }

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Datei nicht gefunden" }, { status: 404 });
  }

  const ext = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
  const buffer = fs.readFileSync(filePath);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": MIME_TYPES[ext] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
