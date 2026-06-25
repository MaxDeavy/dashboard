import type { DashboardLayoutSettings } from "@/lib/layout-settings";
import { getLayoutMaxWidthPx } from "@/lib/layout-settings";
import { cn } from "@/lib/utils";

interface LayoutWidthShellProps {
  layout: DashboardLayoutSettings;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  constrained?: boolean;
}

export function LayoutWidthShell({
  layout,
  children,
  className,
  style,
  constrained = true,
}: LayoutWidthShellProps) {
  if (!constrained) {
    return (
      <div className={cn("w-full", className)} style={style}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn("layout-width-shell mx-auto w-full", className)}
      style={
        {
          "--layout-max-width": `${getLayoutMaxWidthPx(layout)}px`,
          "--layout-side-inset": `${layout.contentSideInset}px`,
          ...style,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
