"use client";

import type { LinkBarWithLinks } from "@/lib/db/schema";
import type { DashboardLayoutSettings } from "@/lib/layout-settings";
import { FALLBACK_ACCENT_COLOR } from "@/lib/theme-presets";
import { LayoutWidthShell } from "./LayoutWidthShell";
import { LinkBarRow } from "./LinkBarRow";
import { cn } from "@/lib/utils";

interface DashboardFooterProps {
  footerBars: LinkBarWithLinks[];
  accentColor?: string;
  layout: DashboardLayoutSettings;
  layoutEditable?: boolean;
  onLayoutSaved?: () => void;
}

export function DashboardFooter({
  footerBars,
  accentColor = FALLBACK_ACCENT_COLOR,
  layout,
  layoutEditable = false,
  onLayoutSaved,
}: DashboardFooterProps) {
  const visibleBars = footerBars.filter((bar) => bar.links.length > 0);
  if (visibleBars.length === 0) return null;

  return (
    <footer
      className={cn(
        "z-50 shrink-0 pb-3 pt-2 sm:pb-4",
        !layout.footerFollowsLayout && "px-3 sm:px-4",
      )}
    >
      <LayoutWidthShell layout={layout} constrained={layout.footerFollowsLayout}>
      <div className="glass-panel w-full rounded-2xl px-4 py-3 sm:px-5">
        {visibleBars.map((bar, index) => (
          <div
            key={bar.id}
            className={index > 0 ? "mt-3 border-t border-white/[0.06] pt-3" : ""}
          >
            {bar.title && (
              <p
                className="mb-2 text-[10px] font-semibold tracking-[0.14em] uppercase"
                style={{
                  color: `color-mix(in srgb, ${accentColor} 55%, rgba(255,255,255,0.45))`,
                }}
              >
                {bar.title}
              </p>
            )}
            <LinkBarRow
              links={bar.links}
              variant="footer"
              layoutEditable={layoutEditable}
              onLayoutSaved={onLayoutSaved}
            />
          </div>
        ))}
      </div>
      </LayoutWidthShell>
    </footer>
  );
}
