"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { LayoutGrid, Search, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { LinkBarWithLinks, Page } from "@/lib/db/schema";
import type { DashboardLayoutSettings } from "@/lib/layout-settings";
import type { NetworkMode } from "@/lib/network-mode";
import { isImageIcon } from "@/lib/service-icons";
import { cn } from "@/lib/utils";
import { LayoutWidthShell } from "./LayoutWidthShell";
import { LinkBarRow } from "./LinkBarRow";
import { NetworkModeToggle } from "./NetworkModeToggle";
import { PageSwitcher } from "./PageSwitcher";

interface DashboardHeaderProps {
  headerBars: LinkBarWithLinks[];
  pages?: Page[];
  activePageId?: number;
  onPageChange?: (pageId: number) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  accentColor?: string;
  dashboardTitle?: string;
  dashboardSubtitle?: string;
  dashboardLogo?: string | null;
  networkMode: NetworkMode;
  onNetworkModeChange: (mode: NetworkMode) => void;
  layout: DashboardLayoutSettings;
  layoutEditable?: boolean;
  onLayoutSaved?: () => void;
  showPageSwitcher?: boolean;
  pageKeyboardShortcutsEnabled?: boolean;
  lanEnabled?: boolean;
}

export function DashboardHeader({
  headerBars,
  pages = [],
  activePageId = 0,
  onPageChange,
  searchQuery,
  onSearchChange,
  accentColor = "#f97316",
  dashboardTitle,
  dashboardSubtitle,
  dashboardLogo = null,
  networkMode,
  onNetworkModeChange,
  layout,
  layoutEditable = false,
  onLayoutSaved,
  showPageSwitcher = true,
  pageKeyboardShortcutsEnabled = true,
  lanEnabled = true,
}: DashboardHeaderProps) {
  const t = useTranslations("dashboard");
  const resolvedTitle = dashboardTitle ?? t("defaultTitle");
  const resolvedSubtitle = dashboardSubtitle ?? t("defaultSubtitle");
  const visibleBars = headerBars.filter((bar) => bar.links.length > 0);
  const hasBars = visibleBars.length > 0;
  const logoValue = dashboardLogo?.trim() ?? "";
  const hasLogoImage = isImageIcon(logoValue);
  const hasLogoText = logoValue.length > 0 && !hasLogoImage;

  return (
    <header
      className={cn(
        "z-50 shrink-0 pt-3 sm:pt-4",
        !layout.headerFollowsLayout && "px-3 sm:px-4",
      )}
    >
      <LayoutWidthShell layout={layout} constrained={layout.headerFollowsLayout}>
      <div className="glass-panel-strong relative w-full rounded-2xl">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
          <div
            className="absolute -top-12 -left-8 size-40 rounded-full opacity-40 blur-3xl"
            style={{ background: accentColor }}
          />
          <div
            className="absolute -top-8 right-0 size-32 rounded-full opacity-25 blur-3xl"
            style={{ background: accentColor }}
          />
        </div>

        <div className="relative px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex min-w-0 shrink-0 items-center gap-3">
              <div
                className={cn(
                  "relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-lg ring-1 ring-foreground/15",
                  !hasLogoImage && !hasLogoText && "text-white",
                )}
                style={
                  !hasLogoImage && !hasLogoText
                    ? {
                        background: `linear-gradient(145deg, color-mix(in srgb, ${accentColor} 80%, white 10%), ${accentColor})`,
                      }
                    : {
                        background: "color-mix(in srgb, var(--foreground) 6%, transparent)",
                      }
                }
              >
                {hasLogoImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoValue}
                    alt=""
                    className="size-7 object-contain"
                  />
                ) : hasLogoText ? (
                  <span className="text-lg leading-none">{logoValue}</span>
                ) : (
                  <LayoutGrid className="size-[18px] drop-shadow-sm" />
                )}
              </div>
              <div className="hidden min-w-0 sm:block">
                <p className="truncate text-[15px] font-semibold tracking-tight text-foreground">
                  {resolvedTitle}
                </p>
                {resolvedSubtitle && (
                  <p className="truncate text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    {resolvedSubtitle}
                  </p>
                )}
              </div>
            </div>

            {showPageSwitcher && pages.length > 1 && onPageChange && (
              <>
                <div className="hidden h-8 w-px shrink-0 bg-foreground/10 md:block" />
                <PageSwitcher
                  pages={pages}
                  activePageId={activePageId}
                  onPageChange={onPageChange}
                  accentColor={accentColor}
                  keyboardShortcutsEnabled={pageKeyboardShortcutsEnabled}
                  className="hidden shrink-0 md:inline-flex"
                />
              </>
            )}

            {hasBars && (
              <>
                <div className="hidden h-8 w-px shrink-0 bg-foreground/10 lg:block" />
                <div className="flex min-w-0 flex-1 items-center">
                  <LinkBarRow
                    links={visibleBars[0]?.links ?? []}
                    layoutEditable={layoutEditable}
                    onLayoutSaved={onLayoutSaved}
                  />
                </div>
              </>
            )}

            <div className="ml-auto flex shrink-0 items-center gap-2">
              {lanEnabled && (
                <NetworkModeToggle
                  mode={networkMode}
                  onChange={onNetworkModeChange}
                />
              )}
              <div className="relative hidden sm:block">
                <Search className="absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={t("search")}
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="h-9 w-44 rounded-xl border-border/60 bg-background/50 pl-9 text-sm shadow-inner ring-1 ring-foreground/5 lg:w-56"
                />
              </div>
              <Link
                href="/admin"
                className={cn(
                  "flex size-9 items-center justify-center rounded-xl border border-foreground/10",
                  "bg-foreground/[0.04] text-foreground/75 transition-all",
                  "hover:border-foreground/20 hover:bg-foreground/[0.08] hover:text-foreground",
                )}
                title={t("administration")}
              >
                <Settings className="size-4" />
              </Link>
            </div>
          </div>

          {showPageSwitcher && pages.length > 1 && onPageChange && (
            <div className="mt-3 border-t border-foreground/[0.06] pt-3 md:hidden">
              <PageSwitcher
                pages={pages}
                activePageId={activePageId}
                onPageChange={onPageChange}
                accentColor={accentColor}
                keyboardShortcutsEnabled={pageKeyboardShortcutsEnabled}
              />
            </div>
          )}

          {visibleBars.slice(1).map((bar) => (
            <div
              key={bar.id}
              className="mt-3 border-t border-foreground/[0.06] pt-3"
            >
              {bar.title && (
                <p className="mb-2 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  {bar.title}
                </p>
              )}
              <LinkBarRow
                links={bar.links}
                layoutEditable={layoutEditable}
                onLayoutSaved={onLayoutSaved}
              />
            </div>
          ))}
        </div>
      </div>
      </LayoutWidthShell>
    </header>
  );
}
