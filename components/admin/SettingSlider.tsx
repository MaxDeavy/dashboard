"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface SettingSliderProps {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  className?: string;
}

export function SettingSlider({
  label,
  description,
  value,
  min,
  max,
  step = 1,
  unit = "px",
  onChange,
  className,
}: SettingSliderProps) {
  function clamp(next: number) {
    return Math.min(max, Math.max(min, next));
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <Label>{label}</Label>
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => {
              const parsed = Number(e.target.value);
              if (Number.isFinite(parsed)) onChange(clamp(parsed));
            }}
            className="h-8 w-20 text-right tabular-nums"
          />
          {unit ? (
            <span className="text-xs text-muted-foreground">{unit}</span>
          ) : null}
        </div>
      </div>
      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
        className="h-2 w-full cursor-pointer accent-primary"
      />
    </div>
  );
}
