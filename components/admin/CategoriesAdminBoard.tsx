"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnableSwitch } from "@/components/admin/EnableSwitch";
import {
  filterChangedCategoryUpdates,
  moveDashboardColumn,
  type DashboardColumn,
} from "@/lib/dashboard-layout";
import type { Category } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

interface CategoriesAdminBoardProps {
  categories: Category[];
  defaultCardColor: string;
  onEdit: (category: Category) => void;
  onToggleEnabled: (category: Category, enabled: boolean) => void;
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

export function CategoriesAdminBoard({
  categories,
  defaultCardColor,
  onEdit,
  onToggleEnabled,
  onDelete,
  onRefresh,
  onSuccess,
  onError,
  togglingId,
}: CategoriesAdminBoardProps) {
  const t = useTranslations("adminCategories");
  const tc = useTranslations("common");
  const [orderedCategories, setOrderedCategories] = useState(categories);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  const originalPositions = useMemo(
    () => new Map(categories.map((category) => [category.id, category.columnPosition])),
    [categories],
  );

  useEffect(() => {
    setOrderedCategories(
      [...categories].sort((a, b) => a.columnPosition - b.columnPosition),
    );
    setDraggingId(null);
    setDropIndex(null);
  }, [categories]);

  async function persistReorder(
    nextCategories: Category[],
    updates: ReturnType<typeof moveDashboardColumn>["updates"],
  ) {
    const changed = filterChangedCategoryUpdates(updates, originalPositions);
    if (changed.length === 0) return;

    setSavingOrder(true);
    setOrderedCategories(nextCategories);

    try {
      const response = await fetch("/api/categories/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: changed }),
      });

      if (response.ok) {
        onSuccess(tc("orderSaved"));
        onRefresh();
      } else {
        onError(tc("orderSaveFailed"));
        setOrderedCategories(
          [...categories].sort((a, b) => a.columnPosition - b.columnPosition),
        );
      }
    } catch {
      onError(tc("orderSaveFailed"));
      setOrderedCategories(
        [...categories].sort((a, b) => a.columnPosition - b.columnPosition),
      );
    } finally {
      setSavingOrder(false);
      setDraggingId(null);
      setDropIndex(null);
    }
  }

  function handleDrop(index: number, event?: React.DragEvent) {
    const transferId = event?.dataTransfer.getData("text/plain");
    const categoryId =
      draggingId ?? (transferId ? Number(transferId) : null);

    if (categoryId == null || !Number.isFinite(categoryId) || savingOrder) return;

    const { columns: nextColumns, updates } = moveDashboardColumn(
      toBoardColumns(orderedCategories),
      categoryId,
      index,
    );

    void persistReorder(fromBoardColumns(nextColumns), updates);
  }

  const controlButtonClass =
    "flex size-7 shrink-0 items-center justify-center rounded p-0";

  return (
    <div
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      onDragOver={(event) => {
        if (draggingId == null) return;
        event.preventDefault();
        setDropIndex(orderedCategories.length);
      }}
      onDrop={(event) => {
        event.preventDefault();
        handleDrop(orderedCategories.length, event);
      }}
    >
      {orderedCategories.map((category, index) => (
        <div
          key={category.id}
          className="relative"
          onDragOver={(event) => {
            if (draggingId == null) return;
            event.preventDefault();
            event.stopPropagation();
            setDropIndex(index);
          }}
          onDrop={(event) => {
            event.preventDefault();
            event.stopPropagation();
            handleDrop(index, event);
          }}
        >
          {dropIndex === index && (
            <div className="absolute inset-y-2 -left-1.5 z-10 w-0.5 rounded-full bg-primary" />
          )}

          <div
            className={cn(
              "group flex min-h-[7.5rem] gap-2 rounded-xl border border-border/50 bg-background/40 p-2 transition-all duration-200",
              "hover:border-foreground/20 hover:bg-foreground/[0.09] hover:shadow-sm",
              !category.enabled && "opacity-55",
              draggingId === category.id && "opacity-40",
            )}
          >
            <div
              className="flex shrink-0 flex-col items-center gap-1"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                draggable={!savingOrder}
                onDragStart={(event) => {
                  setDraggingId(category.id);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", String(category.id));
                }}
                onDragEnd={() => {
                  setDraggingId(null);
                  setDropIndex(null);
                }}
                className={cn(
                  controlButtonClass,
                  "cursor-grab text-muted-foreground/50 hover:bg-muted/40 hover:text-muted-foreground active:cursor-grabbing",
                )}
                aria-label={t("moveCategory", { name: category.name })}
              >
                <GripVertical className="size-3.5" />
              </button>

              <div className={cn(controlButtonClass, "items-center")}>
                <EnableSwitch
                  mini
                  enabled={category.enabled}
                  disabled={togglingId === category.id || savingOrder}
                  onChange={(enabled) => onToggleEnabled(category, enabled)}
                />
              </div>

              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  controlButtonClass,
                  "text-destructive hover:text-destructive",
                )}
                disabled={savingOrder}
                onClick={() => onDelete(category.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>

            <button
              type="button"
              onClick={() => onEdit(category)}
              className="flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md px-2 text-center transition-colors hover:bg-foreground/[0.05]"
            >
              <span
                className={cn(
                  "size-2.5 rounded-full shadow-[0_0_10px_currentColor]",
                  !category.color && "opacity-70",
                )}
                style={{
                  backgroundColor: category.color ?? defaultCardColor,
                  color: category.color ?? defaultCardColor,
                }}
              />
              <p className="line-clamp-3 text-sm font-semibold leading-tight">
                {category.name}
              </p>
            </button>
          </div>
        </div>
      ))}

      {orderedCategories.length === 0 && (
        <div className="col-span-full flex min-h-24 items-center justify-center rounded-xl border border-dashed border-border/50 text-sm text-muted-foreground">
          {t("noCategoriesYet")}
        </div>
      )}
    </div>
  );
}
