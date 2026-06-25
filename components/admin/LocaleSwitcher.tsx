"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { locales, type Locale } from "@/i18n/config";

interface LocaleSwitcherProps {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function LocaleSwitcher({ onSuccess, onError }: LocaleSwitcherProps) {
  const t = useTranslations("adminSettings");
  const locale = useLocale() as Locale;
  const router = useRouter();

  async function handleChange(next: string | null) {
    if (!next || next === locale) return;

    try {
      const response = await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: next }),
      });

      if (!response.ok) {
        onError?.(t("languageChangeFailed"));
        return;
      }

      onSuccess?.(t("languageChanged"));
      router.refresh();
    } catch {
      onError?.(t("languageChangeFailed"));
    }
  }

  return (
    <div className="space-y-2">
      <Label>{t("language")}</Label>
      <p className="text-xs text-muted-foreground">{t("languageHint")}</p>
      <Select value={locale} onValueChange={handleChange}>
        <SelectTrigger className="w-full sm:w-64">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {locales.map((code) => (
            <SelectItem key={code} value={code}>
              {t(code === "en" ? "languageEn" : "languageDe")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
