"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { HealthStatus } from "@/lib/health";
import type { Category, LinkBarWithLinks, Page } from "@/lib/db/schema";
import { applyColorMode, resolveTheme } from "@/lib/theme-presets";
import { resolveLayoutSettings } from "@/lib/layout-settings";
import {
  SHOW_PAGE_SWITCHER_SETTING,
  readStoredActivePageId,
  writeStoredActivePageId,
} from "@/lib/page-storage";
import { usePageKeyboardShortcuts } from "@/hooks/usePageKeyboardShortcuts";
import { useAppNavigationShortcuts } from "@/hooks/useAppNavigationShortcuts";
import { DashboardBackground } from "./DashboardBackground";
import { DashboardFooter } from "./DashboardFooter";
import { DashboardHeader } from "./DashboardHeader";
import { LayoutWidthShell } from "./LayoutWidthShell";
import { useIsLoggedIn } from "@/hooks/useIsLoggedIn";
import { NetworkModeToggle, useNetworkMode } from "./NetworkModeToggle";
import { isLanEnabled } from "@/lib/network-mode";
import { isSearchEnabled } from "@/lib/dashboard-search";
import { ServiceGrid } from "./ServiceGrid";
import type { ServiceWithWidget } from "./ServiceCard";
import { WidgetPanelProvider } from "./WidgetPanelContext";

interface ColumnData extends Category {
  services: ServiceWithWidget[];
  isEmpty?: boolean;
}

interface PageBoard {
  pageId: number;
  columns: ColumnData[];
}

interface DashboardData {
  pages: Page[];
  pageBoards: PageBoard[];
  headerBars: LinkBarWithLinks[];
  footerBars: LinkBarWithLinks[];
  settings: Record<string, string>;
}

function resolveInitialPageId(pages: Page[]): number {
  const stored = readStoredActivePageId();
  if (stored != null && pages.some((page) => page.id === stored)) {
    return stored;
  }
  return pages[0]?.id ?? 0;
}

export function DashboardClient({ initialData }: { initialData: DashboardData }) {
  const t = useTranslations("dashboard");
  const [data, setData] = useState(initialData);
  const [activePageId, setActivePageId] = useState(() =>
    resolveInitialPageId(initialData.pages),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [healthMap, setHealthMap] = useState<Record<number, HealthStatus>>({});
  const [networkMode, setNetworkMode] = useNetworkMode();
  const isLoggedIn = useIsLoggedIn();

  const refreshDashboard = useCallback(async () => {
    try {
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      if (response.ok) {
        const nextData: DashboardData = await response.json();
        setData(nextData);
        setActivePageId((current) => {
          if (nextData.pages.some((page) => page.id === current)) {
            return current;
          }
          return resolveInitialPageId(nextData.pages);
        });
      }
    } catch {
      // silently fail
    }
  }, []);

  const handlePageChange = useCallback((pageId: number) => {
    setActivePageId(pageId);
    writeStoredActivePageId(pageId);
  }, []);

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        refreshDashboard();
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [refreshDashboard]);

  const fetchHealth = useCallback(async () => {
    try {
      const response = await fetch("/api/health");
      if (response.ok) {
        const results: Array<{ serviceId: number; status: HealthStatus }> =
          await response.json();
        setHealthMap(
          Object.fromEntries(results.map((r) => [r.serviceId, r.status])),
        );
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 60_000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const theme = resolveTheme(data.settings);
  const layout = resolveLayoutSettings(data.settings);
  const accentColor = theme.accentColor;
  const baseCardColor = theme.cardBaseColor;
  const glowColor = theme.glowColor;
  const colorMode = theme.colorMode;
  const backgroundColor = theme.backgroundColor;
  const dashboardTitle =
    data.settings.dashboard_title ?? t("defaultTitle");
  const dashboardSubtitle = data.settings.dashboard_subtitle ?? t("defaultSubtitle");
  const showPageSwitcher =
    data.settings[SHOW_PAGE_SWITCHER_SETTING] !== "false";
  const lanEnabled = isLanEnabled(data.settings);
  const searchEnabled = isSearchEnabled(data.settings);
  const effectiveNetworkMode = lanEnabled ? networkMode : "web";
  const effectiveSearchQuery = searchEnabled ? searchQuery : "";

  const activeColumns = useMemo(() => {
    const board = data.pageBoards.find((entry) => entry.pageId === activePageId);
    return board?.columns ?? data.pageBoards[0]?.columns ?? [];
  }, [data.pageBoards, activePageId]);

  usePageKeyboardShortcuts(
    data.pages,
    activePageId,
    handlePageChange,
    true,
  );

  useAppNavigationShortcuts();

  useEffect(() => {
    applyColorMode(colorMode);
  }, [colorMode]);

  useEffect(() => {
    if (!searchEnabled) {
      setSearchQuery("");
    }
  }, [searchEnabled]);

  useEffect(() => {
    if (!lanEnabled && networkMode === "lan") {
      setNetworkMode("web");
    }
  }, [lanEnabled, networkMode, setNetworkMode]);

  return (
    <WidgetPanelProvider>
    <div className="dashboard-surface relative flex h-dvh flex-col overflow-hidden">
      <DashboardBackground
        accentColor={accentColor}
        glowColor={glowColor}
        colorMode={colorMode}
        backgroundColor={backgroundColor}
        backgroundImageUrl={data.settings.background_image || null}
      />

      <DashboardHeader
        headerBars={data.headerBars}
        pages={data.pages}
        activePageId={activePageId}
        onPageChange={handlePageChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        accentColor={accentColor}
        dashboardTitle={dashboardTitle}
        dashboardSubtitle={dashboardSubtitle}
        dashboardLogo={data.settings.dashboard_logo || null}
        networkMode={effectiveNetworkMode}
        onNetworkModeChange={setNetworkMode}
        layout={layout}
        layoutEditable={isLoggedIn}
        onLayoutSaved={refreshDashboard}
        showPageSwitcher={showPageSwitcher}
        pageKeyboardShortcutsEnabled={true}
        lanEnabled={lanEnabled}
        searchEnabled={searchEnabled}
      />

      <main className="min-h-0 flex-1 overflow-y-auto py-4 sm:py-6 lg:py-8">
        <LayoutWidthShell layout={layout}>
        {(lanEnabled || searchEnabled) ? (
        <div className="mb-5 flex gap-2 sm:hidden">
          {lanEnabled && (
            <NetworkModeToggle
              mode={effectiveNetworkMode}
              onChange={setNetworkMode}
              className="shrink-0"
            />
          )}
          {searchEnabled ? (
            <input
              type="search"
              placeholder={t("search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border/60 bg-background/50 px-4 py-2.5 text-sm shadow-inner ring-1 ring-foreground/5 placeholder:text-muted-foreground backdrop-blur-sm"
            />
          ) : null}
        </div>
        ) : null}

        <ServiceGrid
          columns={activeColumns}
          searchQuery={effectiveSearchQuery}
          healthMap={healthMap}
          baseCardColor={baseCardColor}
          networkMode={effectiveNetworkMode}
          layout={layout}
          layoutEditable={isLoggedIn}
          onLayoutSaved={refreshDashboard}
        />
        </LayoutWidthShell>
      </main>

      <DashboardFooter
        footerBars={data.footerBars}
        accentColor={accentColor}
        layout={layout}
        layoutEditable={isLoggedIn}
        onLayoutSaved={refreshDashboard}
      />
    </div>
    </WidgetPanelProvider>
  );
}
