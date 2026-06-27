import fs from "fs";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import path from "path";
import { getCustomIconFilePath } from "@/lib/custom-icons";
import { requireDashboardAccess } from "@/lib/dashboard-auth";

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
  const authError = await requireDashboardAccess();
  if (authError) return authError;

  const t = await getTranslations("api");
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("file");

  if (!filename) {
    return NextResponse.json({ error: t("invalidRequest") }, { status: 400 });
  }

  let filePath: string;
  try {
    filePath = getCustomIconFilePath(filename);
  } catch {
    return NextResponse.json({ error: t("invalidPath") }, { status: 400 });
  }

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: t("fileNotFound") }, { status: 404 });
  }

  const ext = path.extname(filePath).toLowerCase();
  const buffer = fs.readFileSync(filePath);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": MIME_TYPES[ext] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
