"use client";

import { useTranslations } from "next-intl";
import type { HealthStatus } from "@/lib/health";
import { cn } from "@/lib/utils";

const statusStyles: Record<
  HealthStatus,
  { dot: string; ring: string; glow: string; pulse?: boolean }
> = {
  up: {
    dot: "bg-emerald-400",
    ring: "ring-emerald-400/40",
    glow: "shadow-[0_0_8px_rgba(52,211,153,0.6)]",
    pulse: true,
  },
  down: {
    dot: "bg-rose-500",
    ring: "ring-rose-500/40",
    glow: "shadow-[0_0_8px_rgba(244,63,94,0.5)]",
  },
  unknown: {
    dot: "",
    ring: "",
    glow: "",
  },
};

interface StatusDotProps {
  status: HealthStatus;
  className?: string;
}

export function StatusDot({ status, className }: StatusDotProps) {
  const t = useTranslations("dashboard");

  if (status === "unknown") return null;

  const styles = statusStyles[status];
  const label = status === "up" ? t("statusOnline") : t("statusOffline");

  return (
    <span
      className={cn("absolute -top-0.5 -right-0.5 flex size-2.5", className)}
      title={label}
    >
      <span
        className={cn(
          "relative inline-flex size-2.5 rounded-full ring-2",
          styles.dot,
          styles.ring,
          styles.glow,
        )}
      >
        {styles.pulse && (
          <span
            className={cn(
              "absolute inset-0 animate-ping rounded-full opacity-60",
              styles.dot,
            )}
          />
        )}
      </span>
    </span>
  );
}
