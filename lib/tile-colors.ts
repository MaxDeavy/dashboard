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
    background: `linear-gradient(
      155deg,
      rgba(22, 22, 30, 0.9) 0%,
      rgba(10, 10, 14, 0.96) 100%
    )`,
    borderColor: `color-mix(in srgb, ${tileColor} 12%, rgba(255, 255, 255, 0.08))`,
    boxShadow: `inset 0 1px 0 0 rgba(255, 255, 255, 0.06), 0 8px 24px rgba(0, 0, 0, 0.28)`,
  };
}

export function getCategoryAccentColor(
  categoryColor: string | null | undefined,
  fallback: string,
): string {
  const trimmed = categoryColor?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}
