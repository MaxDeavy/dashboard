"use client";

import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LocaleSwitcher } from "@/components/admin/LocaleSwitcher";
import { cn } from "@/lib/utils";

interface SettingsLocaleSectionProps {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function SettingsLocaleSection({
  onSuccess,
  onError,
}: SettingsLocaleSectionProps) {
  const t = useTranslations("adminSettings");

  return (
    <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 md:gap-8">
      <LocaleSwitcher onSuccess={onSuccess} onError={onError} />

      <div className="space-y-2">
        <Label>{t("screenshotPreview")}</Label>
        <p className="text-xs text-muted-foreground">
          {t("screenshotPreviewHint")}
        </p>
        <a
          href="/preview"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "outline" }), "inline-flex gap-1.5")}
        >
          <ExternalLink className="size-4" />
          {t("openScreenshotPreview")}
        </a>
      </div>
    </div>
  );
}
