import type { CSSProperties } from "react";
import { FALLBACK_CARD_BASE_COLOR } from "@/lib/theme-presets";

export function resolveTileColor(
  serviceColor?: string | null,
  categoryColor?: string | null,
  fallback = FALLBACK_CARD_BASE_COLOR,
): string {
  const pick = (value?: string | null) => {
    const trimmed = value?.trim();
    return trimmed && trimmed.length > 0 ? trimmed : null;
  };

  return pick(serviceColor) ?? pick(categoryColor) ?? fallback;
}

export function getServiceTileSurfaceStyle(tileColor: string): CSSProperties {
  return {
    ["--tile-tint" as string]: tileColor,
    ["--tile-glow" as string]: tileColor,
  };
}

export function getCategoryAccentColor(
  categoryColor: string | null | undefined,
  fallback: string,
): string {
  const trimmed = categoryColor?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

export function hasCustomCategoryColor(
  categoryColor: string | null | undefined,
): boolean {
  return Boolean(categoryColor?.trim());
}
