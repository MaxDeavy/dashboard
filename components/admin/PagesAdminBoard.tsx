"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnableSwitch } from "@/components/admin/EnableSwitch";
import type { Page } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

interface PagesAdminBoardProps {
  pages: Page[];
  onEdit: (page: Page) => void;
  onToggleEnabled: (page: Page, enabled: boolean) => void;
  onDelete: (id: number) => void;
  onRefresh: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  togglingId: number | null;
}

export function PagesAdminBoard({
  pages,
  onEdit,
  onToggleEnabled,
  onDelete,
  onRefresh,
  onSuccess,
  onError,
  togglingId,
}: PagesAdminBoardProps) {
  const t = useTranslations("adminPages");
  const tc = useTranslations("common");
  const [orderedPages, setOrderedPages] = useState(pages);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  const originalPositions = useMemo(
    () => new Map(pages.map((page) => [page.id, page.sortOrder])),
    [pages],
  );

  useEffect(() => {
    setOrderedPages([...pages].sort((a, b) => a.sortOrder - b.sortOrder));
    setDraggingId(null);
    setDropIndex(null);
  }, [pages]);

  async function persistReorder(nextPages: Page[]) {
    const updates = nextPages
      .map((page, index) => ({ id: page.id, sortOrder: index }))
      .filter((update) => originalPositions.get(update.id) !== update.sortOrder);

    if (updates.length === 0) return;

    setSavingOrder(true);
    setOrderedPages(nextPages);

    try {
      const response = await fetch("/api/pages/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });

      if (response.ok) {
        onSuccess(tc("orderSaved"));
        onRefresh();
      } else {
        onError(tc("orderSaveFailed"));
        setOrderedPages(
          [...pages].sort((a, b) => a.sortOrder - b.sortOrder),
        );
      }
    } catch {
      onError(tc("orderSaveFailed"));
      setOrderedPages(
        [...pages].sort((a, b) => a.sortOrder - b.sortOrder),
      );
    } finally {
      setSavingOrder(false);
      setDraggingId(null);
      setDropIndex(null);
    }
  }

  function handleDrop(index: number, event?: React.DragEvent) {
    const transferId = event?.dataTransfer.getData("text/plain");
    const pageId =
      draggingId ?? (transferId ? Number(transferId) : null);

    if (pageId == null || !Number.isFinite(pageId) || savingOrder) return;

    const fromIndex = orderedPages.findIndex((page) => page.id === pageId);
    if (fromIndex < 0) return;

    const next = [...orderedPages];
    const [moved] = next.splice(fromIndex, 1);
    if (!moved) return;

    let insertIndex = Math.min(Math.max(index, 0), next.length);
    if (fromIndex < index) insertIndex = Math.max(insertIndex - 1, 0);
    next.splice(insertIndex, 0, moved);

    void persistReorder(
      next.map((page, sortOrder) => ({ ...page, sortOrder })),
    );
  }

  return (
    <div
      className="space-y-2"
      onDragOver={(event) => {
        if (draggingId == null) return;
        event.preventDefault();
        setDropIndex(orderedPages.length);
      }}
      onDrop={(event) => {
        event.preventDefault();
        handleDrop(orderedPages.length, event);
      }}
    >
      {orderedPages.map((page, index) => (
        <div
          key={page.id}
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
            <div className="absolute inset-x-0 -top-1 z-10 h-0.5 rounded-full bg-primary" />
          )}

          <div
            className={cn(
              "group flex items-center gap-2 rounded-xl border border-border/50 bg-background/40 px-3 py-2.5 transition-all duration-200",
              "hover:border-foreground/20 hover:bg-foreground/[0.09] hover:shadow-sm",
              !page.enabled && "opacity-55",
              draggingId === page.id && "opacity-40",
            )}
          >
            <button
              type="button"
              draggable={!savingOrder}
              onDragStart={(event) => {
                setDraggingId(page.id);
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", String(page.id));
              }}
              onDragEnd={() => {
                setDraggingId(null);
                setDropIndex(null);
              }}
              className="shrink-0 cursor-grab rounded p-0.5 text-muted-foreground/50 hover:bg-muted/40 hover:text-muted-foreground active:cursor-grabbing"
              aria-label={t("movePage", { name: page.name })}
            >
              <GripVertical className="size-4" />
            </button>

            <button
              type="button"
              onClick={() => onEdit(page)}
              className="min-w-0 flex-1 cursor-pointer rounded-md px-2 py-1 text-left transition-colors hover:bg-foreground/[0.05]"
            >
              <p className="truncate text-sm font-semibold">{page.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {t("keyboardShortcut", {
                  key: index < 9 ? String(index + 1) : "—",
                })}
              </p>
            </button>

            <EnableSwitch
              mini
              enabled={page.enabled}
              disabled={togglingId === page.id || savingOrder}
              onChange={(enabled) => onToggleEnabled(page, enabled)}
            />

            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-destructive hover:text-destructive"
              disabled={savingOrder || orderedPages.length <= 1}
              onClick={() => onDelete(page.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      ))}

      {orderedPages.length === 0 && (
        <div className="flex min-h-24 items-center justify-center rounded-xl border border-dashed border-border/50 text-sm text-muted-foreground">
          {t("noPagesYet")}
        </div>
      )}
    </div>
  );
}
