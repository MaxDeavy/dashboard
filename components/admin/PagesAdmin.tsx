"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EnableSwitch } from "@/components/admin/EnableSwitch";
import { PagesAdminBoard } from "@/components/admin/PagesAdminBoard";
import { DiscardChangesDialog } from "@/components/admin/DiscardChangesDialog";
import type { Page } from "@/lib/db/schema";
import { useDiscardConfirm } from "@/hooks/useDiscardConfirm";

interface PagesAdminProps {
  pages: Page[];
  onRefresh: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function PagesAdmin({
  pages,
  onRefresh,
  onSuccess,
  onError,
}: PagesAdminProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Page | null>(null);
  const [name, setName] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const discardConfirm = useDiscardConfirm();
  const [formSnapshot, setFormSnapshot] = useState("");

  useEffect(() => {
    if (!open) return;
    setFormSnapshot(JSON.stringify({ name, enabled }));
  }, [open]);

  const isDirty =
    open && JSON.stringify({ name, enabled }) !== formSnapshot;

  function resetForm() {
    setEditing(null);
    setName("");
    setEnabled(true);
  }

  function openEdit(page: Page) {
    setEditing(page);
    setName(page.name);
    setEnabled(page.enabled);
    setOpen(true);
  }

  function openNew() {
    resetForm();
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const url = editing ? `/api/pages/${editing.id}` : "/api/pages";
    const method = editing ? "PUT" : "POST";
    const body = editing
      ? { name, sortOrder: editing.sortOrder, enabled }
      : { name, enabled };

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      onSuccess(editing ? "Seite aktualisiert" : "Seite erstellt");
      setOpen(false);
      resetForm();
      onRefresh();
    } else {
      const data = await response.json().catch(() => ({}));
      onError(data.error ?? "Fehler beim Speichern");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Seite wirklich löschen? Alle Kategorien und Dienste werden mitgelöscht."))
      return;

    const response = await fetch(`/api/pages/${id}`, { method: "DELETE" });
    if (response.ok) {
      onSuccess("Seite gelöscht");
      setOpen(false);
      resetForm();
      onRefresh();
    } else {
      const data = await response.json().catch(() => ({}));
      onError(data.error ?? "Fehler beim Löschen");
    }
  }

  async function handleToggleEnabled(page: Page, nextEnabled: boolean) {
    setTogglingId(page.id);

    try {
      const response = await fetch(`/api/pages/${page.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: page.name,
          sortOrder: page.sortOrder,
          enabled: nextEnabled,
        }),
      });

      if (response.ok) {
        onSuccess(nextEnabled ? "Seite aktiviert" : "Seite ausgeblendet");
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
    <Card className="glass-panel-strong rounded-2xl border-white/10 bg-transparent">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Seiten</CardTitle>
          <CardDescription>
            Mehrere Dashboard-Ansichten mit eigenen Kategorien und Diensten
          </CardDescription>
        </div>
        <Dialog
          open={open}
          onOpenChange={(value) => {
            if (value) {
              setOpen(true);
              return;
            }
            discardConfirm.requestClose(isDirty, () => {
              setOpen(false);
              resetForm();
            });
          }}
        >
          <DialogTrigger
            render={
              <Button size="sm" onClick={openNew}>
                <Plus className="mr-2 size-4" />
                Neue Seite
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Seite bearbeiten" : "Neue Seite"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              {editing && (
                <div className="flex items-center justify-between gap-4 rounded-lg border border-border/50 p-3">
                  <div className="space-y-0.5">
                    <Label>Seite im Dashboard</Label>
                    <p className="text-xs text-muted-foreground">
                      Ausgeblendete Seiten erscheinen nicht im Umschalter.
                    </p>
                  </div>
                  <EnableSwitch
                    enabled={enabled}
                    onChange={setEnabled}
                    compact
                  />
                </div>
              )}
              <div className="flex gap-2">
                {editing && (
                  <Button
                    type="button"
                    variant="destructive"
                    className="flex-1"
                    disabled={pages.length <= 1}
                    onClick={() => handleDelete(editing.id)}
                  >
                    Löschen
                  </Button>
                )}
                <Button type="submit" className="flex-1">
                  Speichern
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Reihenfolge per Drag &amp; Drop. Die ersten neun aktiven Seiten sind im
          Dashboard über die Tasten 1–9 erreichbar.
        </p>
        <PagesAdminBoard
          pages={pages}
          onEdit={openEdit}
          onToggleEnabled={handleToggleEnabled}
          onDelete={handleDelete}
          onRefresh={onRefresh}
          onSuccess={onSuccess}
          onError={onError}
          togglingId={togglingId}
        />
      </CardContent>
      <DiscardChangesDialog
        open={discardConfirm.open}
        onConfirm={discardConfirm.confirmDiscard}
        onCancel={discardConfirm.cancelDiscard}
      />
    </Card>
  );
}
