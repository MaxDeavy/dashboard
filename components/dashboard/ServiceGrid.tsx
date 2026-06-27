"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
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
  moveDashboardServiceToOwnRow,
  moveDashboardServiceToSlot,
  type DashboardColumn,
} from "@/lib/dashboard-layout";
import {
  getNextAvailableSlot,
  groupServicesIntoRows,
  sortServicesByLayout,
} from "@/lib/service-rows";
import {
  DEFAULT_LAYOUT_SETTINGS,
  getColumnGridStyle,
  getRowTileGap,
  getTileMetrics,
  usesCustomColumnWidth,
  type DashboardLayoutSettings,
  type ServiceRowDensity,
} from "@/lib/layout-settings";
import type { NetworkMode } from "@/lib/network-mode";
import type { Category } from "@/lib/db/schema";
import { useCtrlKeyHeld } from "@/hooks/useCtrlKeyHeld";
import { cn } from "@/lib/utils";
import { getCategoryAccentColor } from "@/lib/tile-colors";
import {
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
  baseCardColor = FALLBACK_CARD_BASE_COLOR,
  networkMode = "web",
  layout = DEFAULT_LAYOUT_SETTINGS,
  onLayoutSaved,
  layoutEditable = false,
}: ServiceGridProps) {
  const t = useTranslations("dashboard");
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
    | {
        type: "service-before-row";
        categoryId: number;
        rowOrder: number;
      }
    | {
        type: "service-beside";
        categoryId: number;
        rowOrder: number;
        slotIndex: number;
      }
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
        toast.success(t("categoriesReordered"));
        onLayoutSaved?.();
      } else {
        toast.error(t("categoriesReorderFailed"));
        setLayoutColumns(filteredColumns);
      }
    } catch {
      toast.error(t("categoriesReorderFailed"));
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
    updates: ReturnType<typeof moveDashboardServiceToSlot>["updates"],
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
        toast.success(t("servicesReordered"));
        onLayoutSaved?.();
      } else {
        toast.error(t("servicesReorderFailed"));
        setLayoutColumns(filteredColumns);
      }
    } catch {
      toast.error(t("servicesReorderFailed"));
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

  function handleServiceDropBeside(
    categoryId: number,
    rowOrder: number,
    slotIndex: number,
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

    const { columns: nextColumns, updates } = moveDashboardServiceToSlot(
      layoutColumns,
      serviceId,
      categoryId,
      rowOrder,
      slotIndex,
    );

    void persistServiceReorder(nextColumns, updates);
  }

  function handleServiceDropBeforeRow(
    categoryId: number,
    beforeRowOrder: number,
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

    const { columns: nextColumns, updates } = moveDashboardServiceToOwnRow(
      layoutColumns,
      serviceId,
      categoryId,
      beforeRowOrder,
    );

    void persistServiceReorder(nextColumns, updates);
  }

  function renderHorizontalDropDivider(
    categoryId: number,
    rowOrder: number,
    slotIndex: number,
  ) {
    const isTarget =
      dropTarget?.type === "service-beside" &&
      dropTarget.categoryId === categoryId &&
      dropTarget.rowOrder === rowOrder &&
      dropTarget.slotIndex === slotIndex;

    return (
      <div
        key={`drop-${categoryId}-${rowOrder}-${slotIndex}`}
        className="relative z-30 w-2 shrink-0 self-stretch"
        onDragEnter={(event) => {
          if (!layoutEditMode || draggingServiceId == null) return;
          event.preventDefault();
          event.stopPropagation();
        }}
        onDragOver={(event) => {
          if (!layoutEditMode || draggingServiceId == null) return;
          event.preventDefault();
          event.stopPropagation();
          event.dataTransfer.dropEffect = "move";
          setDropTarget({
            type: "service-beside",
            categoryId,
            rowOrder,
            slotIndex,
          });
        }}
        onDrop={(event) => {
          event.preventDefault();
          event.stopPropagation();
          handleServiceDropBeside(categoryId, rowOrder, slotIndex, event);
        }}
      >
        {isTarget && (
          <div className="pointer-events-none absolute inset-y-2 left-1/2 z-10 w-0.5 -translate-x-1/2 rounded-full bg-primary" />
        )}
      </div>
    );
  }

  if (
    searchQuery &&
    filteredColumns.every((column) => column.services.length === 0)
  ) {
    return (
      <div className="glass-panel rounded-2xl py-20 text-center">
        <p className="text-sm text-muted-foreground">
          {t("noServicesFound", { query: searchQuery })}
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
          {t("layoutEditHint")}. {t("layoutEditHintEnd")}
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
                    ? t("moveCategory", { name: column.name })
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
              className="dashboard-service-list flex flex-col"
              style={
                {
                  "--dashboard-tile-spacing": `${layout.tileSpacing}px`,
                  gap: `${layout.tileSpacing}px`,
                } as React.CSSProperties
              }
              onDragOver={(event) => {
                if (!layoutEditMode || draggingServiceId == null) return;
                event.preventDefault();
                const rows = groupServicesIntoRows(column.services);
                setDropTarget({
                  type: "service-before-row",
                  categoryId: column.id,
                  rowOrder: rows.length,
                });
              }}
              onDrop={(event) => {
                event.preventDefault();
                event.stopPropagation();
                const rows = groupServicesIntoRows(column.services);
                handleServiceDropBeforeRow(column.id, rows.length, event);
              }}
            >
              {groupServicesIntoRows(column.services).map((row, rowOrder) => {
                const sorted = sortServicesByLayout(row);
                const nextSlot = getNextAvailableSlot(row);
                const rowDensity = Math.min(row.length, 3) as ServiceRowDensity;
                const rowGap =
                  rowDensity > 1 ? getRowTileGap(layout, rowDensity) : 0;
                const isDragging = layoutEditMode && draggingServiceId != null;

                return (
                  <div
                    key={rowOrder}
                    className="relative"
                    onDragOver={(event) => {
                      if (!layoutEditMode || draggingServiceId == null) return;
                      event.preventDefault();
                      event.stopPropagation();
                      setDropTarget({
                        type: "service-before-row",
                        categoryId: column.id,
                        rowOrder,
                      });
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      handleServiceDropBeforeRow(column.id, rowOrder, event);
                    }}
                  >
                    {dropTarget?.type === "service-before-row" &&
                      dropTarget.categoryId === column.id &&
                      dropTarget.rowOrder === rowOrder && (
                        <div className="absolute inset-x-0 -top-1 z-10 h-0.5 rounded-full bg-primary" />
                      )}

                    <div
                      className="relative flex w-full items-stretch"
                      style={{ gap: isDragging ? 0 : rowGap }}
                    >
                      {sorted.map((service, index) => (
                        <Fragment key={service.id}>
                          {isDragging &&
                            renderHorizontalDropDivider(
                              column.id,
                              rowOrder,
                              index,
                            )}
                          <div className="relative flex min-w-0 flex-1">
                            <div
                              className="flex h-full min-w-0 flex-1"
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
                                healthStatus={
                                  healthMap[service.id] ?? "unknown"
                                }
                                baseCardColor={baseCardColor}
                                categoryColor={column.color}
                                networkMode={networkMode}
                                layout={layout}
                                layoutEditMode={layoutEditMode}
                                dragging={draggingServiceId === service.id}
                                rowDensity={rowDensity}
                              />
                            </div>
                          </div>
                        </Fragment>
                      ))}
                      {isDragging &&
                        nextSlot != null &&
                        renderHorizontalDropDivider(
                          column.id,
                          rowOrder,
                          nextSlot,
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          );
        })}
      </div>
    </div>
  );
}
