import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/db/queries";
import { seedDatabase } from "@/lib/db/seed";

export async function GET() {
  await seedDatabase();
  const data = await getDashboardData();
  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}
