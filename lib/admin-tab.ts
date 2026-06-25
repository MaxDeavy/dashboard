import { getAppStoragePrefix } from "@/lib/env";

export const ADMIN_TABS = ["services", "pages", "nav", "settings"] as const;

export type AdminTab = (typeof ADMIN_TABS)[number];

const prefix = getAppStoragePrefix();

export const ADMIN_TAB_STORAGE_KEY = `${prefix}-admin-tab`;

export const DEFAULT_ADMIN_TAB: AdminTab = "services";

export function parseAdminTab(value: string | null | undefined): AdminTab | null {
  if (value === "categories") return "services";
  if (value && ADMIN_TABS.includes(value as AdminTab)) {
    return value as AdminTab;
  }
  return null;
}

export function readStoredAdminTab(): AdminTab {
  if (typeof window === "undefined") return DEFAULT_ADMIN_TAB;

  try {
    const stored = localStorage.getItem(ADMIN_TAB_STORAGE_KEY);
    const parsed = parseAdminTab(stored);
    return parsed ?? DEFAULT_ADMIN_TAB;
  } catch {
    return DEFAULT_ADMIN_TAB;
  }
}

export function writeStoredAdminTab(tab: AdminTab) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(ADMIN_TAB_STORAGE_KEY, tab);
  } catch {
    // ignore
  }
}

export function resolveAdminTab(
  urlTab: string | null | undefined,
  storedTab?: AdminTab,
): AdminTab {
  return parseAdminTab(urlTab) ?? storedTab ?? DEFAULT_ADMIN_TAB;
}
