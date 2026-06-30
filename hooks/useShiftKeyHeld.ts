"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

let shiftKeyHeld = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return shiftKeyHeld;
}

function setShiftKeyHeld(next: boolean) {
  if (shiftKeyHeld === next) return;
  shiftKeyHeld = next;
  listeners.forEach((listener) => listener());
}

let listenersInstalled = false;

function installShiftKeyListeners() {
  if (listenersInstalled || typeof window === "undefined") return;
  listenersInstalled = true;

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "Shift") {
      setShiftKeyHeld(true);
    }
  }

  function onKeyUp(event: KeyboardEvent) {
    if (event.key === "Shift") {
      setShiftKeyHeld(false);
    }
  }

  function onBlur() {
    setShiftKeyHeld(false);
  }

  window.addEventListener("keydown", onKeyDown, true);
  window.addEventListener("keyup", onKeyUp, true);
  window.addEventListener("blur", onBlur);
}

export function isShiftKeyPressed(): boolean {
  return shiftKeyHeld;
}

export function useShiftKeyHeld(): boolean {
  useEffect(() => {
    installShiftKeyListeners();
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
