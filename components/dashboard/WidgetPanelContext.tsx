"use client";

import {
  createContext,
  useCallback,
  useContext,
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
  const isAnyPanelOpen = openPanels.size > 0;

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

/** Shift layout drag only when no widget panel is visible. */
export function useDashboardLayoutEditMode(
  shiftHeld: boolean,
  layoutEditable: boolean,
  searchQuery = "",
): boolean {
  const { isAnyPanelOpen } = useWidgetPanel();
  return (
    shiftHeld &&
    layoutEditable &&
    !isAnyPanelOpen &&
    searchQuery.trim().length === 0
  );
}
