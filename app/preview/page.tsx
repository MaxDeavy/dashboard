import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PreviewDashboard } from "@/components/dashboard/PreviewDashboard";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("previewExample");

  return {
    title: t("pageTitle"),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function PreviewPage() {
  return <PreviewDashboard />;
}
