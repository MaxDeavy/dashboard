import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth";
import { requireDashboardAccess } from "@/lib/dashboard-auth";
import { db, schema } from "@/lib/db";
import { getServiceById, getWidgetConfigByServiceId } from "@/lib/db/queries";
import {
  fetchWidgetData,
  invalidateWidgetCacheForService,
} from "@/lib/widgets";
import { localizeWidgetResult } from "@/lib/widgets/i18n";
import {
  parseHiddenWidgetFields,
  serializeHiddenWidgetFields,
} from "@/lib/widget-hidden-fields";
import {
  parseWidgetExtraConfig,
  serializeWidgetExtraConfig,
} from "@/lib/widget-extra-config";

async function buildWidgetResponse(serviceId: number) {
  const tFields = await getTranslations("widgetFields");
  const tErrors = await getTranslations("widgetErrors");
  const config = await getWidgetConfigByServiceId(serviceId);

  if (!config) {
    return null;
  }

  const data = localizeWidgetResult(
    await fetchWidgetData(serviceId, config),
    (key) => tFields(key),
    (key) => tErrors(key),
  );

  return {
    ...data,
    hiddenFieldIds: parseHiddenWidgetFields(config.hiddenFields),
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireDashboardAccess();
  if (authError) return authError;

  const tApi = await getTranslations("api");
  const { id } = await params;
  const serviceId = Number(id);

  const service = await getServiceById(serviceId);
  if (!service) {
    return NextResponse.json({ error: tApi("serviceNotFound") }, { status: 404 });
  }

  const config = await getWidgetConfigByServiceId(serviceId);
  if (!config) {
    return NextResponse.json({ error: tApi("noWidgetConfigured") }, { status: 404 });
  }

  const response = await buildWidgetResponse(serviceId);
  if (!response) {
    return NextResponse.json({ error: tApi("noWidgetConfigured") }, { status: 404 });
  }

  return NextResponse.json(response);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const tApi = await getTranslations("api");
  const { id } = await params;
  const serviceId = Number(id);
  const body = (await request.json()) as {
    hiddenFieldIds?: unknown;
    extraConfig?: unknown;
  };

  const config = await getWidgetConfigByServiceId(serviceId);
  if (!config) {
    return NextResponse.json({ error: tApi("noWidgetConfigured") }, { status: 404 });
  }

  const updates: Partial<typeof schema.widgetConfigs.$inferInsert> = {};
  let configChanged = false;

  if (body.hiddenFieldIds !== undefined) {
    if (!Array.isArray(body.hiddenFieldIds)) {
      return NextResponse.json({ error: tApi("invalidRequest") }, { status: 400 });
    }

    const hiddenFieldIds = body.hiddenFieldIds.filter(
      (entry): entry is string => typeof entry === "string",
    );
    updates.hiddenFields = serializeHiddenWidgetFields(hiddenFieldIds);
    configChanged = true;
  }

  if (body.extraConfig !== undefined) {
    if (
      !body.extraConfig ||
      typeof body.extraConfig !== "object" ||
      Array.isArray(body.extraConfig)
    ) {
      return NextResponse.json({ error: tApi("invalidRequest") }, { status: 400 });
    }

    const patch: Record<string, string> = {};
    for (const [key, value] of Object.entries(body.extraConfig)) {
      if (typeof value === "string") {
        patch[key] = value;
      }
    }

    const merged = {
      ...parseWidgetExtraConfig(config.extraConfig),
      ...patch,
    };
    updates.extraConfig = serializeWidgetExtraConfig(merged);
    configChanged = true;
  }

  if (!configChanged) {
    return NextResponse.json({ error: tApi("invalidRequest") }, { status: 400 });
  }

  await db
    .update(schema.widgetConfigs)
    .set(updates)
    .where(eq(schema.widgetConfigs.serviceId, serviceId));

  invalidateWidgetCacheForService(serviceId);

  const response = await buildWidgetResponse(serviceId);
  if (!response) {
    return NextResponse.json({ error: tApi("noWidgetConfigured") }, { status: 404 });
  }

  return NextResponse.json(response);
}
