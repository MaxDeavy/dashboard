import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth";
import { encrypt } from "@/lib/crypto";
import { resolveIconForStorage } from "@/lib/custom-icons";
import { db, schema } from "@/lib/db";
import { invalidateWidgetCache } from "@/lib/widgets";

export async function GET() {
  const services = await db
    .select()
    .from(schema.services)
    .orderBy(
      asc(schema.services.rowOrder),
      asc(schema.services.slotIndex),
      asc(schema.services.sortOrder),
    );

  const widgets = await db.select().from(schema.widgetConfigs);
  const widgetByService = Object.fromEntries(
    widgets.map((w) => [w.serviceId, w]),
  );

  return NextResponse.json(
    services.map((s) => ({
      ...s,
      widget: widgetByService[s.id] ?? null,
    })),
  );
}

export async function POST(request: Request) {
  const authError = await requireAuth();
  if (authError) return authError;

  const t = await getTranslations("api");
  const body = await request.json();

  let icon: string | null = body.icon ?? null;
  try {
    icon = await resolveIconForStorage(icon, body.name);
  } catch {
    return NextResponse.json({ error: t("iconImportFailed") }, { status: 502 });
  }

  const [service] = await db
    .insert(schema.services)
    .values({
      categoryId: body.categoryId,
      name: body.name,
      subtitle: body.subtitle ?? null,
      url: body.url,
      lanUrl: body.lanUrl ?? null,
      cardColor: body.cardColor ?? null,
      linkOpenMode: body.linkOpenMode ?? "same_tab",
      icon,
      sortOrder: body.sortOrder ?? 0,
      rowOrder: body.rowOrder ?? 0,
      slotIndex: body.slotIndex ?? 0,
      healthCheckUrl: body.healthCheckUrl ?? null,
      enabled: body.enabled ?? true,
      insecureTls: body.insecureTls ?? false,
    })
    .returning();

  if (body.widget?.widgetType) {
    await db.insert(schema.widgetConfigs).values({
      serviceId: service.id,
      widgetType: body.widget.widgetType,
      apiUrl: body.widget.apiUrl,
      credentials: body.widget.credentials
        ? encrypt(JSON.stringify(body.widget.credentials))
        : null,
      extraConfig: body.widget.extraConfig
        ? JSON.stringify(body.widget.extraConfig)
        : null,
    });
  }

  invalidateWidgetCache();
  return NextResponse.json(service, { status: 201 });
}
