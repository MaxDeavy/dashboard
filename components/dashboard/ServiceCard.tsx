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
  FALLBACK_CARD_BASE_COLOR,
} from "@/lib/theme-presets";
import {
  getServiceTileSurfaceStyle,
  resolveTileColor,
} from "@/lib/tile-colors";
import { ServiceHoverCard, type LayoutDragHandlers } from "./ServiceHoverCard";
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
  baseCardColor?: string;
  categoryColor?: string | null;
  networkMode?: NetworkMode;
  layout?: DashboardLayoutSettings;
  layoutEditMode?: boolean;
  layoutDrag?: LayoutDragHandlers;
  dragging?: boolean;
  rowDensity?: ServiceRowDensity;
}

function getCardShellClass(
  layoutEditMode: boolean,
  dragging: boolean,
  lanMissing: boolean,
) {
  return cn(
    "service-tile-surface group relative overflow-hidden border",
    "transition-all duration-300 ease-out",
    !layoutEditMode && "hover:-translate-y-0.5 hover:border-foreground/15",
    !layoutEditMode &&
      "hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.95),0_6px_18px_rgba(0,0,0,0.08)]",
    !layoutEditMode &&
      "dark:hover:border-foreground/20 dark:hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.28)]",
    layoutEditMode && "cursor-grab select-none active:cursor-grabbing",
    layoutEditMode && "ring-1 ring-primary/25",
    dragging && "opacity-45",
    lanMissing && "opacity-55",
  );
}

export function ServiceCard({
  service,
  healthStatus = "unknown",
  baseCardColor = FALLBACK_CARD_BASE_COLOR,
  categoryColor = null,
  networkMode = "web",
  layout = DEFAULT_LAYOUT_SETTINGS,
  layoutEditMode = false,
  layoutDrag,
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

  const showLanBadge = networkMode === "lan" && hasLanUrl(service);
  const lanStatusDotBesideBadge = showLanBadge && rowDensity === 3;

  const badges = (
    <>
      {service.hasWidget && (
        <span
          className={cn(
            "absolute flex items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] p-0.5 transition-opacity duration-300 group-hover:opacity-35",
            rowDensity === 3 ? "right-1 bottom-1" : "right-2 bottom-2",
          )}
          title={t("widgetTouchHoldHint")}
        >
          <Activity
            className="size-2 text-emerald-400/50"
            strokeWidth={2.25}
            aria-hidden
          />
        </span>
      )}

      {showLanBadge && (
        <span
          title={t("lanUrlActive")}
          className={cn(
            "absolute flex items-center gap-1",
            rowDensity === 3 ? "top-1 right-1" : "top-2 right-2",
          )}
        >
          {lanStatusDotBesideBadge && (
            <StatusDot status={healthStatus} className="!static shrink-0" />
          )}
          <Wifi className="size-2.5 shrink-0 text-emerald-400/80" />
        </span>
      )}
    </>
  );

  const tileBackground = (
    <>
      <div className="service-tile-tint-bg pointer-events-none absolute inset-0" />

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

      <div className="service-tile-tint-hover pointer-events-none absolute inset-0 opacity-100 transition-opacity duration-300 group-hover:opacity-0" />
    </>
  );

  const iconBlock = (
    <div className="relative shrink-0">
      <div
        className={cn(
          "relative flex items-center justify-center transition-all duration-300",
          !frameless && "service-tile-icon-frame ring-1 ring-black/[0.07] group-hover:ring-black/[0.12] dark:ring-white/10 dark:group-hover:ring-white/20",
          getIconFrameClasses(layout.iconFrameStyle),
        )}
        style={{
          width: metrics.iconSize,
          height: metrics.iconSize,
          fontSize: frameless ? metrics.iconImageSize : undefined,
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
      {!lanStatusDotBesideBadge && (
        <StatusDot
          status={healthStatus}
          className={
            rowDensity === 3
              ? "top-0.5 -right-4"
              : rowDensity === 2
                ? "top-0 -right-0.5"
                : undefined
          }
        />
      )}
    </div>
  );

  if (rowDensity === 3) {
    const bottomLabel = service.subtitle ?? service.name;

    return (
      <ServiceHoverCard
        serviceId={service.id}
        hasWidget={service.hasWidget}
        widgetType={service.widgetType}
        url={href}
        linkOpenMode={linkOpenMode}
        layoutEditMode={layoutEditMode}
        layoutDrag={layoutDrag}
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
      widgetType={service.widgetType}
      url={href}
      linkOpenMode={linkOpenMode}
      layoutEditMode={layoutEditMode}
      layoutDrag={layoutDrag}
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
