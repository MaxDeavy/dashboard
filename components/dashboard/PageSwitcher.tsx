"use client";

import { useTranslations } from "next-intl";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import type { Page } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

interface PageSwitcherProps {
  pages: Page[];
  activePageId: number;
  onPageChange: (pageId: number) => void;
  accentColor?: string;
  keyboardShortcutsEnabled?: boolean;
  className?: string;
}

export function PageSwitcher({
  pages,
  activePageId,
  onPageChange,
  accentColor = "#f97316",
  keyboardShortcutsEnabled = true,
  className,
}: PageSwitcherProps) {
  const t = useTranslations("dashboard");

  if (pages.length < 2) return null;

  const shortcutPages = pages.slice(0, 9);

  return (
    <div
      className={cn(
        "inline-flex w-fit max-w-full shrink-0 flex-wrap items-center gap-0.5 rounded-xl border border-foreground/[0.06] bg-foreground/[0.03] p-0.5",
        className,
      )}
      role="tablist"
      aria-label={t("pageSwitcherLabel")}
    >
      {shortcutPages.map((page, index) => {
        const isActive = page.id === activePageId;
        const hotkey = index + 1;

        return (
          <HoverCard key={page.id}>
            <HoverCardTrigger
              render={
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onPageChange(page.id)}
                  className={cn(
                    "flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium transition-colors",
                    isActive
                      ? "bg-background/80 text-foreground shadow-sm ring-1 ring-foreground/10"
                      : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
                  )}
                />
              }
            >
              <span
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded text-[10px] font-semibold tabular-nums",
                  isActive
                    ? "text-white"
                    : "bg-foreground/8 text-muted-foreground",
                )}
                style={
                  isActive
                    ? {
                        background: `color-mix(in srgb, ${accentColor} 75%, transparent)`,
                      }
                    : undefined
                }
              >
                {hotkey}
              </span>
              <span className="max-w-[6rem] truncate sm:max-w-[7rem]">
                {page.name}
              </span>
            </HoverCardTrigger>
            <HoverCardContent
              className="w-auto min-w-[8rem] border-white/10 bg-[#12121a]/95 px-3 py-2 shadow-xl backdrop-blur-xl"
              side="bottom"
              align="center"
              sideOffset={6}
            >
              <p className="text-sm font-medium text-foreground">{page.name}</p>
              {keyboardShortcutsEnabled ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("pageHotkey", { key: hotkey })}
                </p>
              ) : (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("clickToSwitch")}
                </p>
              )}
            </HoverCardContent>
          </HoverCard>
        );
      })}
    </div>
  );
}
