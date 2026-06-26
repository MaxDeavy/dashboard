"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { NavLink } from "@/lib/db/schema";
import {
  filterChangedNavLinkUpdates,
  moveNavLinkInBar,
} from "@/lib/nav-link-layout";
import {
  getLinkAnchorProps,
  parseLinkOpenMode,
} from "@/lib/link-open-mode";
import { useCtrlKeyHeld } from "@/hooks/useCtrlKeyHeld";
import { cn } from "@/lib/utils";

interface LinkBarRowProps {
  links: NavLink[];
  variant?: "header" | "footer";
  className?: string;
  onLayoutSaved?: () => void;
  layoutEditable?: boolean;
}

export function LinkBarRow({
  links,
  variant = "header",
  className,
  onLayoutSaved,
  layoutEditable = false,
}: LinkBarRowProps) {
  const t = useTranslations("dashboard");
  const ctrlHeld = useCtrlKeyHeld();
  const layoutEditMode = ctrlHeld && layoutEditable;

  const visibleLinks = useMemo(
    () => links.filter((link) => link.enabled),
    [links],
  );

  const [orderedLinks, setOrderedLinks] = useState(visibleLinks);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const originalSortOrders = useMemo(
    () => new Map(links.map((link) => [link.id, link.sortOrder])),
    [links],
  );

  useEffect(() => {
    setOrderedLinks(visibleLinks);
    setDraggingId(null);
    setDropIndex(null);
  }, [visibleLinks]);

  if (visibleLinks.length === 0) return null;

  const isHeader = variant === "header";

  const buttonClassName = cn(
    "inline-flex shrink-0 items-center leading-none transition-colors duration-200",
    isHeader
      ? "rounded-xl border border-foreground/[0.06] bg-foreground/[0.03] px-2 py-0.5 text-xs font-medium text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
      : "rounded-lg border px-3 py-1.5 text-xs font-medium border-foreground/[0.08] bg-foreground/[0.03] text-muted-foreground hover:border-foreground/15 hover:bg-foreground/[0.06] hover:text-foreground",
  );

  async function persistReorder(
    nextLinks: NavLink[],
    updates: ReturnType<typeof moveNavLinkInBar>["updates"],
  ) {
    const changed = filterChangedNavLinkUpdates(updates, originalSortOrders);
    if (changed.length === 0) return;

    setSaving(true);
    setOrderedLinks(nextLinks);

    try {
      const response = await fetch("/api/nav-links/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: changed }),
      });

      if (response.ok) {
        toast.success(t("linksReordered"));
        onLayoutSaved?.();
      } else {
        toast.error(t("linksReorderFailed"));
        setOrderedLinks(visibleLinks);
      }
    } catch {
      toast.error(t("linksReorderFailed"));
      setOrderedLinks(visibleLinks);
    } finally {
      setSaving(false);
      setDraggingId(null);
      setDropIndex(null);
    }
  }

  function handleDrop(index: number, event?: React.DragEvent) {
    const transferId = event?.dataTransfer.getData("text/plain");
    const linkId =
      draggingId ??
      (transferId?.startsWith("navlink:")
        ? Number(transferId.slice(8))
        : null);

    if (
      linkId == null ||
      !Number.isFinite(linkId) ||
      saving ||
      !layoutEditMode
    ) {
      return;
    }

    const { links: nextLinks, updates } = moveNavLinkInBar(
      orderedLinks,
      linkId,
      index,
    );

    void persistReorder(nextLinks, updates);
  }

  return (
    <nav
      className={cn(
        isHeader
          ? "inline-flex w-fit max-w-full shrink-0 flex-wrap items-center gap-1.5"
          : "flex flex-wrap items-center gap-1.5 overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        layoutEditMode && "rounded-lg ring-1 ring-primary/20",
        className,
      )}
      onDragOver={(event) => {
        if (!layoutEditMode || draggingId == null) return;
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
            if (!layoutEditMode || draggingId == null) return;
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
            <div className="absolute inset-y-0 -left-1 z-10 w-0.5 rounded-full bg-primary" />
          )}

          {layoutEditMode ? (
            <div
              draggable={!saving}
              onDragStart={(event) => {
                if (!event.ctrlKey && !ctrlHeld) {
                  event.preventDefault();
                  return;
                }
                setDraggingId(link.id);
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData(
                  "text/plain",
                  `navlink:${link.id}`,
                );
              }}
              onDragEnd={() => {
                setDraggingId(null);
                setDropIndex(null);
              }}
              className={cn(
                buttonClassName,
                "cursor-grab active:cursor-grabbing ring-1 ring-primary/25",
                draggingId === link.id && "opacity-45",
              )}
            >
              {link.icon ? `${link.icon} ` : ""}
              {link.label}
            </div>
          ) : (
            <a
              href={link.url}
              {...getLinkAnchorProps(parseLinkOpenMode(link.linkOpenMode))}
              className={buttonClassName}
            >
              {link.icon ? `${link.icon} ` : ""}
              {link.label}
            </a>
          )}
        </div>
      ))}
    </nav>
  );
}
