"use client";

import { useState } from "react";
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
import { CategoriesAdminBoard } from "@/components/admin/CategoriesAdminBoard";
import type { Category } from "@/lib/db/schema";

interface CategoriesAdminProps {
  categories: Category[];
  defaultCardColor: string;
  onRefresh: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function CategoriesAdmin({
  categories,
  defaultCardColor,
  onRefresh,
  onSuccess,
  onError,
}: CategoriesAdminProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("");
  const [togglingId, setTogglingId] = useState<number | null>(null);

  function resetForm() {
    setEditing(null);
    setName("");
    setColor("");
  }

  function openEdit(category: Category) {
    setEditing(category);
    setName(category.name);
    setColor(category.color ?? "");
    setOpen(true);
  }

  function openNew() {
    resetForm();
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const url = editing ? `/api/categories/${editing.id}` : "/api/categories";
    const method = editing ? "PUT" : "POST";
    const body = editing
      ? {
          name,
          color: color || null,
          sortOrder: editing.sortOrder,
          columnPosition: editing.columnPosition,
          enabled: editing.enabled,
        }
      : { name, color: color || null };

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      onSuccess(editing ? "Kategorie aktualisiert" : "Kategorie erstellt");
      setOpen(false);
      resetForm();
      onRefresh();
    } else {
      onError("Fehler beim Speichern");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Kategorie wirklich löschen? Alle Dienste werden mitgelöscht."))
      return;

    const response = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (response.ok) {
      onSuccess("Kategorie gelöscht");
      onRefresh();
    } else {
      onError("Fehler beim Löschen");
    }
  }

  async function handleToggleEnabled(category: Category, enabled: boolean) {
    setTogglingId(category.id);

    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: category.name,
          color: category.color,
          sortOrder: category.sortOrder,
          columnPosition: category.columnPosition,
          enabled,
        }),
      });

      if (response.ok) {
        onSuccess(enabled ? "Kategorie aktiviert" : "Kategorie ausgeblendet");
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
          <CardTitle>Kategorien</CardTitle>
          <CardDescription>Spalten im Dashboard verwalten</CardDescription>
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) resetForm();
          }}
        >
          <DialogTrigger
            render={
              <Button size="sm" onClick={openNew}>
                <Plus className="mr-2 size-4" />
                Neu
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Kategorie bearbeiten" : "Neue Kategorie"}
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
              <div className="space-y-2">
                <Label>Kategoriefarbe (optional)</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={color || defaultCardColor}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-10 w-16 shrink-0 cursor-pointer p-1"
                  />
                  <Input
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder={`leer = ${defaultCardColor} (Theme)`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => setColor("")}
                  >
                    Standard
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Färbt Kategorie-Reiter und den Glanz aller Kacheln in dieser Spalte.
                </p>
              </div>
              <Button type="submit" className="w-full">
                Speichern
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Kachel anklicken zum Bearbeiten. Per Drag &amp; Drop die
          Spaltenreihenfolge ändern.
        </p>

        <CategoriesAdminBoard
          categories={categories}
          defaultCardColor={defaultCardColor}
          onEdit={openEdit}
          onToggleEnabled={handleToggleEnabled}
          onDelete={handleDelete}
          onRefresh={onRefresh}
          onSuccess={onSuccess}
          onError={onError}
          togglingId={togglingId}
        />
      </CardContent>
    </Card>
  );
}
