import fs from "fs";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSetting } from "@/lib/db/queries";
import {
  DASHBOARD_LOGO_SETTING_KEY,
  findDashboardLogoFilename,
  getDashboardLogoFilePath,
} from "@/lib/uploads";

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

export async function GET() {
  const t = await getTranslations("api");
  const storedUrl = await getSetting(DASHBOARD_LOGO_SETTING_KEY);
  const filename =
    storedUrl?.split("file=")[1] != null
      ? decodeURIComponent(storedUrl.split("file=")[1]!)
      : findDashboardLogoFilename();

  if (!filename) {
    return NextResponse.json({ error: t("noLogo") }, { status: 404 });
  }

  let filePath: string;
  try {
    filePath = getDashboardLogoFilePath(filename);
  } catch {
    return NextResponse.json({ error: t("invalidPath") }, { status: 400 });
  }

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: t("fileNotFound") }, { status: 404 });
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
