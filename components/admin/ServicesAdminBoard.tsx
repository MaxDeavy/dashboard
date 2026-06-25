"use client";

import { useEffect, useMemo, useState } from "react";
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
  moveServiceInBoard,
  UNSORTED_CATEGORY_ID,
  type ServiceBoardColumn,
} from "@/lib/service-board";
import type { Category, Service } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

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
  const [columns, setColumns] = useState<ServiceBoardColumn<ServiceWithWidget>[]>(
    [],
  );
  const [orderedCategories, setOrderedCategories] = useState<Category[]>([]);
  const [draggingServiceId, setDraggingServiceId] = useState<number | null>(null);
  const [draggingCategoryId, setDraggingCategoryId] = useState<number | null>(
    null,
  );
  const [serviceDropTarget, setServiceDropTarget] = useState<{
    categoryId: number;
    index: number;
  } | null>(null);
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
          { categoryId: service.categoryId, sortOrder: service.sortOrder },
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

  const unsortedColumn = columns.find(
    (column) => column.categoryId === UNSORTED_CATEGORY_ID,
  );

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
    updates: ReturnType<typeof moveServiceInBoard>["updates"],
  ) {
    const changed = filterChangedReorderUpdates(
      updates,
      originalServicePositions,
    );
    if (changed.length === 0) return;

    setSavingServiceOrder(true);
    setColumns(nextColumns);

    try {
      const response = await fetch("/api/services/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: changed }),
      });

      if (response.ok) {
        onSuccess("Reihenfolge gespeichert");
        onRefresh();
      } else {
        onError("Reihenfolge konnte nicht gespeichert werden");
        setColumns(buildServiceBoard(services, categories, pageId));
      }
    } catch {
      onError("Reihenfolge konnte nicht gespeichert werden");
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
        onSuccess("Kategorie-Reihenfolge gespeichert");
        onRefresh();
      } else {
        onError("Kategorie-Reihenfolge konnte nicht gespeichert werden");
        setOrderedCategories(
          [...pageCategories].sort((a, b) => a.columnPosition - b.columnPosition),
        );
      }
    } catch {
      onError("Kategorie-Reihenfolge konnte nicht gespeichert werden");
      setOrderedCategories(
        [...categories].sort((a, b) => a.columnPosition - b.columnPosition),
      );
    } finally {
      setSavingCategoryOrder(false);
      setDraggingCategoryId(null);
      setCategoryDropIndex(null);
    }
  }

  function handleServiceDrop(
    categoryId: number,
    index: number,
    event?: React.DragEvent,
  ) {
    const transferId = event?.dataTransfer.getData("text/plain");
    const serviceId =
      draggingServiceId ??
      (transferId ? parseDragId(transferId, "service") : null);

    if (serviceId == null || savingServiceOrder || savingCategoryOrder) return;

    const { columns: nextColumns, updates } = moveServiceInBoard(
      columns,
      serviceId,
      categoryId,
      index,
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

  function renderServiceRow(
    column: ServiceBoardColumn<ServiceWithWidget>,
    service: ServiceWithWidget,
    index: number,
  ) {
    return (
      <div
        key={service.id}
        className="relative"
        onDragOver={(event) => {
          if (draggingServiceId == null) return;
          event.preventDefault();
          event.stopPropagation();
          setServiceDropTarget({ categoryId: column.categoryId, index });
        }}
        onDrop={(event) => {
          event.preventDefault();
          event.stopPropagation();
          handleServiceDrop(column.categoryId, index, event);
        }}
      >
        {serviceDropTarget?.categoryId === column.categoryId &&
          serviceDropTarget.index === index && (
            <div className="absolute inset-x-0 -top-1 z-10 h-0.5 rounded-full bg-primary" />
          )}

        <div
          className={cn(
            "group flex items-center gap-2 rounded-lg border border-border/50 bg-background/40 px-2 py-1.5 transition-all duration-200",
            "hover:border-foreground/20 hover:bg-foreground/[0.09] hover:shadow-sm",
            !service.enabled && "opacity-55",
            draggingServiceId === service.id && "opacity-40",
          )}
        >
          <button
            type="button"
            draggable={!savingServiceOrder && !savingCategoryOrder}
            onDragStart={(event) => {
              setDraggingServiceId(service.id);
              setDraggingCategoryId(null);
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData(
                "text/plain",
                `service:${service.id}`,
              );
            }}
            onDragEnd={() => {
              setDraggingServiceId(null);
              setServiceDropTarget(null);
            }}
            className="shrink-0 cursor-grab rounded p-0.5 text-muted-foreground/50 hover:bg-muted/40 hover:text-muted-foreground active:cursor-grabbing"
            aria-label={`${service.name} verschieben`}
          >
            <GripVertical className="size-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onEdit(service)}
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md text-left transition-colors hover:bg-foreground/[0.05]"
          >
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted/30">
              <ServiceIconDisplay
                icon={service.icon}
                name={service.name}
                imageClassName="size-4"
                fallbackClassName="text-[10px]"
              />
            </div>
            <p className="truncate text-xs font-medium leading-tight">
              {service.name}
            </p>
          </button>

          <div
            className="flex shrink-0 items-center gap-1"
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
              className="size-7 shrink-0"
              disabled={savingServiceOrder || savingCategoryOrder}
              onClick={() => onDelete(service.id)}
            >
              <Trash2 className="size-3.5 text-destructive" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  function renderCategorySection(
    column: ServiceBoardColumn<ServiceWithWidget>,
    options?: { isUnsorted?: boolean; categoryIndex?: number },
  ) {
    const isUnsorted = options?.isUnsorted ?? false;
    const categoryIndex = options?.categoryIndex;
    const category = column.category;

    return (
      <section
        key={column.categoryId}
        className={cn(
          "relative flex min-h-[12rem] flex-col rounded-xl border p-3",
          isUnsorted
            ? "border-dashed border-amber-500/35 bg-amber-500/[0.06]"
            : "border-border/50 bg-muted/10",
          !isUnsorted &&
            draggingCategoryId === category.id &&
            "opacity-50",
        )}
        onDragOver={(event) => {
          if (draggingServiceId == null) return;
          event.preventDefault();
          setServiceDropTarget({
            categoryId: column.categoryId,
            index: column.services.length,
          });
        }}
        onDrop={(event) => {
          if (draggingCategoryId != null) return;
          event.preventDefault();
          handleServiceDrop(column.categoryId, column.services.length, event);
        }}
      >
        {!isUnsorted && categoryDropIndex === categoryIndex && (
          <div className="absolute inset-y-2 -left-1.5 z-10 w-0.5 rounded-full bg-primary" />
        )}

        <div className="mb-3 flex items-center gap-2">
          {!isUnsorted && (
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
              aria-label={`Kategorie ${category.name} verschieben`}
            >
              <GripVertical className="size-4" />
            </button>
          )}

          <div className="flex min-w-0 flex-1 items-center gap-2">
            {!isUnsorted && (
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
            )}
            <div className="min-w-0">
              <h3
                className={cn(
                  "truncate text-xs font-semibold tracking-wide uppercase",
                  isUnsorted
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground",
                )}
              >
                {category.name}
              </h3>
              {isUnsorted && (
                <p className="text-[10px] text-muted-foreground">
                  Noch nicht im Dashboard — in eine Kategorie ziehen
                </p>
              )}
            </div>
          </div>

          {!isUnsorted && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => onEditCategory(category)}
              aria-label={`${category.name} Einstellungen`}
            >
              <Settings className="size-3.5" />
            </Button>
          )}

          <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
            {column.services.length}
          </span>

          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 shrink-0 px-2 text-[11px]"
            onClick={() => onAddService(column.categoryId === UNSORTED_CATEGORY_ID ? UNSORTED_CATEGORY_ID : column.categoryId)}
          >
            <Plus className="mr-1 size-3" />
            Dienst
          </Button>
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          {column.services.map((service, index) =>
            renderServiceRow(column, service, index),
          )}

          {column.services.length === 0 && (
            <div
              className={cn(
                "flex min-h-12 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground",
                isUnsorted ? "border-amber-500/30" : "border-border/50",
              )}
            >
              {isUnsorted
                ? "Neue Dienste erscheinen hier"
                : "Dienste hierher ziehen"}
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Kategorien per Drag &amp; Drop anordnen. Dienste in der Liste von oben
        nach unten sortieren — diese Reihenfolge gilt später im Dashboard.
      </p>

      {unsortedColumn && renderCategorySection(unsortedColumn, { isUnsorted: true })}

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
            {renderCategorySection(column, { categoryIndex: index })}
          </div>
        ))}

        {categoryColumns.length === 0 && (
          <div className="col-span-full flex min-h-24 items-center justify-center rounded-xl border border-dashed border-border/50 text-sm text-muted-foreground">
            Noch keine Kategorie — „Neue Kategorie“ oben rechts anlegen
          </div>
        )}
      </div>
    </div>
  );
}
