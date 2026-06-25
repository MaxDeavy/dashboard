import { NextResponse } from "next/server";
import { getServiceById } from "@/lib/db/queries";
import { checkServiceHealth } from "@/lib/health";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const service = await getServiceById(Number(id));

  if (!service) {
    return NextResponse.json({ error: "Service nicht gefunden" }, { status: 404 });
  }

  if (!service.healthCheckUrl) {
    return NextResponse.json({
      serviceId: service.id,
      status: "unknown",
    });
  }

  const result = await checkServiceHealth(
    service.id,
    service.healthCheckUrl,
    service.insecureTls,
  );

  return NextResponse.json(result);
}
