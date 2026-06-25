import { getAppStoragePrefix } from "@/lib/env";

const prefix = getAppStoragePrefix();

export const ACTIVE_PAGE_STORAGE_KEY = `${prefix}-active-page`;
export const SHOW_PAGE_SWITCHER_SETTING = "show_page_switcher";
export const PAGE_KEYBOARD_SHORTCUTS_SETTING = "page_keyboard_shortcuts";
export const MAX_PAGE_KEYBOARD_SHORTCUTS = 9;

export function readStoredActivePageId(): number | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(ACTIVE_PAGE_STORAGE_KEY);
    if (!stored) return null;
    const parsed = Number(stored);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export function writeStoredActivePageId(pageId: number) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(ACTIVE_PAGE_STORAGE_KEY, String(pageId));
  } catch {
    // ignore
  }
}
