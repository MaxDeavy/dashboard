"use client";

import { useRef, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Download, ImageIcon, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EnableSwitch } from "@/components/admin/EnableSwitch";
import { SettingsLocaleSection } from "@/components/admin/SettingsLocaleSection";
import { IconsSettingsSection } from "@/components/admin/IconsSettingsSection";
import { ThemePresetPicker } from "@/components/admin/ThemePresetPicker";
import { SettingSlider } from "@/components/admin/SettingSlider";
import {
  ICON_FRAME_STYLES,
  MAX_ICON_SIZE,
  MAX_LAYOUT_MAX_WIDTH,
  MAX_LAYOUT_SIDE_INSET,
  MAX_TILE_BORDER_RADIUS,
  MIN_COLUMN_MAX_WIDTH,
  MIN_COLUMN_MIN_WIDTH,
  MAX_COLUMN_GAP,
  MAX_COLUMN_MAX_WIDTH,
  MAX_COLUMN_MIN_WIDTH,
  MAX_COLUMN_PADDING,
  MAX_TILE_SCALE,
  MAX_TILE_SPACING,
  MIN_FONT_SCALE,
  MAX_FONT_SCALE,
  MIN_COLUMN_GAP,
  MIN_COLUMN_PADDING,
  MIN_TILE_SCALE,
  MIN_TILE_SPACING,
  MIN_ICON_SIZE,
  MIN_LAYOUT_MAX_WIDTH,
  MIN_LAYOUT_SIDE_INSET,
  MIN_TILE_BORDER_RADIUS,
  getIconFrameClasses,
  getTileMetrics,
  parseIconFrameStyle,
  type IconFrameStyle,
} from "@/lib/layout-settings";
import {
  applyColorMode,
  FALLBACK_ACCENT_COLOR,
  FALLBACK_BACKGROUND_COLOR,
  FALLBACK_CARD_BASE_COLOR,
  FALLBACK_GLOW_COLOR,
  parseColorMode,
  parseThemePreset,
  type ColorMode,
  type ThemePresetId,
} from "@/lib/theme-presets";
import { isImageIcon } from "@/lib/service-icons";
import {
  SHOW_PAGE_SWITCHER_SETTING,
} from "@/lib/page-storage";
import { LAN_ENABLED_SETTING } from "@/lib/network-mode";
import { DASHBOARD_AUTH_REQUIRED_SETTING } from "@/lib/dashboard-auth-constants";
import { SEARCH_ENABLED_SETTING } from "@/lib/dashboard-search";

