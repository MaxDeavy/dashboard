export const ICON_FRAME_STYLES = [
  "rounded",
  "squircle",
  "circle",
  "square",
  "none",
] as const;

export type IconFrameStyle = (typeof ICON_FRAME_STYLES)[number];

export const ICON_FRAME_LABELS: Record<IconFrameStyle, string> = {
  rounded: "Rounded",
  squircle: "Squircle",
  circle: "Circle",
  square: "Square",
  none: "No frame",
};

export const DEFAULT_ICON_SIZE = 44;
export const MIN_ICON_SIZE = 24;
export const MAX_ICON_SIZE = 80;

export const DEFAULT_LAYOUT_MAX_WIDTH = 0;
export const MIN_LAYOUT_MAX_WIDTH = 800;
export const MAX_LAYOUT_MAX_WIDTH = 2400;

export const DEFAULT_LAYOUT_SIDE_INSET = 20;
export const MIN_LAYOUT_SIDE_INSET = 0;
export const MAX_LAYOUT_SIDE_INSET = 400;

export const DEFAULT_TILE_BORDER_RADIUS = 12;
export const MIN_TILE_BORDER_RADIUS = 0;
export const MAX_TILE_BORDER_RADIUS = 24;

export const DEFAULT_TILE_SCALE = 100;
export const MIN_TILE_SCALE = 70;
export const MAX_TILE_SCALE = 150;

export const DEFAULT_FONT_SCALE = 100;
export const MIN_FONT_SCALE = 70;
export const MAX_FONT_SCALE = 150;

export const DEFAULT_TILE_SPACING = 8;
export const MIN_TILE_SPACING = 2;
export const MAX_TILE_SPACING = 24;

export const DEFAULT_COLUMN_GAP = 20;
export const MIN_COLUMN_GAP = 8;
export const MAX_COLUMN_GAP = 64;

export const DEFAULT_COLUMN_PADDING = 14;
export const MIN_COLUMN_PADDING = 8;
export const MAX_COLUMN_PADDING = 40;

export const MIN_COLUMN_MIN_WIDTH = 200;
export const MAX_COLUMN_MIN_WIDTH = 800;

export const MIN_COLUMN_MAX_WIDTH = 240;
export const MAX_COLUMN_MAX_WIDTH = 1200;

export interface DashboardLayoutSettings {
  iconSize: number;
  iconFrameStyle: IconFrameStyle;
  contentMaxWidth: number;
  contentSideInset: number;
  headerFollowsLayout: boolean;
  footerFollowsLayout: boolean;
  tileBorderRadius: number;
  tileScale: number;
  fontScale: number;
  tileSpacing: number;
  columnGap: number;
  columnPadding: number;
  columnMinWidth: number;
  columnMaxWidth: number;
}

export const DEFAULT_LAYOUT_SETTINGS: DashboardLayoutSettings = {
  iconSize: DEFAULT_ICON_SIZE,
  iconFrameStyle: "rounded",
  contentMaxWidth: DEFAULT_LAYOUT_MAX_WIDTH,
  contentSideInset: DEFAULT_LAYOUT_SIDE_INSET,
  headerFollowsLayout: true,
  footerFollowsLayout: true,
  tileBorderRadius: DEFAULT_TILE_BORDER_RADIUS,
  tileScale: DEFAULT_TILE_SCALE,
  fontScale: DEFAULT_FONT_SCALE,
  tileSpacing: DEFAULT_TILE_SPACING,
  columnGap: DEFAULT_COLUMN_GAP,
  columnPadding: DEFAULT_COLUMN_PADDING,
  columnMinWidth: 0,
  columnMaxWidth: 0,
};

