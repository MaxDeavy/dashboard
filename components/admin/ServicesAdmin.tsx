"use client";

import { useEffect, useMemo, useState } from "react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LinkOpenModeSelect } from "@/components/admin/LinkOpenModeSelect";
import { EnableSwitch } from "@/components/admin/EnableSwitch";
import { ServiceIconField } from "@/components/admin/ServiceIconField";
import { ServicesAdminBoard } from "@/components/admin/ServicesAdminBoard";
import { WIDGET_TYPES } from "@/lib/widgets/constants";
import { WidgetCredentialsForm } from "@/components/admin/WidgetCredentialsForm";
import {
  DEFAULT_LINK_OPEN_MODE,
  parseLinkOpenMode,
  type LinkOpenMode,
} from "@/lib/link-open-mode";
import type { Category, Page, Service } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { resolveTileColor } from "@/lib/tile-colors";
import { UNSORTED_CATEGORY_ID } from "@/lib/service-board";

interface ServiceWithWidget extends Service {
  widget: {
    widgetType: string;
    apiUrl: string;
    extraConfig: string | null;
  } | null;
}

interface ServicesAdminProps {
  services: ServiceWithWidget[];
  categories: Category[];
  pages: Page[];
  defaultCardColor: string;
  lanEnabled?: boolean;
  onRefresh: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

const emptyForm = {
  name: "",
  subtitle: "",
  url: "",
  lanUrl: "",
  cardColor: "",
  linkOpenMode: DEFAULT_LINK_OPEN_MODE as LinkOpenMode,
  icon: "",
  categoryId: 0,
  sortOrder: 0,
  healthCheckUrl: "",
  enabled: true,
  widgetType: "",
  apiUrl: "",
  apiKey: "",
  username: "",
  password: "",
  token: "",
  tokenSecret: "",
  extraNode: "",
  extraEndpoint: "",
  extraEntity: "",
  insecureTls: false,
};

function resolveWidgetExtraEndpoint(
  widgetType: string,
  extra: Record<string, string>,
): string {
  if (widgetType === "technitium") return extra.range ?? "";
  if (widgetType === "guacamole") return extra.dataSource ?? "";
  return extra.endpointId ?? "";
}

function resolveWidgetExtraEntity(
  widgetType: string,
  extra: Record<string, string>,
): string {
  if (widgetType === "qnap") return extra.volume ?? "";
  return extra.entityId ?? "";
}

function buildWidgetExtraConfig(
  form: typeof emptyForm,
): Record<string, string> {
  const extraConfig: Record<string, string> = {};

  if (form.extraNode) {
    extraConfig.node = form.extraNode;
  }

  if (form.extraEndpoint) {
    if (form.widgetType === "technitium") {
      extraConfig.range = form.extraEndpoint;
    } else if (form.widgetType === "guacamole") {
      extraConfig.dataSource = form.extraEndpoint;
    } else {
      extraConfig.endpointId = form.extraEndpoint;
    }
  }

  if (form.extraEntity) {
    if (form.widgetType === "qnap") {
      extraConfig.volume = form.extraEntity;
    } else {
      extraConfig.entityId = form.extraEntity;
    }
  }

  return extraConfig;
}

export function ServicesAdmin({
  services,
  categories,
  pages,
  defaultCardColor,
  lanEnabled = true,
  onRefresh,
  onSuccess,
  onError,
}: ServicesAdminProps) {
  const [activePageId, setActivePageId] = useState(pages[0]?.id ?? 0);
  const [open, setOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceWithWidget | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [categoryName, setCategoryName] = useState("");
  const [categoryColor, setCategoryColor] = useState("");
  const [categoryEnabled, setCategoryEnabled] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const pageCategories = useMemo(
    () => categories.filter((category) => category.pageId === activePageId),
    [categories, activePageId],
  );

  useEffect(() => {
    if (pages.length === 0) {
      setActivePageId(0);
      return;
    }
    if (!pages.some((page) => page.id === activePageId)) {
      setActivePageId(pages[0]?.id ?? 0);
    }
  }, [pages, activePageId]);

  const selectedCategory = categories.find(
    (category) => category.id === form.categoryId,
  );
  const effectiveCardColor = resolveTileColor(
    form.cardColor,
    selectedCategory?.color,
    defaultCardColor,
  );

  function resetCategoryForm() {
    setEditingCategory(null);
    setCategoryName("");
    setCategoryColor("");
    setCategoryEnabled(true);
  }

  function openNewCategory() {
    resetCategoryForm();
    setCategoryOpen(true);
  }

  function openCategorySettings(category: Category) {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryColor(category.color ?? "");
    setCategoryEnabled(category.enabled);
    setCategoryOpen(true);
  }

  async function handleCategorySubmit(e: React.FormEvent) {
    e.preventDefault();

    const url = editingCategory
      ? `/api/categories/${editingCategory.id}`
      : "/api/categories";
    const method = editingCategory ? "PUT" : "POST";
    const body = editingCategory
      ? {
          name: categoryName,
          color: categoryColor || null,
          sortOrder: editingCategory.sortOrder,
          columnPosition: editingCategory.columnPosition,
          enabled: categoryEnabled,
        }
      : { name: categoryName, color: categoryColor || null, pageId: activePageId };

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      onSuccess(
        editingCategory ? "Kategorie aktualisiert" : "Kategorie erstellt",
      );
      setCategoryOpen(false);
      resetCategoryForm();
      onRefresh();
    } else {
      onError("Fehler beim Speichern");
    }
  }

  async function handleDeleteCategory(id: number) {
    if (!confirm("Kategorie wirklich löschen? Alle Dienste werden mitgelöscht."))
      return;

    const response = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (response.ok) {
      onSuccess("Kategorie gelöscht");
      setCategoryOpen(false);
      resetCategoryForm();
      onRefresh();
    } else {
      onError("Fehler beim Löschen");
    }
  }

  function resetForm() {
    setEditing(null);
    setForm({
      ...emptyForm,
      categoryId: pageCategories[0]?.id ?? 0,
    });
  }

  function openNewForCategory(categoryId: number) {
    setEditing(null);
    setForm({
      ...emptyForm,
      categoryId:
        categoryId === UNSORTED_CATEGORY_ID
          ? pageCategories[0]?.id ?? 0
          : categoryId,
    });
    setOpen(true);
  }

  function openEdit(service: ServiceWithWidget) {
    setEditing(service);
    const extra = service.widget?.extraConfig
      ? JSON.parse(service.widget.extraConfig)
      : {};
    setForm({
      name: service.name,
      subtitle: service.subtitle ?? "",
      url: service.url,
      lanUrl: service.lanUrl ?? "",
      cardColor: service.cardColor ?? "",
      linkOpenMode: parseLinkOpenMode(service.linkOpenMode),
      icon: service.icon ?? "",
      categoryId: service.categoryId,
      sortOrder: service.sortOrder,
      healthCheckUrl: service.healthCheckUrl ?? "",
      enabled: service.enabled,
      widgetType: service.widget?.widgetType ?? "",
      apiUrl: service.widget?.apiUrl ?? "",
      apiKey: "",
      username: "",
      password: "",
      token: "",
      tokenSecret: "",
      extraNode: extra.node ?? "",
      extraEndpoint: resolveWidgetExtraEndpoint(
        service.widget?.widgetType ?? "",
        extra,
      ),
      extraEntity: resolveWidgetExtraEntity(
        service.widget?.widgetType ?? "",
        extra,
      ),
      insecureTls: service.insecureTls || extra.insecureTls === "true",
    });
    setOpen(true);
  }

  function getNextSortOrder(categoryId: number): number {
    const inCategory = services.filter(
      (service) =>
        service.categoryId === categoryId && service.sortOrder >= 0,
    );
    if (inCategory.length === 0) return 0;
    return Math.max(...inCategory.map((service) => service.sortOrder)) + 1;
  }

  function resolveNewServicePlacement(categoryId: number) {
    if (categoryId === UNSORTED_CATEGORY_ID || form.categoryId === UNSORTED_CATEGORY_ID) {
      return {
        categoryId: pageCategories[0]?.id ?? 0,
        sortOrder: -1,
      };
    }

    return {
      categoryId: categoryId || (pageCategories[0]?.id ?? 0),
      sortOrder: getNextSortOrder(categoryId),
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const credentials: Record<string, string> = {};
    if (form.apiKey) credentials.apiKey = form.apiKey;
    if (form.username) credentials.username = form.username;
    if (form.password) credentials.password = form.password;
    if (form.token) credentials.token = form.token;
    if (form.tokenSecret) credentials.tokenSecret = form.tokenSecret;

    const extraConfig = buildWidgetExtraConfig(form);
    if (form.insecureTls) {
      extraConfig.insecureTls = "true";
    }

    const { categoryId, sortOrder } = editing
      ? { categoryId: editing.categoryId, sortOrder: editing.sortOrder }
      : resolveNewServicePlacement(form.categoryId);

    const body = {
      name: form.name,
      subtitle: form.subtitle || null,
      url: form.url,
      lanUrl: lanEnabled
        ? form.lanUrl || null
        : editing?.lanUrl ?? null,
      cardColor: form.cardColor || null,
      linkOpenMode: form.linkOpenMode,
      icon: form.icon || null,
      categoryId,
      sortOrder,
      healthCheckUrl: form.healthCheckUrl || null,
      enabled: form.enabled,
      insecureTls: form.insecureTls,
      widget: form.widgetType
        ? {
            widgetType: form.widgetType,
            apiUrl: form.apiUrl,
            credentials:
              Object.keys(credentials).length > 0 ? credentials : undefined,
            extraConfig,
          }
        : { widgetType: "" },
    };

    const url = editing ? `/api/services/${editing.id}` : "/api/services";
    const method = editing ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      onSuccess(editing ? "Dienst aktualisiert" : "Dienst erstellt");
      setOpen(false);
      resetForm();
      onRefresh();
    } else {
      onError("Fehler beim Speichern");
    }
  }

  async function handleToggleEnabled(
    service: ServiceWithWidget,
    enabled: boolean,
  ) {
    setTogglingId(service.id);

    const extra = service.widget?.extraConfig
      ? JSON.parse(service.widget.extraConfig)
      : {};

    const body = {
      name: service.name,
      subtitle: service.subtitle,
      url: service.url,
      lanUrl: service.lanUrl,
      cardColor: service.cardColor,
      linkOpenMode: service.linkOpenMode ?? DEFAULT_LINK_OPEN_MODE,
      icon: service.icon,
      categoryId: service.categoryId,
      sortOrder: service.sortOrder,
      healthCheckUrl: service.healthCheckUrl,
      enabled,
      insecureTls: service.insecureTls,
      widget: service.widget?.widgetType
        ? {
            widgetType: service.widget.widgetType,
            apiUrl: service.widget.apiUrl,
            extraConfig: extra,
          }
        : { widgetType: "" },
    };

    try {
      const response = await fetch(`/api/services/${service.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        onSuccess(enabled ? "Dienst aktiviert" : "Dienst ausgeblendet");
        onRefresh();
      } else {
        onError("Fehler beim Aktualisieren");
      }
    } catch {
      onError("Fehler beim Aktualisieren");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Dienst wirklich löschen?")) return;
    const response = await fetch(`/api/services/${id}`, { method: "DELETE" });
    if (response.ok) {
      onSuccess("Dienst gelöscht");
      onRefresh();
    } else {
      onError("Fehler beim Löschen");
    }
  }

  return (
    <Card className="glass-panel-strong rounded-2xl border-white/10 bg-transparent">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Dienste</CardTitle>
          <CardDescription>
            Kategorien und Dienste für das Dashboard verwalten
          </CardDescription>
        </div>
        <Dialog
          open={categoryOpen}
          onOpenChange={(v) => {
            setCategoryOpen(v);
            if (!v) resetCategoryForm();
          }}
        >
          <DialogTrigger
            render={
              <Button size="sm" onClick={openNewCategory}>
                <Plus className="mr-2 size-4" />
                Neue Kategorie
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory
                  ? "Kategorie-Einstellungen"
                  : "Neue Kategorie"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>Kategoriefarbe (optional)</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={categoryColor || defaultCardColor}
                    onChange={(e) => setCategoryColor(e.target.value)}
                    className="h-10 w-16 shrink-0 cursor-pointer p-1"
                  />
                  <Input
                    value={categoryColor}
                    onChange={(e) => setCategoryColor(e.target.value)}
                    placeholder={`leer = ${defaultCardColor} (Theme)`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => setCategoryColor("")}
                  >
                    Standard
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Färbt Kategorie-Reiter und den Glanz aller Kacheln in dieser
                  Spalte.
                </p>
              </div>
              {editingCategory && (
                <div className="flex items-center justify-between gap-4 rounded-lg border border-border/50 p-3">
                  <div className="space-y-0.5">
                    <Label>Kategorie im Dashboard</Label>
                    <p className="text-xs text-muted-foreground">
                      Ausgeblendete Kategorien erscheinen nicht auf der
                      Startseite.
                    </p>
                  </div>
                  <EnableSwitch
                    enabled={categoryEnabled}
                    onChange={setCategoryEnabled}
                    compact
                  />
                </div>
              )}
              <div className="flex gap-2">
                {editingCategory && (
                  <Button
                    type="button"
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleDeleteCategory(editingCategory.id)}
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
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) resetForm();
          }}
        >
          <DialogContent className="flex max-h-[90vh] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl lg:max-w-5xl">
            <DialogHeader className="border-b border-border/50 px-6 py-4">
              <DialogTitle>
                {editing ? "Dienst bearbeiten" : "Neuer Dienst"}
              </DialogTitle>
            </DialogHeader>
            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="grid flex-1 gap-6 overflow-y-auto px-6 py-5 lg:grid-cols-2">
                <div className="space-y-4">
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Allgemein
                  </p>

                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Untertitel</Label>
                    <Input
                      value={form.subtitle}
                      onChange={(e) =>
                        setForm({ ...form, subtitle: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Link öffnen</Label>
                    <LinkOpenModeSelect
                      value={form.linkOpenMode}
                      onChange={(linkOpenMode) =>
                        setForm({ ...form, linkOpenMode })
                      }
                    />
                  </div>

                  <ServiceIconField
                    value={form.icon}
                    onChange={(icon) => setForm({ ...form, icon })}
                    serviceId={editing?.id}
                    onUploadComplete={(icon) => setForm({ ...form, icon })}
                    onError={onError}
                  />

                  <div className="space-y-2">
                    <Label>Kachelfarbe (optional)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={effectiveCardColor}
                        onChange={(e) =>
                          setForm({ ...form, cardColor: e.target.value })
                        }
                        className="h-10 w-16 shrink-0 cursor-pointer p-1"
                      />
                      <Input
                        value={form.cardColor}
                        onChange={(e) =>
                          setForm({ ...form, cardColor: e.target.value })
                        }
                        placeholder={`leer = ${effectiveCardColor} (Kategorie/Theme)`}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="shrink-0"
                        onClick={() => setForm({ ...form, cardColor: "" })}
                      >
                        Standard
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Dunkle Kachel mit dezentem farbigen Glanz am Rand und beim
                      Hover.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Links & Widget
                  </p>

                  <div className="space-y-2">
                    <Label>Web-URL</Label>
                    <Input
                      value={form.url}
                      onChange={(e) =>
                        setForm({ ...form, url: e.target.value })
                      }
                      placeholder="https://dienst.deine-domain.de"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Externe URL (z. B. Cloudflare Zero Trust) — aktiv im
                      Web-Modus
                    </p>
                  </div>

                  {lanEnabled && (
                    <div className="space-y-2">
                      <Label>LAN-URL (optional)</Label>
                      <Input
                        value={form.lanUrl}
                        onChange={(e) =>
                          setForm({ ...form, lanUrl: e.target.value })
                        }
                        placeholder="http://192.168.1.10:8080"
                      />
                      <p className="text-xs text-muted-foreground">
                        Lokale IP/Hostname — aktiv wenn oben auf LAN umgeschaltet
                        ist
                      </p>
                    </div>
                  )}

                  <div className="space-y-2 rounded-lg border border-border/50 bg-muted/20 p-3">
                    <Label>HealthCheck URL (optional)</Label>
                    <Input
                      value={form.healthCheckUrl}
                      onChange={(e) =>
                        setForm({ ...form, healthCheckUrl: e.target.value })
                      }
                      placeholder="z.B. http://192.168.1.10:8080"
                    />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <strong>Link-URL</strong> = wohin du klickst.{" "}
                      <strong>HealthCheck URL</strong> = Adresse für den
                      Online-Punkt (z. B.{" "}
                      <code className="text-[10px]">http://sonarr:8989</code> im
                      Docker-Netzwerk).
                    </p>
                    <div className="flex items-center justify-between gap-4 pt-1">
                      <div className="space-y-0.5">
                        <Label>Selbstsigniertes TLS-Zertifikat</Label>
                        <p className="text-xs text-muted-foreground">
                          Für Health-Check und Widget-API dieses Dienstes
                        </p>
                      </div>
                      <EnableSwitch
                        enabled={form.insecureTls}
                        onChange={(enabled) =>
                          setForm({ ...form, insecureTls: enabled })
                        }
                        compact
                      />
                    </div>
                  </div>

                  <div className="space-y-3 rounded-lg border border-border/50 p-3">
                    <p className="text-sm font-medium">Hover-Widget</p>
                    <div className="space-y-2">
                      <Label>Widget-Typ</Label>
                      <Select
                        value={form.widgetType || "none"}
                        onValueChange={(v) =>
                          setForm({
                            ...form,
                            widgetType: v === "none" || !v ? "" : v,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Kein Widget" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Kein Widget</SelectItem>
                          {WIDGET_TYPES.map((w) => (
                            <SelectItem key={w.value} value={w.value}>
                              {w.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {form.widgetType && (
                      <WidgetCredentialsForm
                        form={form}
                        editing={!!editing}
                        onChange={(updates) => setForm({ ...form, ...updates })}
                      />
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter className="!mx-0 !mb-0 shrink-0 border-t border-border/50 bg-muted/30 px-6 py-4 sm:justify-end">
                <Button type="submit">Speichern</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {pages.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {pages.map((page) => (
              <button
                key={page.id}
                type="button"
                onClick={() => setActivePageId(page.id)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                  activePageId === page.id
                    ? "border-primary/50 bg-primary/10 text-foreground"
                    : "border-border/50 bg-muted/20 text-muted-foreground hover:border-border hover:text-foreground",
                  !page.enabled && "opacity-50",
                )}
              >
                {page.name}
              </button>
            ))}
          </div>
        )}

        <ServicesAdminBoard
          services={services}
          categories={categories}
          pageId={activePageId}
          defaultCardColor={defaultCardColor}
          onEdit={openEdit}
          onAddService={openNewForCategory}
          onEditCategory={openCategorySettings}
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
