import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/dashboard-auth";
import { getAllServices } from "@/lib/db/queries";
import { checkAllServicesHealth } from "@/lib/health";

export async function GET() {
  const authError = await requireDashboardAccess();
  if (authError) return authError;

  const services = await getAllServices();
  const results = await checkAllServicesHealth(services);
  return NextResponse.json(results);
}
