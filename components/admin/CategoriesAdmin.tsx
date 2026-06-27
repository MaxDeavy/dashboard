"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
import { DiscardChangesDialog } from "@/components/admin/DiscardChangesDialog";
import type { Category } from "@/lib/db/schema";
import { useDiscardConfirm } from "@/hooks/useDiscardConfirm";

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
  const t = useTranslations("adminCategories");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("");
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const discardConfirm = useDiscardConfirm();
  const [formSnapshot, setFormSnapshot] = useState("");

  const isDirty =
    open && JSON.stringify({ name, color }) !== formSnapshot;

  function resetForm() {
    setEditing(null);
    setName("");
    setColor("");
  }

  function openEdit(category: Category) {
    setEditing(category);
    setName(category.name);
    setColor(category.color ?? "");
    setFormSnapshot(
      JSON.stringify({ name: category.name, color: category.color ?? "" }),
    );
    setOpen(true);
  }

  function openNew() {
    resetForm();
    setFormSnapshot(JSON.stringify({ name: "", color: "" }));
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
      onSuccess(editing ? t("categoryUpdated") : t("categoryCreated"));
      setOpen(false);
      resetForm();
      onRefresh();
    } else {
      onError(tc("saveFailed"));
    }
  }

  async function handleDelete(id: number) {
    if (!confirm(t("confirmDeleteCategory")))
      return;

    const response = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (response.ok) {
      onSuccess(t("categoryDeleted"));
      onRefresh();
    } else {
      onError(tc("deleteFailed"));
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
        onSuccess(enabled ? t("categoryEnabled") : t("categoryHidden"));
        onRefresh();
      } else {
        onError(tc("statusSaveFailed"));
      }
    } catch {
      onError(tc("statusSaveFailed"));
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <Card className="glass-panel-strong rounded-2xl border-white/10 bg-transparent">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            if (v) {
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
                {t("new")}
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? t("editCategory") : t("newCategory")}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{tc("name")}</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>{t("categoryColor")}</Label>
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
                    placeholder={tc("examplePlaceholder", { value: defaultCardColor })}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => setColor("")}
                  >
                    {tc("default")}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("categoryColorHint")}
                </p>
              </div>
              <Button type="submit" className="w-full">
                {tc("save")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">{t("editBoardHint")}</p>

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
      <DiscardChangesDialog
        open={discardConfirm.open}
        onConfirm={discardConfirm.confirmDiscard}
        onCancel={discardConfirm.cancelDiscard}
      />
    </Card>
  );
}
