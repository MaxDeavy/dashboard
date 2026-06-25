import fs from "fs";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import path from "path";
import { requireAuth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import {
  ensureServiceIconsDir,
  getServiceIconFilename,
  getServiceIconPublicUrl,
  isAllowedImage,
  MAX_ICON_SIZE_BYTES,
  removeServiceIconFiles,
} from "@/lib/uploads";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const t = await getTranslations("api");
  const { id } = await params;
  const serviceId = Number(id);
  if (!serviceId) {
    return NextResponse.json({ error: t("invalidServiceId") }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(schema.services)
    .where(eq(schema.services.id, serviceId));

  if (!existing) {
    return NextResponse.json({ error: t("serviceNotFound") }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: t("noFile") }, { status: 400 });
  }

  if (!isAllowedImage(file)) {
    return NextResponse.json(
      { error: t("invalidFileType") },
      { status: 400 },
    );
  }

  if (file.size > MAX_ICON_SIZE_BYTES) {
    return NextResponse.json(
      { error: t("iconTooLarge") },
      { status: 400 },
    );
  }

  const ext = path.extname(file.name).toLowerCase() || ".png";
  const filename = getServiceIconFilename(serviceId, ext);
  const iconsDir = ensureServiceIconsDir();

  removeServiceIconFiles(serviceId);

  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(iconsDir, filename), buffer);

  const publicUrl = getServiceIconPublicUrl(serviceId, filename);

  const [service] = await db
    .update(schema.services)
    .set({ icon: publicUrl })
    .where(eq(schema.services.id, serviceId))
    .returning();

  return NextResponse.json({
    success: true,
    url: publicUrl,
    service,
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const t = await getTranslations("api");
  const { id } = await params;
  const serviceId = Number(id);
  if (!serviceId) {
    return NextResponse.json({ error: t("invalidServiceId") }, { status: 400 });
  }

  removeServiceIconFiles(serviceId);

  const [service] = await db
    .update(schema.services)
    .set({ icon: null })
    .where(eq(schema.services.id, serviceId))
    .returning();

  return NextResponse.json({ success: true, service });
}
