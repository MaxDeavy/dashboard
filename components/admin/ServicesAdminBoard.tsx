"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { GripVertical, Plus, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServiceIconDisplay } from "@/components/ServiceIconDisplay";
import { EnableSwitch } from "@/components/admin/EnableSwitch";
import {
  filterChangedCategoryUpdates,
  moveDashboardColumn,
  type DashboardColumn,
} from "@/lib/dashboard-layout";
import {
  buildServiceBoard,
  filterChangedReorderUpdates,
  moveServiceToOwnRowInBoard,
  moveServiceToSlotInBoard,
  type ServiceBoardColumn,
} from "@/lib/service-board";
import {
  getNextAvailableSlot,
  groupServicesIntoRows,
  sortServicesByLayout,
} from "@/lib/service-rows";
import type { Category, Service } from "@/lib/db/schema";
import {
  ADMIN_MULTI_ROW_GAP_PX,
  type ServiceRowDensity,
} from "@/lib/layout-settings";
import { cn } from "@/lib/utils";

const ADMIN_SERVICE_ROW_HEIGHT_PX = 42;

interface ServiceWithWidget extends Service {
  widget: {
    widgetType: string;
    apiUrl: string;
    extraConfig: string | null;
  } | null;
}

interface ServicesAdminBoardProps {
  services: ServiceWithWidget[];
  categories: Category[];
  pageId: number;
  defaultCardColor: string;
  onEdit: (service: ServiceWithWidget) => void;
  onAddService: (categoryId: number) => void;
  onEditCategory: (category: Category) => void;
  onToggleEnabled: (service: ServiceWithWidget, enabled: boolean) => void;
  onDelete: (id: number) => void;
  onRefresh: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  togglingId: number | null;
}

function toBoardColumns(categories: Category[]): DashboardColumn<never>[] {
  return [...categories]
    .sort((a, b) => a.columnPosition - b.columnPosition)
    .map((category) => ({
      ...category,
      services: [],
      isEmpty: false,
    }));
}

function fromBoardColumns(columns: DashboardColumn<never>[]): Category[] {
  return columns.map((column) => ({
    id: column.id,
    name: column.name,
    sortOrder: column.columnPosition,
    columnPosition: column.columnPosition,
    enabled: column.enabled,
    color: column.color ?? null,
    pageId: column.pageId ?? 0,
  }));
}

function parseDragId(
  value: string,
  prefix: "service" | "category",
): number | null {
  if (!value.startsWith(`${prefix}:`)) return null;
  const id = Number(value.slice(prefix.length + 1));
  return Number.isFinite(id) ? id : null;
}

