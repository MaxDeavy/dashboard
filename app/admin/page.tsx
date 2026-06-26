"use client";

import { useLayoutEffect, useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LinkBarsAdmin } from "@/components/admin/LinkBarsAdmin";
import { PagesAdmin } from "@/components/admin/PagesAdmin";
import { ServicesAdmin } from "@/components/admin/ServicesAdmin";
import { SettingsAdmin } from "@/components/admin/SettingsAdmin";
import {
  parseAdminTab,
  readStoredAdminTab,
  writeStoredAdminTab,
  type AdminTab,
} from "@/lib/admin-tab";
import type { Category, LinkBarWithLinks, Page, Service } from "@/lib/db/schema";
import { resolveTheme } from "@/lib/theme-presets";
import { isLanEnabled } from "@/lib/network-mode";

interface ServiceWithWidget extends Service {
  widget: {
    widgetType: string;
    apiUrl: string;
    extraConfig: string | null;
  } | null;
}

interface LinkBarsData {
  headers: LinkBarWithLinks[];
  footers: LinkBarWithLinks[];
}

export default function AdminPage() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<AdminTab>("services");
  const [categories, setCategories] = useState<Category[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [services, setServices] = useState<ServiceWithWidget[]>([]);
  const [linkBars, setLinkBars] = useState<LinkBarsData>({
    headers: [],
    footers: [],
  });
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    const fromUrl = parseAdminTab(searchParams.get("tab"));
    if (fromUrl) {
      setActiveTab(fromUrl);
      writeStoredAdminTab(fromUrl);
      return;
    }

    const stored = readStoredAdminTab();
    setActiveTab(stored);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", stored);
    router.replace(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams]);

  const loadData = useCallback(async () => {
    const [catRes, pagesRes, svcRes, barsRes, setRes] = await Promise.all([
      fetch("/api/categories"),
      fetch("/api/pages"),
      fetch("/api/services"),
      fetch("/api/link-bars"),
      fetch("/api/settings"),
    ]);

    setCategories(await catRes.json());
    setPages(await pagesRes.json());
    setServices(await svcRes.json());
    setLinkBars(await barsRes.json());
    setSettings(await setRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTabChange = useCallback(
    (value: string) => {
      const tab = parseAdminTab(value);
      if (!tab) return;

      writeStoredAdminTab(tab);
      setActiveTab(tab);
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  if (loading) {
    return (
      <div className="py-20 text-center text-muted-foreground">{tc("loading")}</div>
    );
  }

  const theme = resolveTheme(settings);
  const lanEnabled = isLanEnabled(settings);

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full min-w-0">
      <TabsList className="glass-panel sticky top-[4.5rem] z-40 mb-6 h-auto w-full justify-start gap-1 rounded-xl p-1 backdrop-blur-md sm:w-auto">
        <TabsTrigger value="services" className="rounded-lg px-4 py-2">
          {t("tabs.services")}
        </TabsTrigger>
        <TabsTrigger value="pages" className="rounded-lg px-4 py-2">
          {t("tabs.pages")}
        </TabsTrigger>
        <TabsTrigger value="nav" className="rounded-lg px-4 py-2">
          {t("tabs.nav")}
        </TabsTrigger>
        <TabsTrigger value="settings" className="rounded-lg px-4 py-2">
          {t("tabs.settings")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="services" className="w-full min-w-0">
        <ServicesAdmin
          services={services}
          categories={categories}
          pages={pages}
          defaultCardColor={theme.cardBaseColor}
          lanEnabled={lanEnabled}
          onRefresh={loadData}
          onSuccess={(msg) => toast.success(msg)}
          onError={(msg) => toast.error(msg)}
        />
      </TabsContent>

      <TabsContent value="pages" className="w-full min-w-0">
        <PagesAdmin
          pages={pages}
          onRefresh={loadData}
          onSuccess={(msg) => toast.success(msg)}
          onError={(msg) => toast.error(msg)}
        />
      </TabsContent>

      <TabsContent value="nav" className="w-full min-w-0">
        <LinkBarsAdmin
          data={linkBars}
          onRefresh={loadData}
          onSuccess={(msg) => toast.success(msg)}
          onError={(msg) => toast.error(msg)}
        />
      </TabsContent>

      <TabsContent value="settings" className="w-full min-w-0">
        <SettingsAdmin
          settings={settings}
          onRefresh={loadData}
          onSuccess={(msg) => toast.success(msg)}
          onError={(msg) => toast.error(msg)}
        />
      </TabsContent>
    </Tabs>
  );
}
