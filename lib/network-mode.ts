export type NetworkMode = "web" | "lan";

import { getAppStoragePrefix } from "@/lib/env";

const prefix = getAppStoragePrefix();

export const NETWORK_MODE_STORAGE_KEY = `${prefix}-network-mode`;
export const LAN_ENABLED_SETTING = "lan_enabled";

export function isLanEnabled(
  settings: Record<string, string | undefined> | null | undefined,
): boolean {
  return settings?.[LAN_ENABLED_SETTING] !== "false";
}

export function readStoredNetworkMode(): NetworkMode {
  if (typeof window === "undefined") return "web";

  try {
    const stored = localStorage.getItem(NETWORK_MODE_STORAGE_KEY);
    if (stored === "web" || stored === "lan") {
      return stored;
    }
  } catch {
    // private mode / blocked storage
  }

  return "web";
}

export function writeStoredNetworkMode(mode: NetworkMode) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(NETWORK_MODE_STORAGE_KEY, mode);
  } catch {
    // ignore
  }
}

export function resolveServiceUrl(
  service: { url: string; lanUrl?: string | null },
  mode: NetworkMode,
): string {
  if (mode === "lan" && service.lanUrl) {
    return service.lanUrl;
  }
  return service.url;
}

export function hasLanUrl(service: { lanUrl?: string | null }): boolean {
  return Boolean(service.lanUrl?.trim());
}
