"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface EnableSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
  compact?: boolean;
  mini?: boolean;
}

export function EnableSwitch({
  enabled,
  onChange,
  disabled,
  compact = false,
  mini = false,
}: EnableSwitchProps) {
  const t = useTranslations("enableSwitch");

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={enabled ? t("enabled") : t("disabled")}
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={cn(
        "relative inline-flex shrink-0 items-center rounded-full transition-colors",
        mini ? "h-3.5 w-6" : compact ? "h-5 w-9" : "h-6 w-11",
        enabled ? "bg-primary" : "bg-muted-foreground/25",
        disabled && "cursor-wait opacity-50",
      )}
    >
      <span
        className={cn(
          "pointer-events-none block rounded-full bg-white shadow-sm transition-transform",
          mini ? "size-2.5" : compact ? "size-4" : "size-5",
          enabled
            ? mini
              ? "translate-x-[12px]"
              : compact
                ? "translate-x-[18px]"
                : "translate-x-[22px]"
            : "translate-x-0.5",
        )}
      />
    </button>
  );
}
