"use client";

import { useCallback, useRef } from "react";

interface UseLongPressOptions {
  enabled?: boolean;
  delay?: number;
  moveThreshold?: number;
  onLongPress: () => void;
}

export function useLongPress({
  enabled = true,
  delay = 500,
  moveThreshold = 10,
  onLongPress,
}: UseLongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const suppressClickRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const onTouchStart = useCallback(
    (event: React.TouchEvent) => {
      if (!enabled) return;

      const touch = event.touches[0];
      if (!touch) return;

      startRef.current = { x: touch.clientX, y: touch.clientY };
      clearTimer();

      timerRef.current = setTimeout(() => {
        suppressClickRef.current = true;
        onLongPress();

        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 400);
      }, delay);
    },
    [clearTimer, delay, enabled, onLongPress],
  );

  const onTouchMove = useCallback(
    (event: React.TouchEvent) => {
      if (!enabled || !startRef.current) return;

      const touch = event.touches[0];
      if (!touch) return;

      const deltaX = Math.abs(touch.clientX - startRef.current.x);
      const deltaY = Math.abs(touch.clientY - startRef.current.y);

      if (deltaX > moveThreshold || deltaY > moveThreshold) {
        clearTimer();
        startRef.current = null;
      }
    },
    [clearTimer, enabled, moveThreshold],
  );

  const onTouchEnd = useCallback(() => {
    clearTimer();
    startRef.current = null;
  }, [clearTimer]);

  const onClickCapture = useCallback((event: React.MouseEvent) => {
    if (suppressClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, []);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel: onTouchEnd,
    onClickCapture,
  };
}
