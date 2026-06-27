import type { WidgetConfig } from "@/lib/db/schema";

export function sanitizeWidgetConfigForClient(
  widget: WidgetConfig | null | undefined,
  includeCredentials: boolean,
) {
  if (!widget) return null;

  if (includeCredentials) {
    return widget;
  }

  const { credentials: _credentials, ...rest } = widget;
  return {
    ...rest,
    credentialsStored: Boolean(widget.credentials),
  };
}
