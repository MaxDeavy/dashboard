"use client";

import { useEffect, useState } from "react";

export function useShiftKeyHeld(): boolean {
  const [held, setHeld] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Shift") {
        setHeld(true);
      }
    }

    function onKeyUp(event: KeyboardEvent) {
      if (event.key === "Shift") {
        setHeld(false);
      }
    }

    function onBlur() {
      setHeld(false);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  return held;
}