export interface TileMetrics {
  paddingX: number;
  paddingY: number;
  gap: number;
  titleSize: number;
  subtitleSize: number;
  arrowSize: number;
  iconSize: number;
  iconImageSize: number;
  columnTitleSize: number;
  columnCountSize: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function parseNumber(
  value: string | undefined | null,
  fallback: number,
  min: number,
  max: number,
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return clamp(Math.round(parsed), min, max);
}

export function parseIconFrameStyle(
  value: string | undefined | null,
): IconFrameStyle {
  if (value && ICON_FRAME_STYLES.includes(value as IconFrameStyle)) {
    return value as IconFrameStyle;
  }
  return DEFAULT_LAYOUT_SETTINGS.iconFrameStyle;
}

function parseBooleanSetting(
  value: string | undefined | null,
  fallback: boolean,
): boolean {
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

export function resolveLayoutSettings(
  settings: Record<string, string>,
): DashboardLayoutSettings {
  return {
    iconSize: parseNumber(
      settings.icon_size,
      DEFAULT_ICON_SIZE,
      MIN_ICON_SIZE,
      MAX_ICON_SIZE,
    ),
    iconFrameStyle: parseIconFrameStyle(settings.icon_frame_style),
    contentMaxWidth: (() => {
      const width = parseNumber(
        settings.layout_max_width,
        DEFAULT_LAYOUT_MAX_WIDTH,
        0,
        MAX_LAYOUT_MAX_WIDTH,
      );
      if (width > 0 && width < MIN_LAYOUT_MAX_WIDTH) return 0;
      return width;
    })(),
    contentSideInset: parseNumber(
      settings.layout_side_inset,
      DEFAULT_LAYOUT_SIDE_INSET,
      MIN_LAYOUT_SIDE_INSET,
      MAX_LAYOUT_SIDE_INSET,
    ),
    headerFollowsLayout: parseBooleanSetting(
      settings.layout_header_follows_width,
      DEFAULT_LAYOUT_SETTINGS.headerFollowsLayout,
    ),
    footerFollowsLayout: parseBooleanSetting(
      settings.layout_footer_follows_width,
      DEFAULT_LAYOUT_SETTINGS.footerFollowsLayout,
    ),
    tileBorderRadius: parseNumber(
      settings.tile_border_radius,
      DEFAULT_TILE_BORDER_RADIUS,
      MIN_TILE_BORDER_RADIUS,
      MAX_TILE_BORDER_RADIUS,
    ),
    tileScale: parseNumber(
      settings.tile_scale,
      DEFAULT_TILE_SCALE,
      MIN_TILE_SCALE,
      MAX_TILE_SCALE,
    ),
    fontScale: parseNumber(
      settings.font_scale,
      DEFAULT_FONT_SCALE,
      MIN_FONT_SCALE,
      MAX_FONT_SCALE,
    ),
    tileSpacing: parseNumber(
      settings.tile_spacing,
      DEFAULT_TILE_SPACING,
      MIN_TILE_SPACING,
      MAX_TILE_SPACING,
    ),
    columnGap: parseNumber(
      settings.column_gap,
      DEFAULT_COLUMN_GAP,
      MIN_COLUMN_GAP,
      MAX_COLUMN_GAP,
    ),
    columnPadding: parseNumber(
      settings.column_padding,
      DEFAULT_COLUMN_PADDING,
      MIN_COLUMN_PADDING,
      MAX_COLUMN_PADDING,
    ),
    columnMinWidth: (() => {
      const width = parseNumber(
        settings.column_min_width,
        0,
        0,
        MAX_COLUMN_MIN_WIDTH,
      );
      if (width > 0 && width < MIN_COLUMN_MIN_WIDTH) {
        return MIN_COLUMN_MIN_WIDTH;
      }
      return width;
    })(),
    columnMaxWidth: (() => {
      const width = parseNumber(
        settings.column_max_width,
        0,
        0,
        MAX_COLUMN_MAX_WIDTH,
      );
      if (width > 0 && width < MIN_COLUMN_MAX_WIDTH) {
        return MIN_COLUMN_MAX_WIDTH;
      }
      return width;
    })(),
  };
}

export function getLayoutMaxWidthPx(layout: DashboardLayoutSettings): number {
  if (layout.contentMaxWidth >= MIN_LAYOUT_MAX_WIDTH) {
    return layout.contentMaxWidth;
  }
  return MAX_LAYOUT_MAX_WIDTH;
}

export function getIconImageSize(iconSize: number): number {
  return Math.round(iconSize * 0.58);
}

export function getTileMetrics(layout: DashboardLayoutSettings): TileMetrics {
  const tileScale = layout.tileScale / 100;
  const fontScale = layout.fontScale / 100;
  const iconSize = Math.round(layout.iconSize * tileScale);

  return {
    paddingX: Math.round(14 * tileScale),
    paddingY: Math.round(10 * tileScale),
    gap: Math.round(12 * tileScale),
    titleSize: Math.round(13 * fontScale),
    subtitleSize: Math.round(11 * fontScale),
    arrowSize: Math.round(14 * tileScale),
    iconSize,
    iconImageSize: getIconImageSize(iconSize),
    columnTitleSize: Math.round(11 * fontScale),
    columnCountSize: Math.round(10 * fontScale),
  };
}

export function getStandardTileHeight(layout: DashboardLayoutSettings): number {
  const base = getTileMetrics(layout);
  const textBlockHeight =
    Math.ceil(base.titleSize * 1.2) + Math.ceil(base.subtitleSize * 1.2);
  const contentHeight = Math.max(base.iconSize, textBlockHeight);

  return base.paddingY * 2 + contentHeight;
}

export type ServiceRowDensity = 1 | 2 | 3;

export function getDensityTileMetrics(
  layout: DashboardLayoutSettings,
  density: ServiceRowDensity,
): TileMetrics {
  const base = getTileMetrics(layout);
  if (density === 1) return base;

  if (density === 2) {
    const iconSize = Math.round(base.iconSize * 0.82);
    return {
      ...base,
      paddingX: Math.max(6, Math.round(base.paddingX * 0.65)),
      paddingY: Math.max(5, Math.round(base.paddingY * 0.7)),
      gap: Math.max(4, Math.round(base.gap * 0.5)),
      titleSize: Math.max(10, Math.round(base.titleSize * 0.9)),
      subtitleSize: Math.max(9, Math.round(base.subtitleSize * 0.88)),
      iconSize,
      iconImageSize: getIconImageSize(iconSize),
    };
  }

  const paddingY = Math.max(4, Math.round(base.paddingY * 0.5));
  const paddingX = Math.max(4, Math.round(base.paddingX * 0.45));
  const subtitleSize = Math.max(9, Math.round(base.subtitleSize * 0.82));
  const gap = 2;
  const tileHeight = getStandardTileHeight(layout);
  const maxIconSize =
    tileHeight -
    paddingY * 2 -
    Math.ceil(subtitleSize * 1.1) -
    gap;
  const iconSize = Math.min(base.iconSize, Math.max(20, maxIconSize));

  return {
    ...base,
    paddingX,
    paddingY,
    gap,
    titleSize: Math.max(8, Math.round(base.titleSize * 0.72)),
    subtitleSize,
    iconSize,
    iconImageSize: getIconImageSize(iconSize),
  };
}

export function getRowTileGap(
  layout: DashboardLayoutSettings,
  density: ServiceRowDensity,
): number {
  if (density === 1) return layout.tileSpacing;
  if (density === 2) return Math.max(6, Math.round(layout.tileSpacing * 0.7));
  return Math.max(5, Math.round(layout.tileSpacing * 0.6));
}

export const ADMIN_MULTI_ROW_GAP_PX = 6;

export function getColumnGridStyle(
  layout: DashboardLayoutSettings,
  columnCount: number,
): { gridTemplateColumns: string } | undefined {
  const hasMin = layout.columnMinWidth >= MIN_COLUMN_MIN_WIDTH;
  const hasMax = layout.columnMaxWidth >= MIN_COLUMN_MAX_WIDTH;

  if (!hasMin && !hasMax) return undefined;

  const min = hasMin ? layout.columnMinWidth : MIN_COLUMN_MIN_WIDTH;
  let maxPx = hasMax ? layout.columnMaxWidth : 0;
  if (hasMax && hasMin && maxPx < min) {
    maxPx = min;
  }
  const max = hasMax ? `${maxPx}px` : "1fr";

  return {
    gridTemplateColumns: `repeat(${columnCount}, minmax(${min}px, ${max}))`,
  };
}

export function usesCustomColumnWidth(layout: DashboardLayoutSettings): boolean {
  return (
    layout.columnMinWidth >= MIN_COLUMN_MIN_WIDTH ||
    layout.columnMaxWidth >= MIN_COLUMN_MAX_WIDTH
  );
}

export function getIconFrameClasses(style: IconFrameStyle): string {
  switch (style) {
    case "squircle":
      return "rounded-[22%] bg-gradient-to-br from-foreground/[0.12] to-foreground/[0.04] ring-1 ring-foreground/12";
    case "circle":
      return "rounded-full bg-gradient-to-br from-foreground/[0.12] to-foreground/[0.04] ring-1 ring-foreground/12";
    case "square":
      return "rounded-sm bg-gradient-to-br from-foreground/[0.1] to-foreground/[0.03] ring-1 ring-foreground/10";
    case "none":
      return "rounded-none bg-transparent ring-0";
    case "rounded":
    default:
      return "rounded-xl bg-gradient-to-br from-foreground/[0.1] to-foreground/[0.03] ring-1 ring-foreground/10";
  }
}
