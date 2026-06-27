import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/dashboard-auth";
import { getDashboardData } from "@/lib/db/queries";
import { seedDatabase } from "@/lib/db/seed";

export async function GET() {
  const authError = await requireDashboardAccess();
  if (authError) return authError;

  await seedDatabase();
  const data = await getDashboardData();
  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}
