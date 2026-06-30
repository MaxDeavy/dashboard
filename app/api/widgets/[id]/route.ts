import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth";
import { requireDashboardAccess } from "@/lib/dashboard-auth";
import { db, schema } from "@/lib/db";
import { getServiceById, getWidgetConfigByServiceId } from "@/lib/db/queries";
import { fetchWidgetData } from "@/lib/widgets";
import { localizeWidgetResult } from "@/lib/widgets/i18n";
import {
  parseHiddenWidgetFields,
  serializeHiddenWidgetFields,
} from "@/lib/widget-hidden-fields";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireDashboardAccess();
  if (authError) return authError;

  const tApi = await getTranslations("api");
  const tFields = await getTranslations("widgetFields");
  const tErrors = await getTranslations("widgetErrors");
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

  const data = localizeWidgetResult(
    await fetchWidgetData(serviceId, config),
    (key) => tFields(key),
    (key) => tErrors(key),
  );

  return NextResponse.json({
    ...data,
    hiddenFieldIds: parseHiddenWidgetFields(config.hiddenFields),
  });
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
  const body = (await request.json()) as { hiddenFieldIds?: unknown };

  if (!Array.isArray(body.hiddenFieldIds)) {
    return NextResponse.json({ error: tApi("invalidRequest") }, { status: 400 });
  }

  const hiddenFieldIds = body.hiddenFieldIds.filter(
    (entry): entry is string => typeof entry === "string",
  );

  const config = await getWidgetConfigByServiceId(serviceId);
  if (!config) {
    return NextResponse.json({ error: tApi("noWidgetConfigured") }, { status: 404 });
  }

  await db
    .update(schema.widgetConfigs)
    .set({
      hiddenFields: serializeHiddenWidgetFields(hiddenFieldIds),
    })
    .where(eq(schema.widgetConfigs.serviceId, serviceId));

  return NextResponse.json({ hiddenFieldIds });
}
