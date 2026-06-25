import { NextResponse } from "next/server";
import { getServiceById, getWidgetConfigByServiceId } from "@/lib/db/queries";
import { fetchWidgetData } from "@/lib/widgets";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const serviceId = Number(id);

  const service = await getServiceById(serviceId);
  if (!service) {
    return NextResponse.json({ error: "Service nicht gefunden" }, { status: 404 });
  }

  const config = await getWidgetConfigByServiceId(serviceId);
  if (!config) {
    return NextResponse.json(
      { error: "Kein Widget konfiguriert" },
      { status: 404 },
    );
  }

  const data = await fetchWidgetData(serviceId, config);
  return NextResponse.json(data);
}
