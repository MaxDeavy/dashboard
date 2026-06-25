"use client";

import { useEffect, useMemo, useState } from "react";
import { GripVertical } from "lucide-react";
import { toast } from "sonner";
import type { HealthStatus } from "@/lib/health";
import {
  DASHBOARD_GRID_COLS,
  MAX_DASHBOARD_COLUMNS,
} from "@/lib/constants";
import {
  buildServicePositionMap,
  filterChangedCategoryUpdates,
  filterChangedReorderUpdates,
  getEditableDashboardColumns,
  moveDashboardColumn,
  moveDashboardService,
  type DashboardColumn,
} from "@/lib/dashboard-layout";
import {
  DEFAULT_LAYOUT_SETTINGS,
  getColumnGridStyle,
  getTileMetrics,
  usesCustomColumnWidth,
  type DashboardLayoutSettings,
} from "@/lib/layout-settings";
import type { NetworkMode } from "@/lib/network-mode";
import type { Category } from "@/lib/db/schema";
import { useCtrlKeyHeld } from "@/hooks/useCtrlKeyHeld";
import { cn } from "@/lib/utils";
import { getCategoryAccentColor } from "@/lib/tile-colors";
import {
  FALLBACK_ACCENT_COLOR,
  FALLBACK_CARD_BASE_COLOR,
} from "@/lib/theme-presets";
import { ServiceCard, type ServiceWithWidget } from "./ServiceCard";

interface ColumnData extends Category {
  services: ServiceWithWidget[];
  isEmpty?: boolean;
}

interface ServiceGridProps {
  columns: ColumnData[];
  searchQuery: string;
  healthMap: Record<number, HealthStatus>;
  accentColor?: string;
  baseCardColor?: string;
  networkMode?: NetworkMode;
  layout?: DashboardLayoutSettings;
  onLayoutSaved?: () => void;
  layoutEditable?: boolean;
}

function matchesSearch(service: ServiceWithWidget, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    service.name.toLowerCase().includes(q) ||
    (service.subtitle?.toLowerCase().includes(q) ?? false) ||
    service.url.toLowerCase().includes(q)
  );
}

function filterColumnsForDisplay(
  columns: ColumnData[],
  searchQuery: string,
): DashboardColumn<ServiceWithWidget>[] {
  return getEditableDashboardColumns(
    columns
      .map((column) => ({
        ...column,
        services: column.services.filter((service) =>
          matchesSearch(service, searchQuery),
        ),
      }))
      .filter(
        (column) =>
          !column.isEmpty &&
          (column.services.length > 0 || !searchQuery),
      ),
  );
}

