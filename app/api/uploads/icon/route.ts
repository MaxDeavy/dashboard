import fs from "fs";
import { NextResponse } from "next/server";
import path from "path";
import { getServiceIconFilePath } from "@/lib/uploads";

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const serviceId = Number(searchParams.get("serviceId"));
  const filename = searchParams.get("file");

  if (!serviceId || !filename) {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }

  let filePath: string;
  try {
    filePath = getServiceIconFilePath(serviceId, filename);
  } catch {
    return NextResponse.json({ error: "Ungültiger Pfad" }, { status: 400 });
  }

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Datei nicht gefunden" }, { status: 404 });
  }

  const ext = path.extname(filePath).toLowerCase();
  const buffer = fs.readFileSync(filePath);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": MIME_TYPES[ext] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