export function ServicesAdminBoard({
  services,
  categories,
  pageId,
  defaultCardColor,
  onEdit,
  onAddService,
  onEditCategory,
  onToggleEnabled,
  onDelete,
  onRefresh,
  onSuccess,
  onError,
  togglingId,
}: ServicesAdminBoardProps) {
  const t = useTranslations("adminServices");
  const tc = useTranslations("common");
  const [columns, setColumns] = useState<ServiceBoardColumn<ServiceWithWidget>[]>(
    [],
  );
  const [orderedCategories, setOrderedCategories] = useState<Category[]>([]);
  const [draggingServiceId, setDraggingServiceId] = useState<number | null>(null);
  const [draggingCategoryId, setDraggingCategoryId] = useState<number | null>(
    null,
  );
  const [serviceDropTarget, setServiceDropTarget] = useState<
    | { categoryId: number; type: "before-row"; rowOrder: number }
    | { categoryId: number; type: "beside"; rowOrder: number; slotIndex: number }
    | null
  >(null);
  const [categoryDropIndex, setCategoryDropIndex] = useState<number | null>(
    null,
  );
  const [savingServiceOrder, setSavingServiceOrder] = useState(false);
  const [savingCategoryOrder, setSavingCategoryOrder] = useState(false);

  const originalServicePositions = useMemo(
    () =>
      new Map(
        services.map((service) => [
          service.id,
          {
            categoryId: service.categoryId,
            sortOrder: service.sortOrder,
            rowOrder: service.rowOrder,
            slotIndex: service.slotIndex,
          },
        ]),
      ),
    [services],
  );

  const pageCategories = useMemo(
    () => categories.filter((category) => category.pageId === pageId),
    [categories, pageId],
  );

  const originalCategoryPositions = useMemo(
    () =>
      new Map(
        pageCategories.map((category) => [category.id, category.columnPosition]),
      ),
    [pageCategories],
  );

  useEffect(() => {
    setColumns(buildServiceBoard(services, categories, pageId));
    setOrderedCategories(
      [...pageCategories].sort((a, b) => a.columnPosition - b.columnPosition),
    );
    setDraggingServiceId(null);
    setDraggingCategoryId(null);
    setServiceDropTarget(null);
    setCategoryDropIndex(null);
  }, [services, categories, pageId, pageCategories]);

  const categoryColumns = useMemo(() => {
    const byCategoryId = new Map(
      columns.map((column) => [column.categoryId, column]),
    );

    return orderedCategories
      .map((category) => byCategoryId.get(category.id))
      .filter((column): column is ServiceBoardColumn<ServiceWithWidget> =>
        Boolean(column),
      );
  }, [columns, orderedCategories]);

  async function persistServiceReorder(
    nextColumns: ServiceBoardColumn<ServiceWithWidget>[],
    updates: ReturnType<typeof moveServiceToSlotInBoard>["updates"],
  ) {
    const changed = filterChangedReorderUpdates(
      updates,
      originalServicePositions,
    );

    setSavingServiceOrder(true);
    setColumns(nextColumns);

    if (changed.length === 0) {
      setSavingServiceOrder(false);
      setDraggingServiceId(null);
      setServiceDropTarget(null);
      return;
    }

    try {
      const response = await fetch("/api/services/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: changed }),
      });

      if (response.ok) {
        onSuccess(tc("orderSaved"));
        onRefresh();
      } else {
        onError(tc("orderSaveFailed"));
        setColumns(buildServiceBoard(services, categories, pageId));
      }
    } catch {
      onError(tc("orderSaveFailed"));
      setColumns(buildServiceBoard(services, categories, pageId));
    } finally {
      setSavingServiceOrder(false);
      setDraggingServiceId(null);
      setServiceDropTarget(null);
    }
  }

  async function persistCategoryReorder(
    nextCategories: Category[],
    updates: ReturnType<typeof moveDashboardColumn>["updates"],
  ) {
    const changed = filterChangedCategoryUpdates(
      updates,
      originalCategoryPositions,
    );
    if (changed.length === 0) return;

    setSavingCategoryOrder(true);
    setOrderedCategories(nextCategories);

    try {
      const response = await fetch("/api/categories/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: changed }),
      });

      if (response.ok) {
        onSuccess(t("categoryOrderSaved"));
        onRefresh();
      } else {
        onError(t("categoryOrderSaveFailed"));
        setOrderedCategories(
          [...pageCategories].sort((a, b) => a.columnPosition - b.columnPosition),
        );
      }
    } catch {
      onError(t("categoryOrderSaveFailed"));
      setOrderedCategories(
        [...categories].sort((a, b) => a.columnPosition - b.columnPosition),
      );
    } finally {
      setSavingCategoryOrder(false);
      setDraggingCategoryId(null);
      setCategoryDropIndex(null);
    }
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
      (transferId ? parseDragId(transferId, "service") : null);

    if (serviceId == null || savingServiceOrder || savingCategoryOrder) return;

    const { columns: nextColumns, updates } = moveServiceToSlotInBoard(
      columns,
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
      (transferId ? parseDragId(transferId, "service") : null);

    if (serviceId == null || savingServiceOrder || savingCategoryOrder) return;

    const { columns: nextColumns, updates } = moveServiceToOwnRowInBoard(
      columns,
      serviceId,
      categoryId,
      beforeRowOrder,
    );

    void persistServiceReorder(nextColumns, updates);
  }

  function handleCategoryDrop(index: number, event?: React.DragEvent) {
    const transferId = event?.dataTransfer.getData("text/plain");
    const categoryId =
      draggingCategoryId ??
      (transferId ? parseDragId(transferId, "category") : null);

    if (categoryId == null || savingCategoryOrder || savingServiceOrder) return;

    const { columns: nextColumns, updates } = moveDashboardColumn(
      toBoardColumns(orderedCategories),
      categoryId,
      index,
    );

    void persistCategoryReorder(fromBoardColumns(nextColumns), updates);
  }

  function renderServiceCell(
    column: ServiceBoardColumn<ServiceWithWidget>,
    service: ServiceWithWidget,
    rowDensity: ServiceRowDensity = 1,
  ) {
    const rowHeightStyle = {
      minHeight: `${ADMIN_SERVICE_ROW_HEIGHT_PX}px`,
      height: "100%",
    };

    const dragHandle = (
      <button
        type="button"
        draggable={!savingServiceOrder && !savingCategoryOrder}
        onDragStart={(event) => {
          setDraggingServiceId(service.id);
          setDraggingCategoryId(null);
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", `service:${service.id}`);
        }}
        onDragEnd={() => {
          setDraggingServiceId(null);
          setServiceDropTarget(null);
        }}
        className={cn(
          "shrink-0 cursor-grab rounded p-0.5 text-muted-foreground/50 hover:bg-muted/40 hover:text-muted-foreground active:cursor-grabbing",
          rowDensity === 3 && "p-0",
        )}
        aria-label={t("moveService", { name: service.name })}
      >
        <GripVertical
          className={cn(
            rowDensity >= 2 ? "size-3" : "size-3.5",
          )}
        />
      </button>
    );

    const actionButtons = (
      <div
        className={cn(
          "flex shrink-0 items-center",
          rowDensity === 3 ? "gap-0" : "gap-1",
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <EnableSwitch
          mini
          enabled={service.enabled}
          disabled={
            togglingId === service.id ||
            savingServiceOrder ||
            savingCategoryOrder
          }
          onChange={(enabled) => onToggleEnabled(service, enabled)}
        />
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "shrink-0",
            rowDensity >= 2 ? "size-6" : "size-7",
          )}
          disabled={savingServiceOrder || savingCategoryOrder}
          onClick={() => onDelete(service.id)}
        >
          <Trash2
            className={cn(
              "text-destructive",
              rowDensity >= 2 ? "size-3" : "size-3.5",
            )}
          />
        </Button>
      </div>
    );

    const shellClass = cn(
      "group w-full min-w-0 rounded-lg border border-border/50 bg-background/40 transition-all duration-200",
      "hover:border-foreground/20 hover:bg-foreground/[0.09] hover:shadow-sm",
      !service.enabled && "opacity-55",
      draggingServiceId === service.id && "opacity-40",
    );

    if (rowDensity === 3) {
      const bottomLabel = service.subtitle ?? service.name;

      return (
        <div
          key={service.id}
          className={cn(shellClass, "flex items-center gap-1 px-1 py-1")}
          style={rowHeightStyle}
        >
          {dragHandle}

          <button
            type="button"
            onClick={() => onEdit(service)}
            className="flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-md px-0.5 transition-colors hover:bg-foreground/[0.05]"
          >
            <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted/30">
              <ServiceIconDisplay
                icon={service.icon}
                name={service.name}
                imageClassName="size-3.5"
                fallbackClassName="text-[8px]"
              />
            </div>
            <p
              className="w-full truncate text-center text-[9px] leading-none text-muted-foreground"
              title={bottomLabel}
            >
              {bottomLabel}
            </p>
          </button>

          {actionButtons}
        </div>
      );
    }

    return (
      <div
        key={service.id}
        className={cn(
          shellClass,
          "flex items-center gap-2",
          rowDensity === 2 ? "gap-1 px-1.5 py-1.5" : "px-2 py-1.5",
        )}
        style={rowHeightStyle}
      >
        {dragHandle}

        <button
          type="button"
          onClick={() => onEdit(service)}
          className={cn(
            "flex min-w-0 flex-1 cursor-pointer items-center rounded-md text-left transition-colors hover:bg-foreground/[0.05]",
            rowDensity === 2 ? "gap-1" : "gap-2",
          )}
        >
          <div
            className={cn(
              "flex shrink-0 items-center justify-center rounded-md bg-muted/30",
              rowDensity === 2 ? "size-6" : "size-7",
            )}
          >
            <ServiceIconDisplay
              icon={service.icon}
              name={service.name}
              imageClassName={rowDensity === 2 ? "size-3.5" : "size-4"}
              fallbackClassName="text-[9px]"
            />
          </div>
          <p
            className={cn(
              "truncate font-medium leading-tight",
              rowDensity === 2 ? "text-[10px]" : "text-xs",
            )}
            title={service.name}
          >
            {service.name}
          </p>
        </button>

        {actionButtons}
      </div>
    );
  }

  function renderHorizontalDropDivider(
    column: ServiceBoardColumn<ServiceWithWidget>,
    rowOrder: number,
    slotIndex: number,
  ) {
    const isTarget =
      serviceDropTarget?.categoryId === column.categoryId &&
      serviceDropTarget.type === "beside" &&
      serviceDropTarget.rowOrder === rowOrder &&
      serviceDropTarget.slotIndex === slotIndex;

    return (
      <div
        key={`drop-${column.categoryId}-${rowOrder}-${slotIndex}`}
        className="relative z-30 w-2 shrink-0 self-stretch"
        onDragEnter={(event) => {
          if (draggingServiceId == null) return;
          event.preventDefault();
          event.stopPropagation();
        }}
        onDragOver={(event) => {
          if (draggingServiceId == null) return;
          event.preventDefault();
          event.stopPropagation();
          event.dataTransfer.dropEffect = "move";
          setServiceDropTarget({
            categoryId: column.categoryId,
            type: "beside",
            rowOrder,
            slotIndex,
          });
        }}
        onDrop={(event) => {
          event.preventDefault();
          event.stopPropagation();
          handleServiceDropBeside(column.categoryId, rowOrder, slotIndex, event);
        }}
      >
        {isTarget && (
          <div className="pointer-events-none absolute inset-y-1 left-1/2 z-10 w-0.5 -translate-x-1/2 rounded-full bg-primary" />
        )}
      </div>
    );
  }

  function renderServiceRows(column: ServiceBoardColumn<ServiceWithWidget>) {
    const rows = groupServicesIntoRows(column.services);

    return rows.map((row, rowOrder) => {
      const sorted = sortServicesByLayout(row);
      const nextSlot = getNextAvailableSlot(row);
      const rowDensity = Math.min(row.length, 3) as ServiceRowDensity;
      const rowGap = rowDensity > 1 ? ADMIN_MULTI_ROW_GAP_PX : 0;
      const isDragging = draggingServiceId != null;
      return (
        <div key={rowOrder} className="relative w-full">
          {isDragging && (
            <div
              className="absolute inset-x-0 -top-1.5 z-20 h-3"
              onDragEnter={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setServiceDropTarget({
                  categoryId: column.categoryId,
                  type: "before-row",
                  rowOrder,
                });
              }}
              onDrop={(event) => {
                event.preventDefault();
                event.stopPropagation();
                handleServiceDropBeforeRow(column.categoryId, rowOrder, event);
              }}
            />
          )}

          {serviceDropTarget?.categoryId === column.categoryId &&
            serviceDropTarget.type === "before-row" &&
            serviceDropTarget.rowOrder === rowOrder && (
              <div className="pointer-events-none absolute inset-x-0 -top-1 z-10 h-0.5 rounded-full bg-primary" />
            )}

          <div
            className="relative flex w-full items-stretch"
            style={{ gap: isDragging ? 0 : rowGap }}
          >
            {sorted.map((service, index) => (
              <Fragment key={service.id}>
                {isDragging &&
                  renderHorizontalDropDivider(column, rowOrder, index)}
                <div className="min-w-0 flex-1">
                  {renderServiceCell(column, service, rowDensity)}
                </div>
              </Fragment>
            ))}
            {isDragging &&
              nextSlot != null &&
              renderHorizontalDropDivider(column, rowOrder, nextSlot)}
          </div>
        </div>
      );
    });
  }

  function renderCategorySection(
    column: ServiceBoardColumn<ServiceWithWidget>,
    categoryIndex: number,
  ) {
    const category = column.category;

    return (
      <section
        key={column.categoryId}
        className={cn(
          "relative flex min-h-[12rem] flex-col rounded-xl border border-border/50 bg-muted/10 p-3",
          draggingCategoryId === category.id && "opacity-50",
        )}
        onDragOver={(event) => {
          if (draggingServiceId == null) return;
          event.preventDefault();
          const rows = groupServicesIntoRows(column.services);
          setServiceDropTarget({
            categoryId: column.categoryId,
            type: "before-row",
            rowOrder: rows.length,
          });
        }}
        onDrop={(event) => {
          if (draggingCategoryId != null) return;
          event.preventDefault();
          const rows = groupServicesIntoRows(column.services);
          handleServiceDropBeforeRow(column.categoryId, rows.length, event);
        }}
      >
        {categoryDropIndex === categoryIndex && (
          <div className="absolute inset-y-2 -left-1.5 z-10 w-0.5 rounded-full bg-primary" />
        )}

        <div className="mb-3 flex items-center gap-2">
          <button
            type="button"
            draggable={!savingCategoryOrder && !savingServiceOrder}
            onDragStart={(event) => {
              setDraggingCategoryId(category.id);
              setDraggingServiceId(null);
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData(
                "text/plain",
                `category:${category.id}`,
              );
            }}
            onDragEnd={() => {
              setDraggingCategoryId(null);
              setCategoryDropIndex(null);
            }}
            className="shrink-0 cursor-grab rounded p-0.5 text-muted-foreground/50 hover:bg-muted/40 hover:text-muted-foreground active:cursor-grabbing"
            aria-label={t("moveCategory", { name: category.name })}
          >
            <GripVertical className="size-4" />
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span
              className={cn(
                "size-2 shrink-0 rounded-full shadow-[0_0_8px_currentColor]",
                !category.color && "opacity-70",
              )}
              style={{
                backgroundColor: category.color ?? defaultCardColor,
                color: category.color ?? defaultCardColor,
              }}
            />
            <div className="min-w-0">
              <h3 className="truncate text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {category.name}
              </h3>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => onEditCategory(category)}
            aria-label={t("categorySettings", { name: category.name })}
          >
            <Settings className="size-3.5" />
          </Button>

          <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
            {column.services.length}
          </span>

          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 shrink-0 px-2 text-[11px]"
            onClick={() => onAddService(column.categoryId)}
          >
            <Plus className="mr-1 size-3" />
            {t("addService")}
          </Button>
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          {renderServiceRows(column)}

          {column.services.length === 0 && (
            <div className="flex min-h-12 items-center justify-center rounded-lg border border-dashed border-border/50 text-xs text-muted-foreground">
              {t("dragServicesHere")}
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">{t("boardHint")}</p>

      <div
        className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        onDragOver={(event) => {
          if (draggingCategoryId == null) return;
          event.preventDefault();
          setCategoryDropIndex(categoryColumns.length);
        }}
        onDrop={(event) => {
          if (draggingCategoryId == null) return;
          event.preventDefault();
          handleCategoryDrop(categoryColumns.length, event);
        }}
      >
        {categoryColumns.map((column, index) => (
          <div
            key={column.categoryId}
            className="relative"
            onDragOver={(event) => {
              if (draggingCategoryId == null) return;
              event.preventDefault();
              event.stopPropagation();
              setCategoryDropIndex(index);
            }}
            onDrop={(event) => {
              if (draggingCategoryId == null) return;
              event.preventDefault();
              event.stopPropagation();
              handleCategoryDrop(index, event);
            }}
          >
            {renderCategorySection(column, index)}
          </div>
        ))}

        {categoryColumns.length === 0 && (
          <div className="col-span-full flex min-h-24 items-center justify-center rounded-xl border border-dashed border-border/50 text-sm text-muted-foreground">
            {t("noCategoriesYet")}
          </div>
        )}
      </div>
    </div>
  );
}
