"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LinkBarsAdminBoard } from "@/components/admin/LinkBarsAdminBoard";
import { DiscardChangesDialog } from "@/components/admin/DiscardChangesDialog";
import { EnableSwitch } from "@/components/admin/EnableSwitch";
import { LinkOpenModeSelect } from "@/components/admin/LinkOpenModeSelect";
import type { LinkBarWithLinks, LinkZone, NavLink } from "@/lib/db/schema";
import {
  DEFAULT_LINK_OPEN_MODE,
  parseLinkOpenMode,
  type LinkOpenMode,
} from "@/lib/link-open-mode";
import { useDiscardConfirm } from "@/hooks/useDiscardConfirm";
import { cn } from "@/lib/utils";

interface LinkBarsData {
  headers: LinkBarWithLinks[];
  footers: LinkBarWithLinks[];
}

interface LinkBarsAdminProps {
  data: LinkBarsData;
  onRefresh: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function LinkBarsAdmin({
  data,
  onRefresh,
  onSuccess,
  onError,
}: LinkBarsAdminProps) {
  return (
    <div className="space-y-6">
      <LinkZoneSection
        zone="header"
        title="Header-Leisten"
        description="Quick-Links oben im Dashboard — mehrere Zeilen möglich"
        bars={data.headers}
        onRefresh={onRefresh}
        onSuccess={onSuccess}
        onError={onError}
      />
      <LinkZoneSection
        zone="footer"
        title="Footer-Leisten"
        description="Links am unteren Dashboard-Rand — mehrere Zeilen möglich"
        bars={data.footers}
        onRefresh={onRefresh}
        onSuccess={onSuccess}
        onError={onError}
      />
    </div>
  );
}

function LinkZoneSection({
  zone,
  title,
  description,
  bars,
  onRefresh,
  onSuccess,
  onError,
}: {
  zone: LinkZone;
  title: string;
  description: string;
  bars: LinkBarWithLinks[];
  onRefresh: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  async function addBar() {
    const response = await fetch("/api/link-bars", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        zone,
        sortOrder: bars.length,
        title: `${title} ${bars.length + 1}`,
      }),
    });
    if (response.ok) {
      onSuccess("Leiste erstellt");
      onRefresh();
    } else {
      onError("Fehler beim Erstellen");
    }
  }

  async function deleteBar(id: number) {
    if (!confirm("Leiste und alle Links darin wirklich löschen?")) return;
    const response = await fetch(`/api/link-bars/${id}`, { method: "DELETE" });
    if (response.ok) {
      onSuccess("Leiste gelöscht");
      onRefresh();
    } else {
      onError("Fehler beim Löschen");
    }
  }

  return (
    <Card className="glass-panel-strong rounded-2xl border-white/10 bg-transparent">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Button size="sm" onClick={addBar}>
          <Plus className="mr-2 size-4" />
          Leiste hinzufügen
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Kachel anklicken zum Bearbeiten. Per Drag &amp; Drop innerhalb einer
          Leiste sortieren.
        </p>

        {bars.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Noch keine Leiste — klicke auf &quot;Leiste hinzufügen&quot;.
          </p>
        )}

        {bars.map((bar, index) => (
          <BarEditor
            key={bar.id}
            bar={bar}
            zone={zone}
            hideBarTitle={zone === "header" && index === 0}
            onRefresh={onRefresh}
            onSuccess={onSuccess}
            onError={onError}
            onDelete={() => deleteBar(bar.id)}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function BarEditor({
  bar,
  zone,
  hideBarTitle,
  onRefresh,
  onSuccess,
  onError,
  onDelete,
}: {
  bar: LinkBarWithLinks;
  zone: LinkZone;
  hideBarTitle: boolean;
  onRefresh: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  onDelete: () => void;
}) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<NavLink | null>(null);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [icon, setIcon] = useState("");
  const [linkOpenMode, setLinkOpenMode] = useState<LinkOpenMode>(
    DEFAULT_LINK_OPEN_MODE,
  );
  const [barTitle, setBarTitle] = useState(bar.title ?? "");
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [togglingBar, setTogglingBar] = useState(false);
  const discardConfirm = useDiscardConfirm();
  const [linkSnapshot, setLinkSnapshot] = useState("");

  useEffect(() => {
    if (!linkOpen) return;
    setLinkSnapshot(
      JSON.stringify({ label, url, icon, linkOpenMode }),
    );
  }, [linkOpen]);

  const isLinkDirty =
    linkOpen &&
    JSON.stringify({ label, url, icon, linkOpenMode }) !== linkSnapshot;

  function resetLinkForm() {
    setEditingLink(null);
    setLabel("");
    setUrl("");
    setIcon("");
    setLinkOpenMode(DEFAULT_LINK_OPEN_MODE);
  }

  function openNewLink() {
    resetLinkForm();
    setLinkOpen(true);
  }

  function openEditLink(link: NavLink) {
    setEditingLink(link);
    setLabel(link.label);
    setUrl(link.url);
    setIcon(link.icon ?? "");
    setLinkOpenMode(parseLinkOpenMode(link.linkOpenMode));
    setLinkOpen(true);
  }

  async function saveBarTitle() {
    const response = await fetch(`/api/link-bars/${bar.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sortOrder: bar.sortOrder,
        title: barTitle || null,
        enabled: bar.enabled,
      }),
    });
    if (response.ok) {
      onSuccess("Titel gespeichert");
      onRefresh();
    } else {
      onError("Titel konnte nicht gespeichert werden");
    }
  }

  async function handleLinkSubmit(e: React.FormEvent) {
    e.preventDefault();

    const sortOrder = editingLink
      ? editingLink.sortOrder
      : bar.links.reduce((max, link) => Math.max(max, link.sortOrder), -1) + 1;

    const body = {
      barId: bar.id,
      label,
      url,
      icon: icon || null,
      sortOrder,
      enabled: editingLink?.enabled ?? true,
      linkOpenMode,
    };
    const apiUrl = editingLink
      ? `/api/nav-links/${editingLink.id}`
      : "/api/nav-links";
    const method = editingLink ? "PUT" : "POST";

    const response = await fetch(apiUrl, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      onSuccess(editingLink ? "Link aktualisiert" : "Link erstellt");
      setLinkOpen(false);
      resetLinkForm();
      onRefresh();
    } else {
      onError("Fehler beim Speichern");
    }
  }

  async function deleteLink(id: number) {
    if (!confirm("Link löschen?")) return;
    const response = await fetch(`/api/nav-links/${id}`, { method: "DELETE" });
    if (response.ok) {
      onSuccess("Link gelöscht");
      onRefresh();
    } else {
      onError("Fehler beim Löschen");
    }
  }

  async function handleToggleBarEnabled(enabled: boolean) {
    setTogglingBar(true);

    try {
      const response = await fetch(`/api/link-bars/${bar.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sortOrder: bar.sortOrder,
          title: bar.title,
          enabled,
        }),
      });

      if (response.ok) {
        onSuccess(enabled ? "Leiste aktiviert" : "Leiste ausgeblendet");
        onRefresh();
      } else {
        onError("Status konnte nicht gespeichert werden");
      }
    } catch {
      onError("Status konnte nicht gespeichert werden");
    } finally {
      setTogglingBar(false);
    }
  }

  async function handleToggleEnabled(link: NavLink, enabled: boolean) {
    setTogglingId(link.id);

    try {
      const response = await fetch(`/api/nav-links/${link.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barId: link.barId,
          label: link.label,
          url: link.url,
          icon: link.icon,
          sortOrder: link.sortOrder,
          enabled,
          linkOpenMode: link.linkOpenMode ?? DEFAULT_LINK_OPEN_MODE,
        }),
      });

      if (response.ok) {
        onSuccess(enabled ? "Link aktiviert" : "Link ausgeblendet");
        onRefresh();
      } else {
        onError("Status konnte nicht gespeichert werden");
      }
    } catch {
      onError("Status konnte nicht gespeichert werden");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <section
      className={cn(
        "rounded-xl border border-border/50 bg-muted/10 p-3",
        !bar.enabled && "opacity-55",
      )}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        {!hideBarTitle && (
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <Input
              value={barTitle}
              onChange={(e) => setBarTitle(e.target.value)}
              placeholder={`Leiste ${bar.sortOrder + 1}`}
              className="h-8 max-w-xs text-sm"
            />
            <Button variant="outline" size="sm" onClick={saveBarTitle}>
              Titel speichern
            </Button>
          </div>
        )}

        <div
          className={cn(
            "flex items-center gap-2",
            hideBarTitle && "ml-auto w-full justify-end sm:w-auto",
          )}
        >
          <EnableSwitch
            enabled={bar.enabled}
            disabled={togglingBar}
            compact
            onChange={handleToggleBarEnabled}
          />
          <Button size="sm" variant="outline" onClick={openNewLink}>
            <Plus className="mr-1 size-3" />
            Link
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      </div>

      {!hideBarTitle && (
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {barTitle || `Leiste ${bar.sortOrder + 1}`}
          </h3>
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {bar.links.length}
          </span>
        </div>
      )}

      {hideBarTitle && zone === "header" && (
        <div className="mb-2 flex items-center justify-end gap-2">
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {bar.links.length} Link{bar.links.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      <LinkBarsAdminBoard
        links={bar.links}
        onEdit={openEditLink}
        onToggleEnabled={handleToggleEnabled}
        onDelete={deleteLink}
        onRefresh={onRefresh}
        onSuccess={onSuccess}
        onError={onError}
        togglingId={togglingId}
      />

      <Dialog
        open={linkOpen}
        onOpenChange={(nextOpen) => {
          if (nextOpen) {
            setLinkOpen(true);
            return;
          }
          discardConfirm.requestClose(isLinkDirty, () => {
            setLinkOpen(false);
            resetLinkForm();
          });
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLink ? "Link bearbeiten" : "Neuer Link"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLinkSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Icon (optional)</Label>
              <Input
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="Emoji oder Bild-URL"
              />
            </div>
            <div className="space-y-2">
              <Label>Link-Ziel</Label>
              <LinkOpenModeSelect
                value={linkOpenMode}
                onChange={setLinkOpenMode}
              />
            </div>
            <DialogFooter>
              <Button type="submit">
                {editingLink ? "Speichern" : "Link anlegen"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <DiscardChangesDialog
        open={discardConfirm.open}
        onConfirm={discardConfirm.confirmDiscard}
        onCancel={discardConfirm.cancelDiscard}
      />
    </section>
  );
}
