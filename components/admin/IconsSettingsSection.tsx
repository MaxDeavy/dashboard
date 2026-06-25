"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Pencil, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CustomIconEntry {
  filename: string;
  label: string;
  url: string;
}

interface IconsSettingsSectionProps {
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function IconsSettingsSection({
  onSuccess,
  onError,
}: IconsSettingsSectionProps) {
  const t = useTranslations("adminSettings");
  const tc = useTranslations("common");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [icons, setIcons] = useState<CustomIconEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importLabel, setImportLabel] = useState("");
  const [uploadLabel, setUploadLabel] = useState("");
  const [renameTarget, setRenameTarget] = useState<CustomIconEntry | null>(null);
  const [renameLabel, setRenameLabel] = useState("");

  const loadIcons = useCallback(async () => {
    try {
      const response = await fetch("/api/icons");
      if (response.ok) {
        setIcons(await response.json());
      }
    } catch {
      onError(t("iconsLoadFailed"));
    } finally {
      setLoading(false);
    }
  }, [onError, t]);

  useEffect(() => {
    void loadIcons();
  }, [loadIcons]);

  async function handleImportUrl() {
    if (!importUrl.trim()) return;

    setBusy(true);
    try {
      const response = await fetch("/api/icons/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: importUrl.trim(),
          label: importLabel.trim() || undefined,
        }),
      });
      const data = await response.json();

      if (response.ok) {
        setImportUrl("");
        setImportLabel("");
        await loadIcons();
        onSuccess(t("iconImported"));
      } else {
        onError(data.error ?? t("iconImportFailed"));
      }
    } catch {
      onError(t("iconImportFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setBusy(true);
    const formData = new FormData();
    formData.append("file", file);
    if (uploadLabel.trim()) {
      formData.append("label", uploadLabel.trim());
    }

    try {
      const response = await fetch("/api/icons/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (response.ok) {
        setUploadLabel("");
        await loadIcons();
        onSuccess(t("iconUploaded"));
      } else {
        onError(data.error ?? tc("uploadFailed"));
      }
    } catch {
      onError(tc("uploadFailed"));
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(icon: CustomIconEntry) {
    if (!window.confirm(t("iconDeleteConfirm", { name: icon.label }))) {
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(
        `/api/icons/${encodeURIComponent(icon.filename)}`,
        { method: "DELETE" },
      );
      const data = await response.json();

      if (response.ok) {
        await loadIcons();
        onSuccess(t("iconDeleted"));
      } else {
        onError(data.error ?? t("iconDeleteFailed"));
      }
    } catch {
      onError(t("iconDeleteFailed"));
    } finally {
      setBusy(false);
    }
  }

  function openRename(icon: CustomIconEntry) {
    setRenameTarget(icon);
    setRenameLabel(icon.label);
  }

  async function handleRenameSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!renameTarget) return;

    setBusy(true);
    try {
      const response = await fetch("/api/icons/label", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: renameTarget.filename,
          label: renameLabel,
        }),
      });
      const data = await response.json();

      if (response.ok) {
        setRenameTarget(null);
        await loadIcons();
        onSuccess(t("iconRenamed"));
      } else {
        onError(data.error ?? t("iconRenameFailed"));
      }
    } catch {
      onError(t("iconRenameFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 space-y-4 rounded-xl border border-border/50 bg-muted/10 p-4">
      <div>
        <Label>{t("icons")}</Label>
        <p className="mt-1 text-xs text-muted-foreground">{t("iconsHint")}</p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">{t("iconImportUrl")}</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            placeholder="https://…"
            disabled={busy}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleImportUrl();
              }
            }}
          />
          <Input
            value={importLabel}
            onChange={(e) => setImportLabel(e.target.value)}
            placeholder={t("iconDisplayName")}
            disabled={busy}
            className="sm:max-w-48"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleImportUrl();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            disabled={busy || !importUrl.trim()}
            onClick={() => void handleImportUrl()}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : t("iconImport")}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">{t("iconUpload")}</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={uploadLabel}
            onChange={(e) => setUploadLabel(e.target.value)}
            placeholder={t("iconDisplayName")}
            disabled={busy}
            className="sm:max-w-48"
          />
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mr-1.5 size-4" />
            {t("iconChooseFile")}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{t("iconFileTypes")}</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/x-icon,.jpg,.jpeg,.png,.webp,.gif,.svg,.ico"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          {tc("loading")}
        </div>
      ) : icons.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("iconsEmpty")}</p>
      ) : (
        <div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border border-border/50 bg-background/40 p-1">
          {icons.map((icon) => (
            <div
              key={icon.filename}
              className="flex items-center gap-2 rounded-md px-2 py-1.5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={icon.url}
                alt=""
                className="size-8 shrink-0 rounded object-contain"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{icon.label}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {icon.filename}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                title={t("iconRename")}
                disabled={busy}
                onClick={() => openRename(icon)}
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-destructive hover:text-destructive"
                title={tc("remove")}
                disabled={busy}
                onClick={() => void handleDelete(icon)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={renameTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRenameTarget(null);
        }}
      >
        <DialogContent className="glass-panel-strong max-w-sm border-white/10 sm:max-w-sm">
          <form onSubmit={handleRenameSubmit}>
            <DialogHeader>
              <DialogTitle>{t("iconRename")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label htmlFor="settings-icon-rename">{t("iconDisplayName")}</Label>
              <Input
                id="settings-icon-rename"
                value={renameLabel}
                onChange={(e) => setRenameLabel(e.target.value)}
                autoFocus
                required
              />
              {renameTarget && (
                <p className="text-xs text-muted-foreground">
                  {t("iconFilenameHint", { filename: renameTarget.filename })}
                </p>
              )}
            </div>
            <DialogFooter className="gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRenameTarget(null)}
              >
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={busy || !renameLabel.trim()}>
                {busy ? tc("loading") : tc("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
