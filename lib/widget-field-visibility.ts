"use client";

const STORAGE_PREFIX =
  process.env.NEXT_PUBLIC_APP_STORAGE_PREFIX?.trim() || "homelab-dashboard";

function storageKey(serviceId: number): string {
  return `${STORAGE_PREFIX}-widget-hidden-${serviceId}`;
}

export function readHiddenWidgetFields(serviceId: number): Set<string> {
  if (typeof window === "undefined") return new Set();

  try {
    const raw = localStorage.getItem(storageKey(serviceId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((entry) => typeof entry === "string"));
  } catch {
    return new Set();
  }
}

export function writeHiddenWidgetFields(
  serviceId: number,
  hiddenFieldIds: Set<string>,
): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(
      storageKey(serviceId),
      JSON.stringify([...hiddenFieldIds]),
    );
  } catch {
    // ignore quota / private mode
  }
}
