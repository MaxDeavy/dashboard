import { cn } from "@/lib/utils";
import type { ColorMode } from "@/lib/theme-presets";

interface DashboardBackgroundProps {
  accentColor: string;
  glowColor: string;
  colorMode: ColorMode;
  backgroundImageUrl?: string | null;
}

export function DashboardBackground({
  accentColor,
  glowColor,
  colorMode,
  backgroundImageUrl,
}: DashboardBackgroundProps) {
  const isDark = colorMode === "dark";
  const hasBackgroundImage = Boolean(backgroundImageUrl);

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden",
        isDark ? "bg-[#050508]" : "bg-[#f4f4f5]",
      )}
    >
      {hasBackgroundImage && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${backgroundImageUrl})` }}
          />
          <div
            className={cn(
              "absolute inset-0",
              isDark ? "bg-black/65" : "bg-white/55",
            )}
          />
        </>
      )}

      <div
        className={cn(
          "absolute inset-0",
          hasBackgroundImage
            ? isDark
              ? "opacity-20"
              : "opacity-15"
            : isDark
              ? "opacity-[0.35]"
              : "opacity-[0.5]",
        )}
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, ${isDark ? "rgba(255,255,255,0.045)" : "rgba(0,0,0,0.06)"} 1px, transparent 0)`,
          backgroundSize: "28px 28px",
        }}
      />

      <div
        className="animate-aurora-drift absolute -top-[20%] left-[10%] size-[min(70vw,640px)] rounded-full blur-[100px]"
        style={{
          background: accentColor,
          opacity: hasBackgroundImage
            ? isDark
              ? 0.12
              : 0.08
            : isDark
              ? 0.22
              : 0.14,
        }}
      />
      <div
        className="animate-aurora-drift-reverse absolute top-[30%] -right-[10%] size-[min(60vw,520px)] rounded-full blur-[110px]"
        style={{
          background: `color-mix(in srgb, ${accentColor} 55%, ${glowColor})`,
          opacity: hasBackgroundImage
            ? isDark
              ? 0.08
              : 0.06
            : isDark
              ? 0.12
              : 0.1,
        }}
      />
      <div
        className="animate-aurora-drift absolute -bottom-[15%] left-[35%] size-[min(50vw,400px)] rounded-full blur-[90px]"
        style={{
          background: glowColor,
          opacity: hasBackgroundImage
            ? isDark
              ? 0.06
              : 0.05
            : isDark
              ? 0.1
              : 0.08,
        }}
      />

      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-b from-transparent to-transparent",
          isDark ? "via-[#050508]/20" : "via-[#f4f4f5]/30",
        )}
      />
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? "radial-gradient(ellipse at center, transparent 0%, #050508 75%)"
            : "radial-gradient(ellipse at center, transparent 0%, #f4f4f5 80%)",
        }}
      />
    </div>
  );
}
