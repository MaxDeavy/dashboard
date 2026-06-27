import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { requireDashboardAccess } from "@/lib/dashboard-auth";
import { getServiceById, getWidgetConfigByServiceId } from "@/lib/db/queries";
import { fetchWidgetData } from "@/lib/widgets";
import { localizeWidgetResult } from "@/lib/widgets/i18n";

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
  return NextResponse.json(data);
}
