"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import type { WidgetResult } from "@/lib/widgets/base";

interface ServiceHoverWidgetProps {
  serviceId: number;
}

export function ServiceHoverWidget({ serviceId }: ServiceHoverWidgetProps) {
  const t = useTranslations("dashboard");
  const [data, setData] = useState<WidgetResult | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{data.title}</h4>
        <span className={`text-xs font-medium ${statusColor}`}>
          {data.status === "ok"
            ? t("widgetOnline")
            : data.status === "warning"
              ? t("widgetConfig")
              : t("widgetError")}
        </span>
      </div>

      {data.error ? (
        <p className="text-xs text-muted-foreground">{data.error}</p>
      ) : (
        <div className="space-y-2">
          {data.fields.map((field) => (
            <div
              key={field.label}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-muted-foreground">{field.label}</span>
              <span
                className={
                  field.highlight
                    ? "font-semibold text-primary"
                    : "font-medium"
                }
              >
                {field.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
