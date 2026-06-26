"use client";

import { useEffect } from "react";
import type { Page } from "@/lib/db/schema";
import { isTypingTarget } from "@/lib/keyboard";
import { MAX_PAGE_KEYBOARD_SHORTCUTS } from "@/lib/page-storage";

export function usePageKeyboardShortcuts(
  pages: Page[],
  activePageId: number,
  onPageChange: (pageId: number) => void,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled || pages.length < 2) return;

    const shortcutPages = pages.slice(0, MAX_PAGE_KEYBOARD_SHORTCUTS);

    function onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      const digit = Number(event.key);
      if (!Number.isInteger(digit) || digit < 1 || digit > shortcutPages.length) {
        return;
      }

      const page = shortcutPages[digit - 1];
      if (page && page.id !== activePageId) {
        onPageChange(page.id);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pages, activePageId, onPageChange, enabled]);
}
