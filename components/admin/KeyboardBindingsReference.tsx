"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function ShortcutKey({ children }: { children: ReactNode }) {
  return (
    <kbd
      className={cn(
        "inline-flex min-h-5 min-w-5 items-center justify-center rounded border border-border/60",
        "bg-muted/40 px-1.5 font-mono text-[11px] font-medium leading-none text-foreground",
      )}
    >
      {children}
    </kbd>
  );
}

export function KeyboardBindingsReference() {
  const t = useTranslations("adminSettings");

  const bindings = [
    { keys: ["D"], label: t("keyBindingsDashboard") },
    { keys: ["S", "E"], label: t("keyBindingsSettings") },
    { keys: [t("keyBindingsPagesKey")], label: t("keyBindingsPages") },
  ];

  return (
    <div className="space-y-2">
      <Label>{t("keyBindings")}</Label>
      <p className="text-xs text-muted-foreground">{t("keyBindingsHint")}</p>
      <dl className="space-y-1.5">
        {bindings.map((binding) => (
          <div key={binding.label} className="flex items-center gap-2 text-sm">
            <dt className="flex shrink-0 items-center gap-1">
              {binding.keys.map((key, index) => (
                <span key={key} className="inline-flex items-center gap-1">
                  {index > 0 && (
                    <span className="text-[10px] text-muted-foreground">/</span>
                  )}
                  <ShortcutKey>{key}</ShortcutKey>
                </span>
              ))}
            </dt>
            <dd className="min-w-0 truncate text-xs text-muted-foreground">
              {binding.label}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
