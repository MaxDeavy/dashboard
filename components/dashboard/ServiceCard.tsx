"use client";

import { Activity, Wifi } from "lucide-react";
import { useTranslations } from "next-intl";
import type { HealthStatus } from "@/lib/health";
import { hasLanUrl, resolveServiceUrl, type NetworkMode } from "@/lib/network-mode";
import { parseLinkOpenMode } from "@/lib/link-open-mode";
import {
  DEFAULT_LAYOUT_SETTINGS,
  getDensityTileMetrics,
  getIconFrameClasses,
  getStandardTileHeight,
  type DashboardLayoutSettings,
  type ServiceRowDensity,
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
  rowOrder: number;
  slotIndex: number;
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
  rowDensity?: ServiceRowDensity;
}

function getCardShellClass(
  layoutEditMode: boolean,
  dragging: boolean,
  lanMissing: boolean,
) {
  return cn(
    "group relative overflow-hidden border",
    "transition-all duration-300 ease-out",
    !layoutEditMode && "hover:-translate-y-0.5 hover:border-foreground/20",
    !layoutEditMode &&
      "shadow-[0_16px_40px_color-mix(in_srgb,var(--tile-glow)_28%,transparent),inset_0_1px_0_0_rgba(255,255,255,0.1)]",
    !layoutEditMode &&
      "hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.28)]",
    layoutEditMode && "cursor-grab active:cursor-grabbing",
    layoutEditMode && "ring-1 ring-primary/25",
    dragging && "opacity-45",
    lanMissing && "opacity-55",
  );
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
  rowDensity = 1,
}: ServiceCardProps) {
  const t = useTranslations("dashboard");
  const href = resolveServiceUrl(service, networkMode);
  const lanMissing = networkMode === "lan" && !hasLanUrl(service);
  const tileColor = resolveTileColor(
    service.cardColor,
    categoryColor,
    baseCardColor,
  );
  const linkOpenMode = parseLinkOpenMode(service.linkOpenMode);
  const metrics = getDensityTileMetrics(layout, rowDensity);
  const frameless = layout.iconFrameStyle === "none";
  const compactAccent = rowDensity > 1;
  const tileHeight = getStandardTileHeight(layout);

  const surfaceStyle = {
    borderRadius: `${layout.tileBorderRadius}px`,
    height: `${tileHeight}px`,
    minHeight: `${tileHeight}px`,
    maxHeight: `${tileHeight}px`,
    ...getServiceTileSurfaceStyle(tileColor),
  };

  const badges = (
    <>
      {service.hasWidget && (
        <span
          className={cn(
            "absolute flex items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] p-0.5 transition-opacity duration-300 group-hover:opacity-35",
            rowDensity === 3 ? "right-1 bottom-1" : "right-2 bottom-2",
          )}
          title={t("liveDataAvailable")}
        >
          <Activity
            className="size-2 text-emerald-400/50"
            strokeWidth={2.25}
            aria-hidden
          />
        </span>
      )}

      {networkMode === "lan" && hasLanUrl(service) && (
        <span
          title={t("lanUrlActive")}
          className={cn(
            "absolute",
            rowDensity === 3 ? "top-1 right-1" : "top-2 right-2",
          )}
        >
          <Wifi className="size-2.5 text-emerald-400/80" />
        </span>
      )}
    </>
  );

  const tileBackground = (
    <>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 0% 50%, color-mix(in srgb, var(--tile-tint) 12%, transparent), transparent 58%),
            radial-gradient(ellipse at 100% 0%, color-mix(in srgb, var(--tile-tint) 7%, transparent), transparent 42%)`,
        }}
      />

      <div
        className={cn(
          "pointer-events-none absolute inset-y-3 left-0 w-[2px] rounded-r-full",
          compactAccent && "inset-y-2",
        )}
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
    </>
  );

  const iconBlock = (
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
          background: frameless ? undefined : "rgba(255, 255, 255, 0.05)",
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
  );

  if (rowDensity === 3) {
    const bottomLabel = service.subtitle ?? service.name;

    return (
      <ServiceHoverCard
        serviceId={service.id}
        hasWidget={service.hasWidget}
        url={href}
        linkOpenMode={linkOpenMode}
        layoutEditMode={layoutEditMode}
        className={cn(
          getCardShellClass(layoutEditMode, dragging, lanMissing),
          "flex h-full w-full flex-col items-center justify-center",
        )}
        style={{
          ...surfaceStyle,
          padding: `${metrics.paddingY}px ${metrics.paddingX}px`,
          gap: `${metrics.gap}px`,
        }}
      >
        {tileBackground}

        <div className="relative z-[1] flex shrink-0 items-center justify-center">
          {iconBlock}
        </div>

        <p
          className="relative z-[1] w-full shrink-0 truncate text-center leading-none text-foreground/55"
          style={{ fontSize: `${metrics.subtitleSize}px` }}
          title={bottomLabel}
        >
          {bottomLabel}
        </p>

        {badges}
      </ServiceHoverCard>
    );
  }

  return (
    <ServiceHoverCard
      serviceId={service.id}
      hasWidget={service.hasWidget}
      url={href}
      linkOpenMode={linkOpenMode}
      layoutEditMode={layoutEditMode}
        className={cn(
          getCardShellClass(layoutEditMode, dragging, lanMissing),
          "flex h-full w-full items-center",
        )}
      style={{
        ...surfaceStyle,
        gap: `${metrics.gap}px`,
        padding: `${metrics.paddingY}px ${metrics.paddingX}px`,
      }}
    >
      {tileBackground}

      {iconBlock}

      <div className="relative min-w-0 flex-1">
        <p
          className="truncate font-medium tracking-tight text-foreground/95 transition-colors group-hover:text-foreground"
          style={{ fontSize: `${metrics.titleSize}px`, lineHeight: 1.2 }}
          title={service.name}
        >
          {service.name}
        </p>
        {service.subtitle && (
          <p
            className="truncate text-foreground/55"
            style={{ fontSize: `${metrics.subtitleSize}px`, lineHeight: 1.2 }}
            title={service.subtitle}
          >
            {service.subtitle}
          </p>
        )}
      </div>

      {badges}
    </ServiceHoverCard>
  );
}
