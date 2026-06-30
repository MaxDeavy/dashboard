"use client";

import { useShiftKeyHeld } from "@/hooks/useShiftKeyHeld";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface WidgetPanelContextValue {
  isAnyPanelOpen: boolean;
  setPanelOpen: (serviceId: number, open: boolean) => void;
}

const WidgetPanelContext = createContext<WidgetPanelContextValue>({
  isAnyPanelOpen: false,
  setPanelOpen: () => {},
});

export function WidgetPanelProvider({ children }: { children: ReactNode }) {
  const [openPanels, setOpenPanels] = useState<Set<number>>(() => new Set());
  const shiftHeld = useShiftKeyHeld();
  const isAnyPanelOpen = openPanels.size > 0;

  useEffect(() => {
    if (!isAnyPanelOpen || !shiftHeld) return;

    const body = document.body;
    const prevUserSelect = body.style.userSelect;
    const prevWebkitUserSelect = body.style.webkitUserSelect;

    body.style.userSelect = "none";
    body.style.webkitUserSelect = "none";

    return () => {
      body.style.userSelect = prevUserSelect;
      body.style.webkitUserSelect = prevWebkitUserSelect;
    };
  }, [isAnyPanelOpen, shiftHeld]);

  const setPanelOpen = useCallback((serviceId: number, open: boolean) => {
    setOpenPanels((prev) => {
      const next = new Set(prev);
      if (open) {
        next.add(serviceId);
      } else {
        next.delete(serviceId);
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      isAnyPanelOpen,
      setPanelOpen,
    }),
    [isAnyPanelOpen, setPanelOpen],
  );

  return (
    <WidgetPanelContext.Provider value={value}>
      {children}
    </WidgetPanelContext.Provider>
  );
}

export function useWidgetPanel() {
  return useContext(WidgetPanelContext);
}
