"use client";

import { useRef, useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ServiceIconDisplay } from "@/components/ServiceIconDisplay";
import {
  BUNDLED_ICON_OPTIONS,
  isCustomUploadedIcon,
} from "@/lib/service-icons";

interface ServiceIconFieldProps {
  value: string;
  onChange: (value: string) => void;
  serviceId?: number | null;
  onUploadComplete?: (url: string) => void;
  onError?: (msg: string) => void;
}

export function ServiceIconField({
  value,
  onChange,
  serviceId,
  onUploadComplete,
  onError,
}: ServiceIconFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !serviceId) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`/api/services/${serviceId}/icon`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (response.ok) {
        onChange(data.url);
        onUploadComplete?.(data.url);
      } else {
        onError?.(data.error ?? "Upload fehlgeschlagen");
      }
    } catch {
      onError?.("Upload fehlgeschlagen");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemoveUpload() {
    if (!serviceId || !isCustomUploadedIcon(value)) {
      onChange("");
      return;
    }

    setUploading(true);
    try {
      const response = await fetch(`/api/services/${serviceId}/icon`, {
        method: "DELETE",
      });

      if (response.ok) {
        onChange("");
        onUploadComplete?.("");
      } else {
        onError?.("Entfernen fehlgeschlagen");
      }
    } catch {
      onError?.("Entfernen fehlgeschlagen");
    } finally {
      setUploading(false);
    }
  }

  const presetValue = BUNDLED_ICON_OPTIONS.some((option) => option.url === value)
    ? value
    : "";

  return (
    <div className="space-y-3">
      <Label>Icon</Label>

      <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/10 p-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-background/60 ring-1 ring-border/40">
          <ServiceIconDisplay
            icon={value}
            name="?"
            imageClassName="size-6"
            fallbackClassName="text-sm"
          />
        </div>
        <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
          {value || "Kein Icon gesetzt"}
        </p>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={uploading}
            onClick={() => {
              if (isCustomUploadedIcon(value) && serviceId) {
                void handleRemoveUpload();
              } else {
                onChange("");
              }
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Vorlage</Label>
        <Select
          value={presetValue || undefined}
          onValueChange={(url) => {
            if (url) onChange(url);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Icon aus Vorlagen wählen…" />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {BUNDLED_ICON_OPTIONS.map((option) => (
              <SelectItem key={option.url} value={option.url}>
                <span className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={option.url}
                    alt=""
                    className="size-4 rounded object-contain"
                  />
                  {option.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">URL</Label>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://… oder /assets/icon.png"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Eigenes Bild hochladen</Label>
        {serviceId ? (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 size-4" />
              {uploading ? "Wird hochgeladen…" : "Datei wählen"}
            </Button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Upload ist nach dem ersten Speichern des Dienstes möglich.
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          JPG, PNG, WebP, GIF, SVG oder ICO, maximal 5 MB.
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/x-icon,.jpg,.jpeg,.png,.webp,.gif,.svg,.ico"
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  );
}
