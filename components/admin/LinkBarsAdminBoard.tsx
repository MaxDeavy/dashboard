"use client";

import { useEffect, useMemo, useState } from "react";
import { GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnableSwitch } from "@/components/admin/EnableSwitch";
import {
  filterChangedNavLinkUpdates,
  moveNavLinkInBar,
} from "@/lib/nav-link-layout";
import type { NavLink } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

interface LinkBarsAdminBoardProps {
  links: NavLink[];
  onEdit: (link: NavLink) => void;
  onToggleEnabled: (link: NavLink, enabled: boolean) => void;
  onDelete: (id: number) => void;
  onRefresh: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  togglingId: number | null;
}

export function LinkBarsAdminBoard({
  links,
  onEdit,
  onToggleEnabled,
  onDelete,
  onRefresh,
  onSuccess,
  onError,
  togglingId,
}: LinkBarsAdminBoardProps) {
  const [orderedLinks, setOrderedLinks] = useState(links);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  const originalSortOrders = useMemo(
    () => new Map(links.map((link) => [link.id, link.sortOrder])),
    [links],
  );

  useEffect(() => {
    setOrderedLinks([...links].sort((a, b) => a.sortOrder - b.sortOrder));
    setDraggingId(null);
    setDropIndex(null);
  }, [links]);

  async function persistReorder(
    nextLinks: NavLink[],
    updates: ReturnType<typeof moveNavLinkInBar>["updates"],
  ) {
    const changed = filterChangedNavLinkUpdates(updates, originalSortOrders);
    if (changed.length === 0) return;

    setSavingOrder(true);
    setOrderedLinks(nextLinks);

    try {
      const response = await fetch("/api/nav-links/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: changed }),
      });

      if (response.ok) {
        onSuccess("Reihenfolge gespeichert");
        onRefresh();
      } else {
        onError("Reihenfolge konnte nicht gespeichert werden");
        setOrderedLinks([...links].sort((a, b) => a.sortOrder - b.sortOrder));
      }
    } catch {
      onError("Reihenfolge konnte nicht gespeichert werden");
      setOrderedLinks([...links].sort((a, b) => a.sortOrder - b.sortOrder));
    } finally {
      setSavingOrder(false);
      setDraggingId(null);
      setDropIndex(null);
    }
  }

  function handleDrop(index: number, event?: React.DragEvent) {
    const transferId = event?.dataTransfer.getData("text/plain");
    const linkId =
      draggingId ?? (transferId ? Number(transferId) : null);

    if (linkId == null || !Number.isFinite(linkId) || savingOrder) return;

    const { links: nextLinks, updates } = moveNavLinkInBar(
      orderedLinks,
      linkId,
      index,
    );

    void persistReorder(nextLinks, updates);
  }

  const controlButtonClass =
    "flex size-7 shrink-0 items-center justify-center rounded p-0";

  return (
    <div
      className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5"
      onDragOver={(event) => {
        if (draggingId == null) return;
        event.preventDefault();
        setDropIndex(orderedLinks.length);
      }}
      onDrop={(event) => {
        event.preventDefault();
        handleDrop(orderedLinks.length, event);
      }}
    >
      {orderedLinks.map((link, index) => (
        <div
          key={link.id}
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
              "group flex gap-1.5 rounded-lg border border-border/50 bg-background/40 p-2 transition-all duration-200",
              "hover:border-foreground/20 hover:bg-foreground/[0.09] hover:shadow-sm",
              !link.enabled && "opacity-55",
              draggingId === link.id && "opacity-40",
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
                  setDraggingId(link.id);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", String(link.id));
                }}
                onDragEnd={() => {
                  setDraggingId(null);
                  setDropIndex(null);
                }}
                className={cn(
                  controlButtonClass,
                  "cursor-grab text-muted-foreground/50 hover:bg-muted/40 hover:text-muted-foreground active:cursor-grabbing",
                )}
                aria-label={`${link.label} verschieben`}
              >
                <GripVertical className="size-3.5" />
              </button>

              <div className={cn(controlButtonClass, "items-center")}>
                <EnableSwitch
                  mini
                  enabled={link.enabled}
                  disabled={togglingId === link.id || savingOrder}
                  onChange={(enabled) => onToggleEnabled(link, enabled)}
                />
              </div>

              <Button
                variant="ghost"
                size="icon"
                className={cn(controlButtonClass, "text-destructive hover:text-destructive")}
                disabled={savingOrder}
                onClick={() => onDelete(link.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>

            <button
              type="button"
              onClick={() => onEdit(link)}
              className="flex min-h-[5.25rem] min-w-0 flex-1 cursor-pointer items-center justify-center rounded-md px-1 text-center transition-colors hover:bg-foreground/[0.05]"
            >
              <p className="line-clamp-3 text-[11px] font-medium leading-tight">
                {link.label}
              </p>
            </button>
          </div>
        </div>
      ))}

      {orderedLinks.length === 0 && (
        <div className="col-span-full flex min-h-16 items-center justify-center rounded-lg border border-dashed border-border/50 text-xs text-muted-foreground">
          Noch keine Links — „Link hinzufügen“ oben rechts
        </div>
      )}
    </div>
  );
}