export function ServiceGrid({
  columns,
  searchQuery,
  healthMap,
  accentColor = FALLBACK_ACCENT_COLOR,
  baseCardColor = FALLBACK_CARD_BASE_COLOR,
  networkMode = "web",
  layout = DEFAULT_LAYOUT_SETTINGS,
  onLayoutSaved,
  layoutEditable = false,
}: ServiceGridProps) {
  const ctrlHeld = useCtrlKeyHeld();
  const layoutEditMode = ctrlHeld && !searchQuery && layoutEditable;

  const filteredColumns = useMemo(
    () => filterColumnsForDisplay(columns, searchQuery),
    [columns, searchQuery],
  );

  const [layoutColumns, setLayoutColumns] = useState(filteredColumns);
  const [draggingColumnId, setDraggingColumnId] = useState<number | null>(null);
  const [draggingServiceId, setDraggingServiceId] = useState<number | null>(
    null,
  );
  const [dropTarget, setDropTarget] = useState<
    | { type: "column"; index: number }
    | { type: "service"; categoryId: number; index: number }
    | null
  >(null);
  const [savingLayout, setSavingLayout] = useState(false);

  const servicePositions = useMemo(
    () => buildServicePositionMap(filteredColumns),
    [filteredColumns],
  );

  const columnPositions = useMemo(
    () =>
      new Map(
        filteredColumns.map((column) => [column.id, column.columnPosition]),
      ),
    [filteredColumns],
  );

  useEffect(() => {
    setLayoutColumns(filteredColumns);
    setDraggingColumnId(null);
    setDraggingServiceId(null);
    setDropTarget(null);
  }, [filteredColumns]);

  async function persistColumnReorder(
    nextColumns: DashboardColumn<ServiceWithWidget>[],
    updates: ReturnType<typeof moveDashboardColumn>["updates"],
  ) {
    const changed = filterChangedCategoryUpdates(updates, columnPositions);
    if (changed.length === 0) return;

    setSavingLayout(true);
    setLayoutColumns(nextColumns);

    try {
      const response = await fetch("/api/categories/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: changed }),
      });

      if (response.ok) {
        toast.success("Kategorien neu angeordnet");
        onLayoutSaved?.();
      } else {
        toast.error("Kategorien konnten nicht gespeichert werden");
        setLayoutColumns(filteredColumns);
      }
    } catch {
      toast.error("Kategorien konnten nicht gespeichert werden");
      setLayoutColumns(filteredColumns);
    } finally {
      setSavingLayout(false);
      setDraggingColumnId(null);
      setDraggingServiceId(null);
      setDropTarget(null);
    }
  }

  async function persistServiceReorder(
    nextColumns: DashboardColumn<ServiceWithWidget>[],
    updates: ReturnType<typeof moveDashboardService>["updates"],
  ) {
    const changed = filterChangedReorderUpdates(updates, servicePositions);
    if (changed.length === 0) return;

    setSavingLayout(true);
    setLayoutColumns(nextColumns);

    try {
      const response = await fetch("/api/services/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: changed }),
      });

      if (response.ok) {
        toast.success("Dienste neu angeordnet");
        onLayoutSaved?.();
      } else {
        toast.error("Dienste konnten nicht gespeichert werden");
        setLayoutColumns(filteredColumns);
      }
    } catch {
      toast.error("Dienste konnten nicht gespeichert werden");
      setLayoutColumns(filteredColumns);
    } finally {
      setSavingLayout(false);
      setDraggingColumnId(null);
      setDraggingServiceId(null);
      setDropTarget(null);
    }
  }

  function handleColumnDrop(index: number, event?: React.DragEvent) {
    const transferId = event?.dataTransfer.getData("text/plain");
    const columnId =
      draggingColumnId ??
      (transferId?.startsWith("column:")
        ? Number(transferId.slice(7))
        : null);

    if (
      columnId == null ||
      !Number.isFinite(columnId) ||
      savingLayout ||
      !layoutEditMode
    ) {
      return;
    }

    const { columns: nextColumns, updates } = moveDashboardColumn(
      layoutColumns,
      columnId,
      index,
    );

    void persistColumnReorder(nextColumns, updates);
  }

  function handleServiceDrop(
    categoryId: number,
    index: number,
    event?: React.DragEvent,
  ) {
    const transferId = event?.dataTransfer.getData("text/plain");
    const serviceId =
      draggingServiceId ??
      (transferId?.startsWith("service:")
        ? Number(transferId.slice(8))
        : null);

    if (
      serviceId == null ||
      !Number.isFinite(serviceId) ||
      savingLayout ||
      !layoutEditMode
    ) {
      return;
    }

    const { columns: nextColumns, updates } = moveDashboardService(
      layoutColumns,
      serviceId,
      categoryId,
      index,
    );

    void persistServiceReorder(nextColumns, updates);
  }

  if (
    searchQuery &&
    filteredColumns.every((column) => column.services.length === 0)
  ) {
    return (
      <div className="glass-panel rounded-2xl py-20 text-center">
        <p className="text-sm text-muted-foreground">
          Keine Dienste für &quot;{searchQuery}&quot; gefunden.
        </p>
      </div>
    );
  }

  const displayColumns = layoutEditMode ? layoutColumns : filteredColumns;
  const columnCount = Math.min(
    Math.max(displayColumns.length, 1),
    MAX_DASHBOARD_COLUMNS,
  );
  const gridCols =
    DASHBOARD_GRID_COLS[columnCount] ?? DASHBOARD_GRID_COLS[6];
  const customColumnWidth = usesCustomColumnWidth(layout);
  const columnGridStyle = getColumnGridStyle(layout, columnCount);
  const metrics = getTileMetrics(layout);

  return (
    <div className="space-y-3">
      {layoutEditMode && (
        <div className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-muted-foreground">
          Strg gedrückt: Kategorien, Kacheln und Navigationslinks per Drag &amp; Drop
          anordnen. Loslassen von Strg beendet den Layout-Modus.
        </div>
      )}

      <div
        className={cn(
          "dashboard-service-grid grid grid-cols-2 max-[360px]:grid-cols-1",
          !customColumnWidth && gridCols,
          customColumnWidth && "dashboard-service-grid--custom",
        )}
        style={
          {
            "--dashboard-column-gap": `${layout.columnGap}px`,
            ...(customColumnWidth && columnGridStyle
              ? {
                  "--dashboard-columns": columnGridStyle.gridTemplateColumns,
                }
              : {}),
          } as React.CSSProperties
        }
      >
        {displayColumns.map((column, columnIndex) => {
          const columnAccent = getCategoryAccentColor(column.color, baseCardColor);

          return (
          <section
            key={column.id}
            className={cn(
              "dashboard-service-column-shell glass-panel min-w-0 rounded-2xl transition-shadow",
              customColumnWidth && "dashboard-service-column",
              layoutEditMode && "ring-1 ring-primary/20",
              dropTarget?.type === "column" &&
                dropTarget.index === columnIndex &&
                "ring-2 ring-primary/50",
            )}
            style={
              {
                "--dashboard-column-padding": `${layout.columnPadding}px`,
              } as React.CSSProperties
            }
            onDragOver={(event) => {
              if (!layoutEditMode || draggingColumnId == null) return;
              event.preventDefault();
              setDropTarget({ type: "column", index: columnIndex });
            }}
            onDrop={(event) => {
              event.preventDefault();
              handleColumnDrop(columnIndex, event);
            }}
          >
            {column.name && (
              <div
                draggable={layoutEditMode && !savingLayout}
                onDragStart={(event) => {
                  if (!layoutEditMode) return;
                  if (!event.ctrlKey && !ctrlHeld) {
                    event.preventDefault();
                    return;
                  }
                  setDraggingColumnId(column.id);
                  setDraggingServiceId(null);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData(
                    "text/plain",
                    `column:${column.id}`,
                  );
                }}
                onDragEnd={() => {
                  setDraggingColumnId(null);
                  setDropTarget(null);
                }}
                className={cn(
                  "mb-3.5 flex items-center gap-2 px-0.5",
                  layoutEditMode &&
                    "cursor-grab rounded-lg bg-primary/5 py-1.5 active:cursor-grabbing",
                  draggingColumnId === column.id && "opacity-50",
                )}
                aria-label={
                  layoutEditMode
                    ? `Kategorie ${column.name} verschieben`
                    : undefined
                }
              >
                {layoutEditMode && (
                  <GripVertical
                    className="size-4 shrink-0 text-muted-foreground/60"
                    aria-hidden
                  />
                )}

                <div
                  className="size-2 shrink-0 rounded-full shadow-[0_0_12px_currentColor]"
                  style={{
                    backgroundColor: columnAccent,
                    color: columnAccent,
                  }}
                />
                <h2
                  className="truncate font-semibold tracking-[0.12em] uppercase"
                  style={{
                    fontSize: `${metrics.columnTitleSize}px`,
                    color: `color-mix(in srgb, ${columnAccent} 70%, white)`,
                  }}
                >
                  {column.name}
                </h2>
                <div
                  className="h-px flex-1"
                  style={{
                    background: `linear-gradient(90deg, color-mix(in srgb, ${columnAccent} 50%, transparent), transparent)`,
                  }}
                />
                <span
                  className="font-medium text-muted-foreground/70 tabular-nums"
                  style={{ fontSize: `${metrics.columnCountSize}px` }}
                >
                  {column.services.length}
                </span>
              </div>
            )}

            <div
              className="dashboard-service-list grid grid-cols-1"
              style={
                {
                  "--dashboard-tile-spacing": `${layout.tileSpacing}px`,
                } as React.CSSProperties
              }
              onDragOver={(event) => {
                if (!layoutEditMode || draggingServiceId == null) return;
                event.preventDefault();
                setDropTarget({
                  type: "service",
                  categoryId: column.id,
                  index: column.services.length,
                });
              }}
              onDrop={(event) => {
                event.preventDefault();
                event.stopPropagation();
                handleServiceDrop(column.id, column.services.length, event);
              }}
            >
              {column.services.map((service, serviceIndex) => (
                <div
                  key={service.id}
                  className="relative"
                  onDragOver={(event) => {
                    if (!layoutEditMode || draggingServiceId == null) return;
                    event.preventDefault();
                    event.stopPropagation();
                    setDropTarget({
                      type: "service",
                      categoryId: column.id,
                      index: serviceIndex,
                    });
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    handleServiceDrop(column.id, serviceIndex, event);
                  }}
                >
                  {dropTarget?.type === "service" &&
                    dropTarget.categoryId === column.id &&
                    dropTarget.index === serviceIndex && (
                      <div className="absolute inset-x-0 -top-1 z-10 h-0.5 rounded-full bg-primary" />
                    )}

                  <div
                    draggable={layoutEditMode && !savingLayout}
                    onDragStart={(event) => {
                      if (!event.ctrlKey && !ctrlHeld) {
                        event.preventDefault();
                        return;
                      }
                      setDraggingServiceId(service.id);
                      setDraggingColumnId(null);
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData(
                        "text/plain",
                        `service:${service.id}`,
                      );
                    }}
                    onDragEnd={() => {
                      setDraggingServiceId(null);
                      setDropTarget(null);
                    }}
                  >
                    <ServiceCard
                      service={service}
                      healthStatus={healthMap[service.id] ?? "unknown"}
                      accentColor={accentColor}
                      baseCardColor={baseCardColor}
                      categoryColor={column.color}
                      networkMode={networkMode}
                      layout={layout}
                      layoutEditMode={layoutEditMode}
                      dragging={draggingServiceId === service.id}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
          );
        })}
      </div>
    </div>
  );
}
