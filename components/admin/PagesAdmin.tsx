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
  const t = useTranslations("adminPages");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Page | null>(null);
  const [name, setName] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const discardConfirm = useDiscardConfirm();
  const [formSnapshot, setFormSnapshot] = useState("");

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
    setFormSnapshot(
      JSON.stringify({ name: page.name, enabled: page.enabled }),
    );
    setOpen(true);
  }

  function openNew() {
    resetForm();
    setFormSnapshot(JSON.stringify({ name: "", enabled: true }));
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
      onSuccess(editing ? t("pageUpdated") : t("pageCreated"));
      setOpen(false);
      resetForm();
      onRefresh();
    } else {
      const data = await response.json().catch(() => ({}));
      onError(data.error ?? tc("saveFailed"));
    }
  }

  async function handleDelete(id: number) {
    if (!confirm(t("confirmDeletePage")))
      return;

    const response = await fetch(`/api/pages/${id}`, { method: "DELETE" });
    if (response.ok) {
      onSuccess(t("pageDeleted"));
      setOpen(false);
      resetForm();
      onRefresh();
    } else {
      const data = await response.json().catch(() => ({}));
      onError(data.error ?? tc("deleteFailed"));
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
        onSuccess(nextEnabled ? t("pageEnabled") : t("pageHidden"));
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
                {t("newPage")}
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? t("editPage") : t("newPage")}
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
              {editing && (
                <div className="flex items-center justify-between gap-4 rounded-lg border border-border/50 p-3">
                  <div className="space-y-0.5">
                    <Label>{t("pageOnDashboard")}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t("pageHiddenHint")}
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
                    {tc("delete")}
                  </Button>
                )}
                <Button type="submit" className="flex-1">
                  {tc("save")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">{t("boardHint")}</p>
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
