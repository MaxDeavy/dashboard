"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { useShiftKeyHeld } from "@/hooks/useShiftKeyHeld";
import type { WidgetField, WidgetResult } from "@/lib/widgets/base";
import {
  readHiddenWidgetFields,
  writeHiddenWidgetFields,
} from "@/lib/widget-field-visibility";
import { cn } from "@/lib/utils";

interface ServiceHoverWidgetProps {
  serviceId: number;
  panelOpen: boolean;
}

function fieldKey(field: WidgetField): string {
  return field.fieldId ?? field.label;
}

export function ServiceHoverWidget({
  serviceId,
  panelOpen,
}: ServiceHoverWidgetProps) {
  const t = useTranslations("dashboard");
  const shiftHeld = useShiftKeyHeld();
  const [data, setData] = useState<WidgetResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [hiddenFieldIds, setHiddenFieldIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [stagedHiddenIds, setStagedHiddenIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [isStaging, setIsStaging] = useState(false);
  const prevShiftHeld = useRef(false);

  useEffect(() => {
    setHiddenFieldIds(readHiddenWidgetFields(serviceId));
  }, [serviceId]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const response = await fetch(`/api/widgets/${serviceId}`);
        if (!cancelled && response.ok) {
          setData(await response.json());
        } else if (!cancelled) {
          setData({
            title: "Widget",
            status: "error",
            fields: [],
            error: t("widgetUnavailable"),
          });
        }
      } catch {
        if (!cancelled) {
          setData({
            title: "Widget",
            status: "error",
            fields: [],
            error: t("widgetUnreachable"),
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [serviceId, t]);

  const beginStaging = useCallback(() => {
    setStagedHiddenIds(new Set(hiddenFieldIds));
    setIsStaging(true);
  }, [hiddenFieldIds]);

  const commitStaging = useCallback(() => {
    setHiddenFieldIds(new Set(stagedHiddenIds));
    writeHiddenWidgetFields(serviceId, stagedHiddenIds);
    setIsStaging(false);
  }, [serviceId, stagedHiddenIds]);

  useEffect(() => {
    if (!panelOpen) {
      setIsStaging(false);
      prevShiftHeld.current = shiftHeld;
      return;
    }

    if (shiftHeld && !prevShiftHeld.current) {
      beginStaging();
    }

    if (!shiftHeld && prevShiftHeld.current && isStaging) {
      commitStaging();
    }

    if (shiftHeld && !isStaging) {
      beginStaging();
    }

    prevShiftHeld.current = shiftHeld;
  }, [
    panelOpen,
    shiftHeld,
    isStaging,
    beginStaging,
    commitStaging,
  ]);

  const toggleStagedField = useCallback(
    (id: string) => {
      if (!panelOpen || !shiftHeld) return;

      setStagedHiddenIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    },
    [panelOpen, shiftHeld],
  );

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {t("widgetLoading")}
      </div>
    );
  }

  if (!data) return null;

  const statusColor = {
    ok: "text-emerald-400",
    error: "text-red-400",
    warning: "text-amber-400",
  }[data.status];

  const isFieldEditMode = panelOpen && shiftHeld && isStaging;
  const activeHiddenIds = isFieldEditMode ? stagedHiddenIds : hiddenFieldIds;
  const visibleFields = isFieldEditMode
    ? data.fields
    : data.fields.filter((field) => !hiddenFieldIds.has(fieldKey(field)));

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-base font-semibold leading-tight">{data.title}</h4>
        <span className={`shrink-0 text-xs font-medium ${statusColor}`}>
          {data.status === "ok"
            ? t("widgetOnline")
            : data.status === "warning"
              ? data.error
                ? t("widgetConfig")
                : t("widgetWarning")
              : t("widgetError")}
        </span>
      </div>

      {data.error ? (
        <p className="text-sm text-muted-foreground">{data.error}</p>
      ) : data.displayMode === "iframe" && data.iframeUrl ? (
        <iframe
          src={data.iframeUrl}
          title={data.title}
          className="h-56 w-full rounded-md border border-white/10 bg-black/20"
          loading="lazy"
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      ) : (
        <div className="space-y-2.5">
          {isFieldEditMode ? (
            <p className="text-xs text-primary/80">{t("widgetFieldEditHint")}</p>
          ) : null}

          {visibleFields.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("widgetFieldsAllHidden")}
            </p>
          ) : (
            visibleFields.map((field) => {
              const id = fieldKey(field);
              const markedHidden = isFieldEditMode && activeHiddenIds.has(id);

              return (
                <div
                  key={id}
                  role={isFieldEditMode ? "button" : undefined}
                  tabIndex={isFieldEditMode ? 0 : undefined}
                  onMouseDown={(event) => {
                    if (!isFieldEditMode) return;
                    event.preventDefault();
                  }}
                  onClick={(event) => {
                    if (!isFieldEditMode) return;
                    event.preventDefault();
                    event.stopPropagation();
                    toggleStagedField(id);
                  }}
                  onKeyDown={(event) => {
                    if (!isFieldEditMode) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggleStagedField(id);
                    }
                  }}
                  className={cn(
                    "flex items-start justify-between gap-3 rounded-md text-sm transition-colors",
                    isFieldEditMode &&
                      "cursor-pointer select-none px-1.5 py-1 hover:bg-white/5",
                    markedHidden && "opacity-45",
                  )}
                >
                  <span
                    className={cn(
                      "shrink-0 text-muted-foreground",
                      markedHidden && "line-through",
                    )}
                  >
                    {field.label}
                  </span>
                  <span
                    className={cn(
                      "max-w-[58%] whitespace-pre-line text-right leading-snug",
                      field.highlight && !markedHidden
                        ? "font-semibold text-primary"
                        : "font-medium",
                      markedHidden && "line-through text-muted-foreground",
                    )}
                  >
                    {field.value}
                  </span>
                </div>
              );
            })
          )}

          {isFieldEditMode ? (
            <p className="text-xs text-muted-foreground">
              {t("widgetFieldEditHintEnd")}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
