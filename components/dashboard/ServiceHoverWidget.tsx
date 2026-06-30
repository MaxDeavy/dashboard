"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { useIsLoggedIn } from "@/hooks/useIsLoggedIn";
import { useShiftKeyHeld } from "@/hooks/useShiftKeyHeld";
import type { WidgetField, WidgetResult } from "@/lib/widgets/base";
import { nextCycleOption } from "@/lib/widget-extra-config";
import { cn } from "@/lib/utils";

interface ServiceHoverWidgetProps {
  serviceId: number;
  panelOpen: boolean;
}

type WidgetApiResponse = WidgetResult & {
  hiddenFieldIds?: string[];
};

function fieldKey(field: WidgetField): string {
  return field.fieldId ?? field.label;
}

export function ServiceHoverWidget({
  serviceId,
  panelOpen,
}: ServiceHoverWidgetProps) {
  const t = useTranslations("dashboard");
  const shiftHeld = useShiftKeyHeld();
  const isLoggedIn = useIsLoggedIn();
  const [data, setData] = useState<WidgetResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [hiddenFieldIds, setHiddenFieldIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [cyclingFieldId, setCyclingFieldId] = useState<string | null>(null);

  const loadWidget = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/widgets/${serviceId}`);
      if (response.ok) {
        const payload = (await response.json()) as WidgetApiResponse;
        const { hiddenFieldIds: hidden = [], ...widget } = payload;
        setData(widget);
        setHiddenFieldIds(new Set(hidden));
      } else {
        setData({
          title: "Widget",
          status: "error",
          fields: [],
          error: t("widgetUnavailable"),
        });
      }
    } catch {
      setData({
        title: "Widget",
        status: "error",
        fields: [],
        error: t("widgetUnreachable"),
      });
    } finally {
      setLoading(false);
    }
  }, [serviceId, t]);

  useEffect(() => {
    void loadWidget();
  }, [loadWidget]);

  const persistHiddenFields = useCallback(
    async (next: Set<string>) => {
      const response = await fetch(`/api/widgets/${serviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hiddenFieldIds: [...next] }),
      });

      if (!response.ok) {
        throw new Error("Failed to save widget field visibility");
      }
    },
    [serviceId],
  );

  const cycleFieldValue = useCallback(
    async (field: WidgetField) => {
      if (!field.cycle || !isLoggedIn || cyclingFieldId) return;

      const id = fieldKey(field);
      const nextValue = nextCycleOption(field.value, field.cycle.options);
      setCyclingFieldId(id);

      try {
        const response = await fetch(`/api/widgets/${serviceId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            extraConfig: { [field.cycle.configKey]: nextValue },
          }),
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as WidgetApiResponse;
        const { hiddenFieldIds: hidden = [], ...widget } = payload;
        setData(widget);
        setHiddenFieldIds(new Set(hidden));
      } finally {
        setCyclingFieldId(null);
      }
    },
    [cyclingFieldId, isLoggedIn, serviceId],
  );

  const toggleFieldVisibility = useCallback(
    (id: string) => {
      if (!panelOpen || !shiftHeld || !isLoggedIn) return;

      setHiddenFieldIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }

        void persistHiddenFields(next).catch(() => {
          setHiddenFieldIds(prev);
        });

        return next;
      });
    },
    [panelOpen, shiftHeld, isLoggedIn, persistHiddenFields],
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

  const isFieldEditMode = panelOpen && shiftHeld && isLoggedIn;
  const fields = isFieldEditMode
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
          {isFieldEditMode && data.fields.length > 0 ? (
            <p className="text-xs text-primary/80">{t("widgetFieldEditHint")}</p>
          ) : null}

          {fields.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {isFieldEditMode
                ? t("widgetFieldsAllHidden")
                : t("widgetFieldsAllHiddenView")}
            </p>
          ) : (
            fields.map((field) => {
              const id = fieldKey(field);
              const isHidden = isFieldEditMode && hiddenFieldIds.has(id);
              const isCycleable =
                Boolean(field.cycle) && isLoggedIn && !isFieldEditMode;
              const isCycling = cyclingFieldId === id;

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
                    toggleFieldVisibility(id);
                  }}
                  onKeyDown={(event) => {
                    if (!isFieldEditMode) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggleFieldVisibility(id);
                    }
                  }}
                  className={cn(
                    "flex items-start justify-between gap-3 rounded-md text-sm transition-colors",
                    isFieldEditMode &&
                      "cursor-pointer select-none px-1.5 py-1 hover:bg-white/5",
                    isHidden && "opacity-45",
                  )}
                >
                  <span
                    className={cn(
                      "shrink-0 text-muted-foreground",
                      isHidden && "line-through",
                    )}
                  >
                    {field.label}
                  </span>
                  {isCycleable ? (
                    <button
                      type="button"
                      title={t("widgetFieldCycleHint")}
                      disabled={isCycling}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        void cycleFieldValue(field);
                      }}
                      className={cn(
                        "max-w-[58%] whitespace-pre-line text-right leading-snug font-medium",
                        "rounded px-1 -mx-1 transition-colors",
                        "hover:bg-white/10 hover:text-primary",
                        "disabled:opacity-60",
                        field.highlight && !isHidden && "text-primary font-semibold",
                        isHidden && "line-through text-muted-foreground",
                      )}
                    >
                      {isCycling ? (
                        <Loader2 className="ml-auto size-3.5 animate-spin" />
                      ) : (
                        field.value
                      )}
                    </button>
                  ) : (
                    <span
                      className={cn(
                        "max-w-[58%] whitespace-pre-line text-right leading-snug",
                        field.highlight && !isHidden
                          ? "font-semibold text-primary"
                          : "font-medium",
                        isHidden && "line-through text-muted-foreground",
                      )}
                    >
                      {field.value}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
