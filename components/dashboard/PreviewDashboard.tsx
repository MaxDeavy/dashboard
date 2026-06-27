"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { applyColorMode, resolveTheme } from "@/lib/theme-presets";
import { resolveLayoutSettings } from "@/lib/layout-settings";
import { isLanEnabled } from "@/lib/network-mode";
import { usePreviewDashboardData } from "@/hooks/usePreviewDashboardData";
import { DashboardBackground } from "./DashboardBackground";
import { DashboardFooter } from "./DashboardFooter";
import { DashboardHeader } from "./DashboardHeader";
import { LayoutWidthShell } from "./LayoutWidthShell";
import { NetworkModeToggle } from "./NetworkModeToggle";
import { ServiceGrid } from "./ServiceGrid";

export function PreviewDashboard() {
  const t = useTranslations("dashboard");
  const data = usePreviewDashboardData();
  const [activePageId, setActivePageId] = useState(data.pages[0]?.id ?? 0);
  const [searchQuery, setSearchQuery] = useState("");
  const [networkMode, setNetworkMode] = useState<"web" | "lan">("web");

  const theme = resolveTheme(data.settings);
  const layout = resolveLayoutSettings(data.settings);
  const lanEnabled = isLanEnabled(data.settings);
  const effectiveNetworkMode = lanEnabled ? networkMode : "web";

  const activeColumns = useMemo(() => {
    const board = data.pageBoards.find((entry) => entry.pageId === activePageId);
    return board?.columns ?? data.pageBoards[0]?.columns ?? [];
  }, [activePageId, data.pageBoards]);

  useEffect(() => {
    if (!data.pages.some((page) => page.id === activePageId)) {
      setActivePageId(data.pages[0]?.id ?? 0);
    }
  }, [activePageId, data.pages]);

  useEffect(() => {
    applyColorMode(theme.colorMode);
  }, [theme.colorMode]);

  return (
    <div className="preview-screenshot dashboard-surface relative flex h-dvh flex-col overflow-hidden">
      <DashboardBackground
        accentColor={theme.accentColor}
        glowColor={theme.glowColor}
        colorMode={theme.colorMode}
        backgroundImageUrl={null}
      />

      <DashboardHeader
        headerBars={data.headerBars}
        pages={data.pages}
        activePageId={activePageId}
        onPageChange={setActivePageId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        accentColor={theme.accentColor}
        dashboardTitle={data.settings.dashboard_title ?? t("defaultTitle")}
        dashboardSubtitle={data.settings.dashboard_subtitle ?? t("defaultSubtitle")}
        dashboardLogo={null}
        networkMode={effectiveNetworkMode}
        onNetworkModeChange={setNetworkMode}
        layout={layout}
        layoutEditable={false}
        showPageSwitcher
        pageKeyboardShortcutsEnabled={false}
        lanEnabled={lanEnabled}
        previewMode
      />

      <main className="min-h-0 flex-1 overflow-y-auto py-4 sm:py-6 lg:py-8 [&_a]:pointer-events-none">
        <LayoutWidthShell layout={layout}>
          <div className="mb-5 flex gap-2 sm:hidden">
            {lanEnabled && (
              <NetworkModeToggle
                mode={effectiveNetworkMode}
                onChange={setNetworkMode}
                className="shrink-0"
              />
            )}
            <input
              type="search"
              placeholder={t("search")}
              value={searchQuery}
              readOnly
              className="w-full rounded-xl border border-border/60 bg-background/50 px-4 py-2.5 text-sm shadow-inner ring-1 ring-foreground/5 placeholder:text-muted-foreground backdrop-blur-sm"
            />
          </div>

          <ServiceGrid
            columns={activeColumns}
            searchQuery={searchQuery}
            healthMap={data.healthMap}
            baseCardColor={theme.cardBaseColor}
            networkMode={effectiveNetworkMode}
            layout={layout}
            layoutEditable={false}
          />
        </LayoutWidthShell>
      </main>

      <div className="[&_a]:pointer-events-none">
        <DashboardFooter
          footerBars={data.footerBars}
          accentColor={theme.accentColor}
          layout={layout}
          layoutEditable={false}
        />
      </div>
    </div>
  );
}
