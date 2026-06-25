import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { importIconFromUrl } from "@/lib/custom-icons";
import { isExternalIconUrl } from "@/lib/icon-url";
import { requireAuth } from "@/lib/auth";

export async function POST(request: Request) {
  const authError = await requireAuth();
  if (authError) return authError;

  const t = await getTranslations("api");

  let body: { url?: string; label?: string };
  try {
    body = (await request.json()) as { url?: string; label?: string };
  } catch {
    return NextResponse.json({ error: t("invalidData") }, { status: 400 });
  }

  const url = body.url?.trim();
  if (!url || !isExternalIconUrl(url)) {
    return NextResponse.json({ error: t("invalidIconUrl") }, { status: 400 });
  }

  try {
    const result = await importIconFromUrl(url, {
      label: body.label?.trim() || undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "Icon too large") {
      return NextResponse.json({ error: t("iconTooLarge") }, { status: 400 });
    }
    if (message === "Invalid image data") {
      return NextResponse.json({ error: t("invalidImageData") }, { status: 400 });
    }
    return NextResponse.json(
      { error: t("iconImportFailed") },
      { status: 502 },
    );
  }
}
