"use client";

import { useEffect, useState } from "react";

export function usePrefersTouch(): boolean {
  const [prefersTouch, setPrefersTouch] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(hover: none) and (pointer: coarse)");

    function update() {
      setPrefersTouch(mediaQuery.matches);
    }

    update();
    mediaQuery.addEventListener("change", update);

    return () => {
      mediaQuery.removeEventListener("change", update);
    };
  }, []);

  return prefersTouch;
}
