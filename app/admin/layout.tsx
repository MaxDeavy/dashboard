import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";

async function AdminLoading() {
  const t = await getTranslations("common");
  return (
    <div className="py-20 text-center text-muted-foreground">{t("loading")}</div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="animate-aurora-drift absolute -top-1/4 left-1/3 size-[500px] rounded-full bg-orange-500/10 blur-[100px] dark:bg-orange-600/15" />
        <div
          className="absolute inset-0 opacity-[0.25] dark:opacity-[0.25]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(128,128,128,0.15) 1px, transparent 0)`,
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <AdminHeader />
      <main className="relative mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <Suspense fallback={<AdminLoading />}>{children}</Suspense>
      </main>
    </div>
  );
}
