import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { getSession } from "@/lib/auth";
import { isDashboardAuthRequired } from "@/lib/dashboard-auth-constants";
import { getDashboardData, getSettings } from "@/lib/db/queries";
import { seedDatabase } from "@/lib/db/seed";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await seedDatabase();
  const settings = await getSettings();

  if (isDashboardAuthRequired(settings)) {
    const session = await getSession();
    if (!session.isLoggedIn) {
      redirect("/login?next=/");
    }
  }

  const data = await getDashboardData();

  return <DashboardClient initialData={data} />;
}
