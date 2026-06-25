import fs from "fs";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import path from "path";
import { requireAuth } from "@/lib/auth";
import { importIconFromBuffer } from "@/lib/custom-icons";
import { isAllowedImage, MAX_ICON_SIZE_BYTES } from "@/lib/uploads";

export async function POST(request: Request) {
  const authError = await requireAuth();
  if (authError) return authError;

  const t = await getTranslations("api");
  const formData = await request.formData();
  const file = formData.get("file");
  const label = String(formData.get("label") ?? "").trim();

  if (!(file instanceof File)) {
    return NextResponse.json({ error: t("noFile") }, { status: 400 });
  }

  if (!isAllowedImage(file)) {
    return NextResponse.json({ error: t("invalidFileType") }, { status: 400 });
  }

  if (file.size > MAX_ICON_SIZE_BYTES) {
    return NextResponse.json({ error: t("iconTooLarge") }, { status: 400 });
  }

  const name = label || path.basename(file.name, path.extname(file.name));
  if (!name.trim()) {
    return NextResponse.json({ error: t("invalidData") }, { status: 400 });
  }

  const ext = path.extname(file.name).toLowerCase() || ".png";
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const result = importIconFromBuffer(buffer, name, ext, label || name);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "Icon too large") {
      return NextResponse.json({ error: t("iconTooLarge") }, { status: 400 });
    }
    return NextResponse.json({ error: t("invalidData") }, { status: 400 });
  }
}
