export type ThemePresetId = "stealth" | "ember" | "neon" | "cobalt" | "custom";

export type ColorMode = "dark" | "light";

export interface ThemePreset {
  id: ThemePresetId;
  name: string;
  description: string;
  accent: string;
  cardBase: string;
  glow: string;
}

export const DEFAULT_THEME_PRESET: ThemePresetId = "stealth";
export const DEFAULT_COLOR_MODE: ColorMode = "dark";

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "stealth",
    name: "Stealth",
    description: "Grays, subtle & clean — default theme",
    accent: "#94a3b8",
    cardBase: "#64748b",
    glow: "#cbd5e1",
  },
  {
    id: "ember",
    name: "Ember",
    description: "Orange & black",
    accent: "#f97316",
    cardBase: "#ea580c",
    glow: "#fbbf24",
  },
  {
    id: "neon",
    name: "Neon",
    description: "Cyan & violet, futuristic",
    accent: "#22d3ee",
    cardBase: "#06b6d4",
    glow: "#a78bfa",
  },
  {
    id: "cobalt",
    name: "Cobalt",
    description: "Classic blue, calm & clear",
    accent: "#3b82f6",
    cardBase: "#2563eb",
    glow: "#6366f1",
  },
  {
    id: "custom",
    name: "Custom",
    description: "Your own accent, tile and glow colors",
    accent: "#f97316",
    cardBase: "#ea580c",
    glow: "#fbbf24",
  },
];

/** Fallback wenn kein Theme aus Einstellungen aufgelöst werden kann */
export const FALLBACK_ACCENT_COLOR = THEME_PRESETS[0].accent;
export const FALLBACK_CARD_BASE_COLOR = THEME_PRESETS[0].cardBase;
export const FALLBACK_GLOW_COLOR = THEME_PRESETS[0].glow;

export function parseThemePreset(value: string | undefined | null): ThemePresetId {
  if (value && THEME_PRESETS.some((p) => p.id === value)) {
    return value as ThemePresetId;
  }
  return DEFAULT_THEME_PRESET;
}

export function parseColorMode(value: string | undefined | null): ColorMode {
  return value === "light" ? "light" : DEFAULT_COLOR_MODE;
}

export function getThemePreset(id: ThemePresetId): ThemePreset {
  return THEME_PRESETS.find((p) => p.id === id) ?? THEME_PRESETS[0];
}

export interface ResolvedTheme {
  presetId: ThemePresetId;
  accentColor: string;
  cardBaseColor: string;
  glowColor: string;
  colorMode: ColorMode;
}

export function resolveTheme(settings: Record<string, string>): ResolvedTheme {
  const presetId = parseThemePreset(settings.theme_preset);
  const colorMode = parseColorMode(settings.color_mode);

  if (presetId === "custom") {
    const accent = settings.accent_color?.trim() || FALLBACK_ACCENT_COLOR;
    const cardBase =
      settings.service_card_base_color?.trim() || accent;
    const glow = settings.glow_color?.trim() || accent;
    return {
      presetId,
      accentColor: accent,
      cardBaseColor: cardBase,
      glowColor: glow,
      colorMode,
    };
  }

  const preset = getThemePreset(presetId);
  return {
    presetId,
    accentColor: preset.accent,
    cardBaseColor: preset.cardBase,
    glowColor: preset.glow,
    colorMode,
  };
}

export function applyColorMode(mode: ColorMode) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", mode === "dark");
}