interface SettingsAdminProps {
  settings: Record<string, string>;
  onRefresh: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function SettingsAdmin({
  settings,
  onRefresh,
  onSuccess,
  onError,
}: SettingsAdminProps) {
  const t = useTranslations("adminSettings");
  const tc = useTranslations("common");
  const tLayout = useTranslations("layout.iconFrame");
  const [dashboardTitle, setDashboardTitle] = useState(
    settings.dashboard_title ?? "Dashboard",
  );
  const [dashboardSubtitle, setDashboardSubtitle] = useState(
    settings.dashboard_subtitle ?? "Homelab",
  );
  const [themePreset, setThemePreset] = useState<ThemePresetId>(
    parseThemePreset(settings.theme_preset),
  );
  const [colorMode, setColorMode] = useState<ColorMode>(
    parseColorMode(settings.color_mode),
  );
  const [customAccentColor, setCustomAccentColor] = useState(
    settings.accent_color ?? FALLBACK_ACCENT_COLOR,
  );
  const [customCardBaseColor, setCustomCardBaseColor] = useState(
    settings.service_card_base_color ?? FALLBACK_CARD_BASE_COLOR,
  );
  const [customGlowColor, setCustomGlowColor] = useState(
    settings.glow_color ?? FALLBACK_GLOW_COLOR,
  );
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(
    settings.background_image ?? "",
  );
  const [backgroundColor, setBackgroundColor] = useState(
    settings.background_color ?? "",
  );
  const [backgroundUploading, setBackgroundUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialLogo = settings.dashboard_logo ?? "";
  const [logoImageUrl, setLogoImageUrl] = useState(
    isImageIcon(initialLogo) ? initialLogo : "",
  );
  const [logoText, setLogoText] = useState(
    isImageIcon(initialLogo) ? "" : initialLogo,
  );
  const [logoUploading, setLogoUploading] = useState(false);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const [backupBusy, setBackupBusy] = useState(false);

  const [iconSize, setIconSize] = useState(
    Number(settings.icon_size) || 44,
  );
  const [iconFrameStyle, setIconFrameStyle] = useState<IconFrameStyle>(
    parseIconFrameStyle(settings.icon_frame_style),
  );
  const [layoutMaxWidth, setLayoutMaxWidth] = useState(
    Number(settings.layout_max_width) || 0,
  );
  const [layoutSideInset, setLayoutSideInset] = useState(
    Number(settings.layout_side_inset) || 20,
  );
  const [headerFollowsLayout, setHeaderFollowsLayout] = useState(
    settings.layout_header_follows_width !== "false",
  );
  const [footerFollowsLayout, setFooterFollowsLayout] = useState(
    settings.layout_footer_follows_width !== "false",
  );
  const [showPageSwitcher, setShowPageSwitcher] = useState(
    settings[SHOW_PAGE_SWITCHER_SETTING] !== "false",
  );
  const [searchEnabled, setSearchEnabled] = useState(
    settings[SEARCH_ENABLED_SETTING] !== "false",
  );
  const [lanEnabled, setLanEnabled] = useState(
    settings[LAN_ENABLED_SETTING] !== "false",
  );
  const [dashboardAuthRequired, setDashboardAuthRequired] = useState(
    settings[DASHBOARD_AUTH_REQUIRED_SETTING] === "true",
  );
  const [tileBorderRadius, setTileBorderRadius] = useState(
    Number(settings.tile_border_radius) || 12,
  );
  const [tileScale, setTileScale] = useState(
    Number(settings.tile_scale) || 100,
  );
  const [fontScale, setFontScale] = useState(
    Number(settings.font_scale) || 100,
  );
  const [tileSpacing, setTileSpacing] = useState(
    Number(settings.tile_spacing) || 8,
  );
  const [columnGap, setColumnGap] = useState(
    Number(settings.column_gap) || 20,
  );
  const [columnPadding, setColumnPadding] = useState(
    Number(settings.column_padding) || 14,
  );
  const [columnMinWidth, setColumnMinWidth] = useState(
    Number(settings.column_min_width) || 0,
  );
  const [columnMaxWidth, setColumnMaxWidth] = useState(
    Number(settings.column_max_width) || 0,
  );

  const previewMetrics = getTileMetrics({
    iconSize,
    iconFrameStyle,
    tileBorderRadius,
    tileScale,
    fontScale,
    tileSpacing,
    columnGap,
    columnPadding,
    columnMinWidth,
    columnMaxWidth,
    contentMaxWidth: layoutMaxWidth,
    contentSideInset: layoutSideInset,
    headerFollowsLayout,
    footerFollowsLayout,
  });

  useEffect(() => {
    setBackgroundImageUrl(settings.background_image ?? "");
  }, [settings.background_image]);

  useEffect(() => {
    setBackgroundColor(settings.background_color ?? "");
  }, [settings.background_color]);

  useEffect(() => {
    const logo = settings.dashboard_logo ?? "";
    setLogoImageUrl(isImageIcon(logo) ? logo : "");
    setLogoText(isImageIcon(logo) ? "" : logo);
  }, [settings.dashboard_logo]);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/settings/logo", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (response.ok) {
        setLogoImageUrl(data.url);
        setLogoText("");
        onSuccess(t("logoUploaded"));
        onRefresh();
      } else {
        onError(data.error ?? tc("uploadFailed"));
      }
    } catch {
      onError(tc("uploadFailed"));
    } finally {
      setLogoUploading(false);
      if (logoFileInputRef.current) logoFileInputRef.current.value = "";
    }
  }

  async function handleLogoRemove() {
    setLogoUploading(true);

    try {
      const response = await fetch("/api/settings/logo", {
        method: "DELETE",
      });

      if (response.ok) {
        setLogoImageUrl("");
        onSuccess(t("logoRemoved"));
        onRefresh();
      } else {
        onError(t("logoRemoveFailed"));
      }
    } catch {
      onError(t("logoRemoveFailed"));
    } finally {
      setLogoUploading(false);
    }
  }

  async function handleBackgroundUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setBackgroundUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/settings/background", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (response.ok) {
        setBackgroundImageUrl(data.url);
        onSuccess(t("backgroundUploaded"));
        onRefresh();
      } else {
        onError(data.error ?? tc("uploadFailed"));
      }
    } catch {
      onError(tc("uploadFailed"));
    } finally {
      setBackgroundUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleBackgroundRemove() {
    setBackgroundUploading(true);

    try {
      const response = await fetch("/api/settings/background", {
        method: "DELETE",
      });

      if (response.ok) {
        setBackgroundImageUrl("");
        onSuccess(t("backgroundRemoved"));
        onRefresh();
      } else {
        onError(tc("removeFailed"));
      }
    } catch {
      onError(tc("removeFailed"));
    } finally {
      setBackgroundUploading(false);
    }
  }

  function handlePresetChange(presetId: ThemePresetId) {
    setThemePreset(presetId);
  }

  async function handleExportBackup() {
    setBackupBusy(true);
    try {
      const response = await fetch("/api/backup/export");
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? tc("saveFailed"));
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `dashboard-backup-${new Date().toISOString().slice(0, 10)}.zip`;
      link.click();
      URL.revokeObjectURL(url);
      onSuccess(t("backupDownloaded"));
    } catch (error) {
      onError(error instanceof Error ? error.message : tc("saveFailed"));
    } finally {
      setBackupBusy(false);
    }
  }

  async function handleImportBackup(file: File) {
    if (
      !window.confirm(t("confirmImport"))
    ) {
      return;
    }

    setBackupBusy(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/backup/import", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? tc("saveFailed"));
      }

      onSuccess(data.message ?? t("saved"));
      window.location.reload();
    } catch (error) {
      onError(error instanceof Error ? error.message : tc("saveFailed"));
    } finally {
      setBackupBusy(false);
      if (backupInputRef.current) {
        backupInputRef.current.value = "";
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dashboard_title: dashboardTitle,
        dashboard_subtitle: dashboardSubtitle,
        dashboard_logo: logoImageUrl || logoText.trim() || "",
        theme_preset: themePreset,
        color_mode: colorMode,
        accent_color: customAccentColor,
        service_card_base_color: customCardBaseColor,
        glow_color: customGlowColor,
        background_color: backgroundColor.trim(),
        icon_size: iconSize,
        icon_frame_style: iconFrameStyle,
        layout_max_width:
          layoutMaxWidth >= MIN_LAYOUT_MAX_WIDTH ? layoutMaxWidth : 0,
        layout_side_inset: layoutSideInset,
        layout_header_follows_width: headerFollowsLayout ? "true" : "false",
        layout_footer_follows_width: footerFollowsLayout ? "true" : "false",
        [SHOW_PAGE_SWITCHER_SETTING]: showPageSwitcher ? "true" : "false",
        [SEARCH_ENABLED_SETTING]: searchEnabled ? "true" : "false",
        [LAN_ENABLED_SETTING]: lanEnabled ? "true" : "false",
        [DASHBOARD_AUTH_REQUIRED_SETTING]: dashboardAuthRequired
          ? "true"
          : "false",
        tile_border_radius: tileBorderRadius,
        tile_scale: tileScale,
        font_scale: fontScale,
        tile_spacing: tileSpacing,
        column_gap: columnGap,
        column_padding: columnPadding,
        column_min_width:
          columnMinWidth >= MIN_COLUMN_MIN_WIDTH ? columnMinWidth : 0,
        column_max_width:
          columnMaxWidth >= MIN_COLUMN_MAX_WIDTH ? columnMaxWidth : 0,
      }),
    });

    if (response.ok) {
      applyColorMode(colorMode);
      onSuccess(t("saved"));
      onRefresh();
    } else {
      onError(tc("saveFailed"));
    }
  }

  return (
    <>
    <Card className="glass-panel-strong w-full min-w-0 overflow-visible rounded-2xl bg-transparent">
      <CardHeader className="rounded-t-2xl border-b border-border/40 bg-background/85 px-6 py-4">
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="min-w-0">
        <form
          id="settings-admin-form"
          onSubmit={handleSubmit}
          className="w-full min-w-0 space-y-6 pb-24"
        >
          <div className="space-y-3 rounded-xl border border-border/50 bg-muted/10 p-4">
            <SettingsLocaleSection onSuccess={onSuccess} onError={onError} />
          </div>

          <div className="space-y-2">
            <Label>{t("dashboardTitle")}</Label>
            <Input
              value={dashboardTitle}
              onChange={(e) => setDashboardTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("dashboardSubtitle")}</Label>
            <Input
              value={dashboardSubtitle}
              onChange={(e) => setDashboardSubtitle(e.target.value)}
              placeholder={t("subtitlePlaceholder")}
            />
            <p className="text-xs text-muted-foreground">{t("subtitleHint")}</p>
          </div>

          <div className="space-y-3 rounded-xl border border-border/50 bg-muted/10 p-4">
            <div>
              <Label>{t("headerLogo")}</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("headerLogoHint")}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div
                className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/50 bg-background/60 shadow-sm"
              >
                {logoImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoImageUrl}
                    alt=""
                    className="size-9 object-contain"
                  />
                ) : logoText ? (
                  <span className="text-2xl leading-none">{logoText}</span>
                ) : (
                  <ImageIcon className="size-6 text-muted-foreground/50" />
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={logoUploading}
                    onClick={() => logoFileInputRef.current?.click()}
                  >
                    <Upload className="mr-1.5 size-4" />
                    {logoImageUrl ? tc("replace") : t("uploadLogo")}
                  </Button>
                  {(logoImageUrl || logoText) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={logoUploading}
                      onClick={() => {
                        if (logoImageUrl) {
                          void handleLogoRemove();
                        } else {
                          setLogoText("");
                        }
                      }}
                    >
                      <Trash2 className="mr-1.5 size-4" />
                      {tc("remove")}
                    </Button>
                  )}
                </div>
                <Input
                  value={logoText}
                  onChange={(e) => setLogoText(e.target.value)}
                  placeholder={t("logoTextPlaceholder")}
                  disabled={Boolean(logoImageUrl) || logoUploading}
                  maxLength={4}
                />
              </div>
            </div>

            <input
              ref={logoFileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/x-icon,.jpg,.jpeg,.png,.webp,.gif,.svg,.ico"
              className="hidden"
              onChange={handleLogoUpload}
            />
          </div>

          <div className="space-y-3 rounded-xl border border-border/50 bg-muted/10 p-4">
            <div>
              <Label>{t("security")}</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("securityHint")}
              </p>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-lg border border-border/50 bg-background/40 p-3">
              <div className="space-y-1">
                <Label>{t("dashboardAuthRequired")}</Label>
                <p className="text-xs text-muted-foreground">
                  {t("dashboardAuthRequiredHint")}
                </p>
              </div>
              <EnableSwitch
                enabled={dashboardAuthRequired}
                onChange={setDashboardAuthRequired}
                compact
              />
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-border/50 bg-muted/10 p-4">
            <div>
              <Label>{t("dashboardPages")}</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("dashboardPagesHint")}
              </p>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-lg border border-border/50 bg-background/40 p-3">
              <div className="space-y-1">
                <Label>{t("showPageSwitcher")}</Label>
                <p className="text-xs text-muted-foreground">
                  {t("showPageSwitcherHint")}
                </p>
              </div>
              <EnableSwitch
                enabled={showPageSwitcher}
                onChange={setShowPageSwitcher}
                compact
              />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-lg border border-border/50 bg-background/40 p-3">
              <div className="space-y-1">
                <Label>{t("showSearch")}</Label>
                <p className="text-xs text-muted-foreground">
                  {t("showSearchHint")}
                </p>
              </div>
              <EnableSwitch
                enabled={searchEnabled}
                onChange={setSearchEnabled}
                compact
              />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-lg border border-border/50 bg-background/40 p-3">
              <div className="space-y-1">
                <Label>{t("lanToggle")}</Label>
                <p className="text-xs text-muted-foreground">
                  {t("lanToggleHint")}
                </p>
              </div>
              <EnableSwitch
                enabled={lanEnabled}
                onChange={setLanEnabled}
                compact
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("appearance")}</Label>
            <Select
              value={colorMode}
              onValueChange={(value) => setColorMode(parseColorMode(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">{t("darkMode")}</SelectItem>
                <SelectItem value="light">{t("lightMode")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>{t("backgroundImage")}</Label>
            <p className="text-sm text-muted-foreground">{t("backgroundHint")}</p>

            {backgroundImageUrl ? (
              <div className="relative overflow-hidden rounded-xl border border-border/50">
                <div
                  className="aspect-[21/9] w-full bg-cover bg-center bg-no-repeat"
                  style={{
                    backgroundImage: `url(${backgroundImageUrl})`,
                    backgroundColor:
                      backgroundColor.trim() ||
                      FALLBACK_BACKGROUND_COLOR[colorMode],
                  }}
                />
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={backgroundUploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-1.5 size-4" />
                    {tc("replace")}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={backgroundUploading}
                    onClick={handleBackgroundRemove}
                  >
                    <Trash2 className="mr-1.5 size-4" />
                    {tc("remove")}
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                disabled={backgroundUploading}
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/20 px-6 py-10 text-muted-foreground transition-colors hover:border-border hover:bg-muted/30 disabled:opacity-50"
              >
                <ImageIcon className="size-8 opacity-60" />
                <span className="text-sm font-medium">
                  {backgroundUploading ? t("uploading") : t("dropBackground")}
                </span>
                <span className="text-xs opacity-70">{t("maxFileSize")}</span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
              className="hidden"
              onChange={handleBackgroundUpload}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("backgroundColor")}</Label>
            <p className="text-sm text-muted-foreground">
              {t("backgroundColorHint")}
            </p>
            <div className="flex gap-2">
              <Input
                type="color"
                value={
                  backgroundColor.trim() ||
                  FALLBACK_BACKGROUND_COLOR[colorMode]
                }
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="h-10 w-16 cursor-pointer p-1"
              />
              <Input
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                placeholder={FALLBACK_BACKGROUND_COLOR[colorMode]}
              />
              {backgroundColor.trim() ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBackgroundColor("")}
                >
                  {t("backgroundColorReset")}
                </Button>
              ) : null}
            </div>
          </div>

          <div className="space-y-3">
            <Label>{t("themePreset")}</Label>
            <ThemePresetPicker
              value={themePreset}
              onChange={handlePresetChange}
              customColors={{
                accent: customAccentColor,
                cardBase: customCardBaseColor,
                glow: customGlowColor,
              }}
            />
          </div>

          {themePreset === "custom" && (
            <>
              <div className="space-y-2">
                <Label>{t("accentColor")}</Label>
                <p className="text-xs text-muted-foreground">
                  {t("accentColorHint")}
                </p>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={customAccentColor}
                    onChange={(e) => setCustomAccentColor(e.target.value)}
                    className="h-10 w-16 cursor-pointer p-1"
                  />
                  <Input
                    value={customAccentColor}
                    onChange={(e) => setCustomAccentColor(e.target.value)}
                    placeholder={FALLBACK_ACCENT_COLOR}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("glowColor")}</Label>
                <p className="text-xs text-muted-foreground">
                  {t("glowColorHint")}
                </p>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={customGlowColor}
                    onChange={(e) => setCustomGlowColor(e.target.value)}
                    className="h-10 w-16 cursor-pointer p-1"
                  />
                  <Input
                    value={customGlowColor}
                    onChange={(e) => setCustomGlowColor(e.target.value)}
                    placeholder={FALLBACK_GLOW_COLOR}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("defaultTileColor")}</Label>
                <p className="text-xs text-muted-foreground">
                  {t("defaultTileColorHint")}
                </p>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={customCardBaseColor}
                    onChange={(e) => setCustomCardBaseColor(e.target.value)}
                    className="h-10 w-16 cursor-pointer p-1"
                  />
                  <Input
                    value={customCardBaseColor}
                    onChange={(e) => setCustomCardBaseColor(e.target.value)}
                    placeholder={FALLBACK_CARD_BASE_COLOR}
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-5 rounded-xl border border-border/50 bg-muted/10 p-4">
            <div>
              <h3 className="text-sm font-semibold">{t("tilesAndLayout")}</h3>
              <p className="text-xs text-muted-foreground">
                {t("tilesAndLayoutHint")}
              </p>
            </div>

            <div
              className="flex items-center rounded-lg border border-border/40 bg-background/40"
              style={{
                gap: `${previewMetrics.gap}px`,
                padding: `${previewMetrics.paddingY}px ${previewMetrics.paddingX}px`,
                borderRadius: `${tileBorderRadius}px`,
              }}
            >
              <div
                className={`flex shrink-0 items-center justify-center ${getIconFrameClasses(iconFrameStyle)}`}
                style={{
                  width: previewMetrics.iconSize,
                  height: previewMetrics.iconSize,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/jelly.webp"
                  alt=""
                  style={{
                    width: previewMetrics.iconImageSize,
                    height: previewMetrics.iconImageSize,
                  }}
                  className="object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="truncate font-medium"
                  style={{ fontSize: `${previewMetrics.titleSize}px` }}
                >
                  {t("previewService")}
                </p>
                <p
                  className="truncate text-muted-foreground"
                  style={{ fontSize: `${previewMetrics.subtitleSize}px` }}
                >
                  {t("previewSubtitle")}
                </p>
              </div>
            </div>

            <SettingSlider
              label={t("tileSize")}
              description={t("tileSizeHint")}
              value={tileScale}
              min={MIN_TILE_SCALE}
              max={MAX_TILE_SCALE}
              step={5}
              unit="%"
              onChange={setTileScale}
            />

            <SettingSlider
              label={t("fontSize")}
              description={t("fontSizeHint")}
              value={fontScale}
              min={MIN_FONT_SCALE}
              max={MAX_FONT_SCALE}
              step={5}
              unit="%"
              onChange={setFontScale}
            />

            <SettingSlider
              label={t("iconSize")}
              description={t("iconSizeHint")}
              value={iconSize}
              min={MIN_ICON_SIZE}
              max={MAX_ICON_SIZE}
              onChange={setIconSize}
            />

            <SettingSlider
              label={t("tileSpacing")}
              value={tileSpacing}
              min={MIN_TILE_SPACING}
              max={MAX_TILE_SPACING}
              onChange={setTileSpacing}
            />

            <div className="space-y-2">
              <Label>{t("iconFrame")}</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {ICON_FRAME_STYLES.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setIconFrameStyle(style)}
                    className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors ${
                      iconFrameStyle === style
                        ? "border-primary bg-primary/10"
                        : "border-border/50 bg-background/30 hover:bg-background/50"
                    }`}
                  >
                    <div
                      className={`flex size-10 items-center justify-center ${getIconFrameClasses(style)}`}
                    >
                      <div className="size-5 rounded-sm bg-foreground/25" />
                    </div>
                    <span className="text-xs font-medium">
                      {tLayout(style)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <SettingSlider
              label={t("tileCornerRadius")}
              value={tileBorderRadius}
              min={MIN_TILE_BORDER_RADIUS}
              max={MAX_TILE_BORDER_RADIUS}
              onChange={setTileBorderRadius}
            />

            <div className="space-y-4 rounded-lg border border-border/40 bg-background/20 p-3">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {t("columns")}
              </p>

              <SettingSlider
                label={t("columnGap")}
                value={columnGap}
                min={MIN_COLUMN_GAP}
                max={MAX_COLUMN_GAP}
                onChange={setColumnGap}
              />

              <SettingSlider
                label={t("columnPadding")}
                value={columnPadding}
                min={MIN_COLUMN_PADDING}
                max={MAX_COLUMN_PADDING}
                onChange={setColumnPadding}
              />

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <Label>{t("minColumnWidth")}</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant={columnMinWidth === 0 ? "default" : "outline"}
                    onClick={() => setColumnMinWidth(0)}
                  >
                    {tc("automatic")}
                  </Button>
                </div>
                {columnMinWidth > 0 ? (
                  <SettingSlider
                    label={t("widthMin")}
                    value={Math.max(columnMinWidth, MIN_COLUMN_MIN_WIDTH)}
                    min={MIN_COLUMN_MIN_WIDTH}
                    max={MAX_COLUMN_MIN_WIDTH}
                    step={10}
                    onChange={setColumnMinWidth}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={MIN_COLUMN_MIN_WIDTH}
                      max={MAX_COLUMN_MIN_WIDTH}
                      step={10}
                      placeholder={tc("examplePlaceholder", {
                        value: String(MIN_COLUMN_MIN_WIDTH),
                      })}
                      className="w-32"
                      onChange={(e) => {
                        const parsed = Number(e.target.value);
                        if (
                          Number.isFinite(parsed) &&
                          parsed >= MIN_COLUMN_MIN_WIDTH
                        ) {
                          setColumnMinWidth(parsed);
                        }
                      }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {tc("pxWiderColumns")}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <Label>{t("maxColumnWidth")}</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant={columnMaxWidth === 0 ? "default" : "outline"}
                    onClick={() => setColumnMaxWidth(0)}
                  >
                    {tc("automatic")}
                  </Button>
                </div>
                {columnMaxWidth > 0 ? (
                  <SettingSlider
                    label={t("widthMax")}
                    value={Math.max(columnMaxWidth, MIN_COLUMN_MAX_WIDTH)}
                    min={MIN_COLUMN_MAX_WIDTH}
                    max={MAX_COLUMN_MAX_WIDTH}
                    step={10}
                    onChange={setColumnMaxWidth}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={MIN_COLUMN_MAX_WIDTH}
                      max={MAX_COLUMN_MAX_WIDTH}
                      step={10}
                      placeholder={tc("examplePlaceholder", { value: "320" })}
                      className="w-32"
                      onChange={(e) => {
                        const parsed = Number(e.target.value);
                        if (
                          Number.isFinite(parsed) &&
                          parsed >= MIN_COLUMN_MAX_WIDTH
                        ) {
                          setColumnMaxWidth(parsed);
                        }
                      }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {tc("pxNarrowerColumns")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <Label>{t("maxContentWidth")}</Label>
                <Button
                  type="button"
                  size="sm"
                  variant={layoutMaxWidth === 0 ? "default" : "outline"}
                  onClick={() => setLayoutMaxWidth(0)}
                >
                  {tc("automatic")}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("maxContentWidthHint")}
              </p>
              {layoutMaxWidth > 0 ? (
                <SettingSlider
                  label={t("width")}
                  value={Math.max(layoutMaxWidth, MIN_LAYOUT_MAX_WIDTH)}
                  min={MIN_LAYOUT_MAX_WIDTH}
                  max={MAX_LAYOUT_MAX_WIDTH}
                  step={20}
                  onChange={setLayoutMaxWidth}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={MIN_LAYOUT_MAX_WIDTH}
                    max={MAX_LAYOUT_MAX_WIDTH}
                    step={20}
                    placeholder={tc("examplePlaceholder", {
                      value: String(MIN_LAYOUT_MAX_WIDTH),
                    })}
                    className="w-32"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.preventDefault();
                    }}
                    onChange={(e) => {
                      const parsed = Number(e.target.value);
                      if (Number.isFinite(parsed) && parsed >= MIN_LAYOUT_MAX_WIDTH) {
                        setLayoutMaxWidth(parsed);
                      }
                    }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {tc("pxSetWidth")}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 rounded-lg border border-border/50 p-3">
              <div className="space-y-1">
                <Label>{t("headerFollowsWidth")}</Label>
                <p className="text-xs text-muted-foreground">
                  {t("headerFollowsWidthHint")}
                </p>
              </div>
              <EnableSwitch
                enabled={headerFollowsLayout}
                onChange={setHeaderFollowsLayout}
                compact
              />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-lg border border-border/50 p-3">
              <div className="space-y-1">
                <Label>{t("footerFollowsWidth")}</Label>
                <p className="text-xs text-muted-foreground">
                  {t("footerFollowsWidthHint")}
                </p>
              </div>
              <EnableSwitch
                enabled={footerFollowsLayout}
                onChange={setFooterFollowsLayout}
                compact
              />
            </div>

            <SettingSlider
              label={t("sideInset")}
              description={t("sideInsetHint")}
              value={layoutSideInset}
              min={MIN_LAYOUT_SIDE_INSET}
              max={MAX_LAYOUT_SIDE_INSET}
              onChange={setLayoutSideInset}
            />
          </div>
        </form>

        <IconsSettingsSection onSuccess={onSuccess} onError={onError} />

        <div className="mt-6 space-y-3 rounded-xl border border-border/50 bg-muted/10 p-4">
          <div>
            <Label>{t("backup")}</Label>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("backupHint")}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={backupBusy}
              onClick={handleExportBackup}
            >
              <Download className="mr-1.5 size-4" />
              {t("exportBackup")}
            </Button>
            <input
              ref={backupInputRef}
              type="file"
              accept=".zip,application/zip"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  void handleImportBackup(file);
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={backupBusy}
              onClick={() => backupInputRef.current?.click()}
            >
              <Upload className="mr-1.5 size-4" />
              {t("importBackup")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 sm:bottom-8">
      <div className="mx-auto flex w-full max-w-5xl justify-end px-4 pr-6 sm:px-6 sm:pr-8">
        <Button
          type="submit"
          form="settings-admin-form"
          className="pointer-events-auto min-w-36 shadow-[0_12px_40px_rgba(0,0,0,0.35)] ring-1 ring-foreground/10"
        >
          {tc("save")}
        </Button>
      </div>
    </div>
    </>
  );
}
