import type { HealthStatus } from "@/lib/health";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  HealthStatus,
  { label: string; dot: string; ring: string; glow: string; pulse?: boolean }
> = {
  up: {
    label: "Online (interner Health-Check erfolgreich)",
    dot: "bg-emerald-400",
    ring: "ring-emerald-400/40",
    glow: "shadow-[0_0_8px_rgba(52,211,153,0.6)]",
    pulse: true,
  },
  down: {
    label: "Offline (interner Health-Check fehlgeschlagen)",
    dot: "bg-rose-500",
    ring: "ring-rose-500/40",
    glow: "shadow-[0_0_8px_rgba(244,63,94,0.5)]",
  },
  unknown: {
    label: "",
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
  if (status === "unknown") return null;

  const config = statusConfig[status];

  return (
    <span
      className={cn("absolute -top-0.5 -right-0.5 flex size-2.5", className)}
      title={config.label}
    >
      <span
        className={cn(
          "relative inline-flex size-2.5 rounded-full ring-2",
          config.dot,
          config.ring,
          config.glow,
        )}
      >
        {config.pulse && (
          <span
            className={cn(
              "absolute inset-0 animate-ping rounded-full opacity-60",
              config.dot,
            )}
          />
        )}
      </span>
    </span>
  );
}
