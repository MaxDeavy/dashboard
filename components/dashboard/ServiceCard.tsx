"use client";

import { Activity, Wifi } from "lucide-react";
import type { HealthStatus } from "@/lib/health";
import { hasLanUrl, resolveServiceUrl, type NetworkMode } from "@/lib/network-mode";
import { parseLinkOpenMode } from "@/lib/link-open-mode";
import {
  DEFAULT_LAYOUT_SETTINGS,
  getIconFrameClasses,
  getTileMetrics,
  type DashboardLayoutSettings,
} from "@/lib/layout-settings";
import {
  FALLBACK_ACCENT_COLOR,
  FALLBACK_CARD_BASE_COLOR,
} from "@/lib/theme-presets";
import {
  getServiceTileSurfaceStyle,
  resolveTileColor,
} from "@/lib/tile-colors";
import { ServiceHoverCard } from "./ServiceHoverCard";
import { StatusDot } from "./StatusDot";
import { ServiceIconDisplay } from "@/components/ServiceIconDisplay";
import { cn } from "@/lib/utils";

export interface ServiceWithWidget {
  id: number;
  categoryId: number;
  sortOrder: number;
  name: string;
  subtitle: string | null;
  url: string;
  lanUrl: string | null;
  cardColor: string | null;
  linkOpenMode: string | null;
  icon: string | null;
  hasWidget: boolean;
  widgetType: string | null;
}

interface ServiceCardProps {
  service: ServiceWithWidget;
  healthStatus?: HealthStatus;
  accentColor?: string;
  baseCardColor?: string;
  categoryColor?: string | null;
  networkMode?: NetworkMode;
  layout?: DashboardLayoutSettings;
  layoutEditMode?: boolean;
  dragging?: boolean;
}

export function ServiceCard({
  service,
  healthStatus = "unknown",
  accentColor = FALLBACK_ACCENT_COLOR,
  baseCardColor = FALLBACK_CARD_BASE_COLOR,
  categoryColor = null,
  networkMode = "web",
  layout = DEFAULT_LAYOUT_SETTINGS,
  layoutEditMode = false,
  dragging = false,
}: ServiceCardProps) {
  const href = resolveServiceUrl(service, networkMode);
  const lanMissing = networkMode === "lan" && !hasLanUrl(service);
  const tileColor = resolveTileColor(
    service.cardColor,
    categoryColor,
    baseCardColor,
  );
  const linkOpenMode = parseLinkOpenMode(service.linkOpenMode);
  const metrics = getTileMetrics(layout);
  const frameless = layout.iconFrameStyle === "none";

  return (
    <ServiceHoverCard
      serviceId={service.id}
      hasWidget={service.hasWidget}
      url={href}
      linkOpenMode={linkOpenMode}
      layoutEditMode={layoutEditMode}
      className={cn(
        "group relative flex items-center overflow-hidden border",
        "transition-all duration-300 ease-out",
        !layoutEditMode &&
          "hover:-translate-y-0.5 hover:border-foreground/20",
        !layoutEditMode &&
          "shadow-[0_16px_40px_color-mix(in_srgb,var(--tile-glow)_28%,transparent),inset_0_1px_0_0_rgba(255,255,255,0.1)]",
        !layoutEditMode &&
          "hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.28)]",
        layoutEditMode && "cursor-grab active:cursor-grabbing",
        layoutEditMode && "ring-1 ring-primary/25",
        dragging && "opacity-45",
        lanMissing && "opacity-55",
      )}
      style={{
        borderRadius: `${layout.tileBorderRadius}px`,
        gap: `${metrics.gap}px`,
        padding: `${metrics.paddingY}px ${metrics.paddingX}px`,
        ...getServiceTileSurfaceStyle(tileColor),
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 0% 50%, color-mix(in srgb, var(--tile-tint) 12%, transparent), transparent 58%),
            radial-gradient(ellipse at 100% 0%, color-mix(in srgb, var(--tile-tint) 7%, transparent), transparent 42%)`,
        }}
      />

      <div
        className="pointer-events-none absolute inset-y-3 left-0 w-[2px] rounded-r-full"
        style={{
          background: tileColor,
          boxShadow: `0 0 14px color-mix(in srgb, ${tileColor} 55%, transparent)`,
          opacity: 0.75,
        }}
      />

      <div
        className="pointer-events-none absolute inset-0 opacity-100 transition-opacity duration-300 group-hover:opacity-0"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--tile-tint) 16%, transparent), transparent 72%)`,
        }}
      />

      <div className="relative shrink-0">
        <div
          className={cn(
            "relative flex items-center justify-center transition-all duration-300",
            !frameless && "ring-1 ring-white/10 group-hover:ring-white/20",
            getIconFrameClasses(layout.iconFrameStyle),
          )}
          style={{
            width: metrics.iconSize,
            height: metrics.iconSize,
            fontSize: frameless ? metrics.iconImageSize : undefined,
            background: frameless
              ? undefined
              : "rgba(255, 255, 255, 0.05)",
          }}
        >
          <ServiceIconDisplay
            icon={service.icon}
            name={service.name}
            imageClassName="rounded-md object-contain"
            fallbackClassName="font-semibold"
            imageSize={metrics.iconImageSize}
          />
        </div>
        <StatusDot status={healthStatus} />
      </div>

      <div className="relative min-w-0 flex-1">
        <p
          className="truncate font-medium tracking-tight text-foreground/95 transition-colors group-hover:text-foreground"
          style={{ fontSize: `${metrics.titleSize}px`, lineHeight: 1.25 }}
        >
          {service.name}
        </p>
        {service.subtitle && (
          <p
            className="truncate text-foreground/55"
            style={{ fontSize: `${metrics.subtitleSize}px`, lineHeight: 1.25 }}
          >
            {service.subtitle}
          </p>
        )}
      </div>

      {service.hasWidget && (
        <span
          className="absolute right-2 bottom-2 flex items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] p-0.5 transition-opacity duration-300 group-hover:opacity-35"
          title="Live-Daten verfügbar"
        >
          <Activity
            className="size-2 text-emerald-400/50"
            strokeWidth={2.25}
            aria-hidden
          />
        </span>
      )}

      {networkMode === "lan" && hasLanUrl(service) && (
        <span title="LAN-URL aktiv" className="absolute top-2 right-2">
          <Wifi className="size-2.5 text-emerald-400/80" />
        </span>
      )}
    </ServiceHoverCard>
  );
}
