import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth";
import { decrypt, encrypt } from "@/lib/crypto";
import { resolveIconForStorage } from "@/lib/custom-icons";
import { db, schema } from "@/lib/db";
import { removeServiceIconFiles } from "@/lib/uploads";
import { invalidateWidgetCache } from "@/lib/widgets";

function readStoredCredentials(
  encrypted: string | null | undefined,
): Record<string, string> {
  if (!encrypted) return {};
  try {
    return JSON.parse(decrypt(encrypted)) as Record<string, string>;
  } catch {
    return {};
  }
}

function resolveWidgetCredentials(
  incoming: Record<string, string> | undefined,
  existingEncrypted: string | null | undefined,
): string | null {
  if (!incoming || Object.keys(incoming).length === 0) {
    return existingEncrypted ?? null;
  }

  const merged = {
    ...readStoredCredentials(existingEncrypted),
    ...incoming,
  };

  return encrypt(JSON.stringify(merged));
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const t = await getTranslations("api");
  const { id } = await params;
  const body = await request.json();
  const serviceId = Number(id);

  let icon: string | null | undefined = body.icon;
  try {
    icon = await resolveIconForStorage(icon, body.name);
  } catch {
    return NextResponse.json({ error: t("iconImportFailed") }, { status: 502 });
  }

  const [service] = await db
    .update(schema.services)
    .set({
      categoryId: body.categoryId,
      name: body.name,
      subtitle: body.subtitle,
      url: body.url,
      lanUrl: body.lanUrl,
      cardColor: body.cardColor,
      linkOpenMode: body.linkOpenMode ?? "same_tab",
      icon,
      sortOrder: body.sortOrder,
      healthCheckUrl: body.healthCheckUrl,
      enabled: body.enabled,
      insecureTls: body.insecureTls ?? false,
    })
    .where(eq(schema.services.id, serviceId))
    .returning();

  if (body.widget) {
    const existing = await db
      .select()
      .from(schema.widgetConfigs)
      .where(eq(schema.widgetConfigs.serviceId, serviceId));

    if (body.widget.widgetType) {
      const credentials = resolveWidgetCredentials(
        body.widget.credentials,
        existing[0]?.credentials,
      );

      if (existing.length > 0) {
        await db
          .update(schema.widgetConfigs)
          .set({
            widgetType: body.widget.widgetType,
            apiUrl: body.widget.apiUrl,
            credentials,
            extraConfig: body.widget.extraConfig
              ? JSON.stringify(body.widget.extraConfig)
              : null,
          })
          .where(eq(schema.widgetConfigs.serviceId, serviceId));
      } else {
        await db.insert(schema.widgetConfigs).values({
          serviceId,
          widgetType: body.widget.widgetType,
          apiUrl: body.widget.apiUrl,
          credentials,
          extraConfig: body.widget.extraConfig
            ? JSON.stringify(body.widget.extraConfig)
            : null,
        });
      }
    } else if (existing.length > 0) {
      await db
        .delete(schema.widgetConfigs)
        .where(eq(schema.widgetConfigs.serviceId, serviceId));
    }
  }

  invalidateWidgetCache();
  return NextResponse.json(service);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const serviceId = Number(id);
  removeServiceIconFiles(serviceId);
  await db.delete(schema.services).where(eq(schema.services.id, serviceId));
  return NextResponse.json({ success: true });
}
