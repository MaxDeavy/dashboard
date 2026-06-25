"use client";

import { useEffect } from "react";
import { applyColorMode, parseColorMode } from "@/lib/theme-presets";

async function loadAndApplyColorMode() {
  try {
    const response = await fetch("/api/settings", { cache: "no-store" });
    if (!response.ok) return;
    const settings = await response.json();
    applyColorMode(parseColorMode(settings.color_mode));
  } catch {
    applyColorMode("dark");
  }
}

export function ThemeApplier() {
  useEffect(() => {
    loadAndApplyColorMode();

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        loadAndApplyColorMode();
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  return null;
}
