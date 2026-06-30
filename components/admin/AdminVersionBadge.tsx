import { APP_VERSION } from "@/lib/app-version";

export function AdminVersionBadge() {
  return (
    <p
      className="pointer-events-none fixed bottom-3 right-4 z-10 select-none text-xs tabular-nums text-muted-foreground/50 sm:right-6"
      aria-label={`Version ${APP_VERSION}`}
    >
      v{APP_VERSION}
    </p>
  );
}
