"use client";

import { cn } from "@/lib/utils";
import {
  THEME_PRESETS,
  type ThemePresetId,
} from "@/lib/theme-presets";

interface ThemePresetPickerProps {
  value: ThemePresetId;
  onChange: (preset: ThemePresetId) => void;
  customColors?: {
    accent: string;
    cardBase: string;
    glow: string;
  };
}

function ColorSwatches({
  accent,
  cardBase,
  glow,
}: {
  accent: string;
  cardBase: string;
  glow: string;
}) {
  return (
    <>
      <span
        className="size-4 rounded-full ring-1 ring-black/10"
        style={{ backgroundColor: accent }}
      />
      <span
        className="size-4 rounded-full ring-1 ring-black/10"
        style={{ backgroundColor: cardBase }}
      />
      <span
        className="size-4 rounded-full ring-1 ring-black/10"
        style={{ backgroundColor: glow }}
      />
    </>
  );
}

export function ThemePresetPicker({
  value,
  onChange,
  customColors,
}: ThemePresetPickerProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {THEME_PRESETS.map((preset) => (
        <button
          key={preset.id}
          type="button"
          onClick={() => onChange(preset.id)}
          className={cn(
            "rounded-xl border p-3 text-left transition-all",
            value === preset.id
              ? "border-primary/60 bg-primary/10 ring-1 ring-primary/30"
              : "border-border/60 bg-muted/20 hover:border-border hover:bg-muted/40",
          )}
        >
          <div className="mb-2 flex gap-1">
            {preset.id === "custom" ? (
              customColors ? (
                <ColorSwatches {...customColors} />
              ) : (
                <span className="flex size-4 items-center justify-center rounded-full bg-muted text-[9px] font-bold">
                  ✦
                </span>
              )
            ) : (
              <ColorSwatches
                accent={preset.accent}
                cardBase={preset.cardBase}
                glow={preset.glow}
              />
            )}
          </div>
          <p className="text-sm font-medium">{preset.name}</p>
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
            {preset.description}
          </p>
        </button>
      ))}
    </div>
  );
}
