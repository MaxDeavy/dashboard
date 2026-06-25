import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { getDashboardData } from "@/lib/db/queries";
import { seedDatabase } from "@/lib/db/seed";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await seedDatabase();
  const data = await getDashboardData();

  return <DashboardClient initialData={data} />;
}
