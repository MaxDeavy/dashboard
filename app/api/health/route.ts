import { NextResponse } from "next/server";
import { getAllServices } from "@/lib/db/queries";
import { checkAllServicesHealth } from "@/lib/health";

export async function GET() {
  const services = await getAllServices();
  const results = await checkAllServicesHealth(services);
  return NextResponse.json(results);
}
