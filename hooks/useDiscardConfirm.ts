"use client";

import { useCallback, useRef, useState } from "react";

export function useDiscardConfirm() {
  const [open, setOpen] = useState(false);
  const pendingDiscardRef = useRef<(() => void) | null>(null);

  const requestClose = useCallback((isDirty: boolean, onDiscard: () => void) => {
    if (!isDirty) {
      onDiscard();
      return;
    }

    pendingDiscardRef.current = onDiscard;
    setOpen(true);
  }, []);

  const confirmDiscard = useCallback(() => {
    setOpen(false);
    pendingDiscardRef.current?.();
    pendingDiscardRef.current = null;
  }, []);

  const cancelDiscard = useCallback(() => {
    setOpen(false);
    pendingDiscardRef.current = null;
  }, []);

  return {
    open,
    requestClose,
    confirmDiscard,
    cancelDiscard,
  };
}
