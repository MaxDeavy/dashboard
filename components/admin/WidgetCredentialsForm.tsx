"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  API_KEY_WIDGETS,
  TOKEN_WIDGETS,
  USERNAME_PASSWORD_WIDGETS,
} from "@/lib/widgets/constants";

export interface WidgetFormFields {
  widgetType: string;
  apiUrl: string;
  apiKey: string;
  username: string;
  password: string;
  token: string;
  tokenSecret: string;
  extraNode: string;
  extraEndpoint: string;
  extraEntity: string;
  insecureTls: boolean;
}

interface WidgetCredentialsFormProps {
  form: WidgetFormFields;
  editing: boolean;
  onChange: (updates: Partial<WidgetFormFields>) => void;
}

export function WidgetCredentialsForm({
  form,
  editing,
  onChange,
}: WidgetCredentialsFormProps) {
  const t = useTranslations("widgets");

  if (!form.widgetType) return null;

  const unchangedPlaceholder = editing ? t("unchangedPlaceholder") : "";

  return (
    <>
      <div className="space-y-2">
        <Label>{t("apiUrl")}</Label>
        <Input
          value={form.apiUrl}
          onChange={(e) => onChange({ apiUrl: e.target.value })}
          placeholder={getApiUrlPlaceholder(form.widgetType)}
        />
      </div>

      {form.widgetType === "adguard" && (
        <div className="space-y-2">
          <Label>{t("username")} (optional)</Label>
          <Input
            value={form.username}
            onChange={(e) => onChange({ username: e.target.value })}
            placeholder="admin"
          />
        </div>
      )}

      {API_KEY_WIDGETS.has(form.widgetType) && (
        <div className="space-y-2">
          <Label>{getApiKeyLabel(form.widgetType, t)}</Label>
          <Input
            type="password"
            value={form.apiKey}
            onChange={(e) => onChange({ apiKey: e.target.value })}
            placeholder={unchangedPlaceholder}
          />
        </div>
      )}

      {USERNAME_PASSWORD_WIDGETS.has(form.widgetType) && (
        <>
          <div className="space-y-2">
            <Label>
              {form.widgetType === "npm" ? t("email") : t("username")}
            </Label>
            <Input
              value={form.username}
              onChange={(e) => onChange({ username: e.target.value })}
              placeholder={
                form.widgetType === "npm" ? "admin@example.com" : undefined
              }
            />
          </div>
          {form.widgetType !== "adguard" && (
            <div className="space-y-2">
              <Label>{t("password")}</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => onChange({ password: e.target.value })}
                placeholder={unchangedPlaceholder}
              />
            </div>
          )}
        </>
      )}

      {TOKEN_WIDGETS.has(form.widgetType) && (
        <div className="space-y-2">
          <Label>
            {form.widgetType === "mealie" ? t("apiToken") : t("accessToken")}
          </Label>
          <Input
            type="password"
            value={form.token}
            onChange={(e) => onChange({ token: e.target.value })}
            placeholder={unchangedPlaceholder}
          />
        </div>
      )}

      {form.widgetType === "proxmox" && (
        <>
          <div className="space-y-2">
            <Label>{t("proxmoxTokenId")}</Label>
            <Input
              value={form.token}
              onChange={(e) => onChange({ token: e.target.value })}
              placeholder="root@pam!dashboard"
            />
            <p className="text-xs text-muted-foreground">
              {t("proxmoxTokenHint")}
            </p>
          </div>
          <div className="space-y-2">
            <Label>{t("proxmoxTokenSecret")}</Label>
            <Input
              type="password"
              value={form.tokenSecret}
              onChange={(e) => onChange({ tokenSecret: e.target.value })}
              placeholder={unchangedPlaceholder}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("proxmoxNode")}</Label>
            <Input
              value={form.extraNode}
              onChange={(e) => onChange({ extraNode: e.target.value })}
              placeholder="pve"
            />
          </div>
        </>
      )}

      {form.widgetType === "portainer" && (
        <div className="space-y-2">
          <Label>{t("portainerEndpoint")}</Label>
          <Input
            value={form.extraEndpoint}
            onChange={(e) => onChange({ extraEndpoint: e.target.value })}
            placeholder={t("portainerEndpointPlaceholder")}
          />
        </div>
      )}

      {form.widgetType === "homeassistant" && (
        <div className="space-y-2">
          <Label>{t("homeAssistantEntity")}</Label>
          <Input
            value={form.extraEntity}
            onChange={(e) => onChange({ extraEntity: e.target.value })}
            placeholder={t("homeAssistantPlaceholder")}
          />
        </div>
      )}

      {form.widgetType === "docker" && (
        <p className="text-xs text-muted-foreground">{t("dockerHint")}</p>
      )}

      {form.widgetType === "pihole" && (
        <p className="text-xs text-muted-foreground">
          {t("piholeHint", { admin: "/admin" })}
        </p>
      )}

      {form.widgetType === "immich" && (
        <p className="text-xs text-muted-foreground">
          {t("immichHint", { permission: "server.statistics" })}
        </p>
      )}

      {form.widgetType === "mealie" && (
        <p className="text-xs text-muted-foreground">{t("mealieHint")}</p>
      )}

      {form.widgetType === "kavita" && (
        <p className="text-xs text-muted-foreground">
          {t("kavitaHint", { header: "x-api-key" })}
        </p>
      )}

      {form.widgetType === "plex" && (
        <p className="text-xs text-muted-foreground">{t("plexHint")}</p>
      )}

      {form.widgetType === "nextcloud" && (
        <p className="text-xs text-muted-foreground">
          {t("nextcloudHint", {
            command: "occ config:app:set serverinfo token",
          })}
        </p>
      )}

      {form.widgetType === "overseerr" && (
        <p className="text-xs text-muted-foreground">{t("overseerrHint")}</p>
      )}

      {form.widgetType === "technitium" && (
        <>
          <div className="space-y-2">
            <Label>{t("technitiumRange")}</Label>
            <Input
              value={form.extraEndpoint}
              onChange={(e) => onChange({ extraEndpoint: e.target.value })}
              placeholder="LastHour"
            />
            <p className="text-xs text-muted-foreground">
              {t("technitiumRangeHint")}
            </p>
          </div>
          <div className="space-y-2">
            <Label>{t("technitiumNode")}</Label>
            <Input
              value={form.extraNode}
              onChange={(e) => onChange({ extraNode: e.target.value })}
              placeholder={t("technitiumNodePlaceholder")}
            />
          </div>
        </>
      )}

      {form.widgetType === "qnap" && (
        <>
          <div className="space-y-2">
            <Label>{t("qnapVolume")}</Label>
            <Input
              value={form.extraEntity}
              onChange={(e) => onChange({ extraEntity: e.target.value })}
              placeholder={t("qnapVolumePlaceholder")}
            />
          </div>
          <p className="text-xs text-muted-foreground">{t("qnapHint")}</p>
        </>
      )}

      {form.widgetType === "guacamole" && (
        <div className="space-y-2">
          <Label>{t("guacamoleDataSource")}</Label>
          <Input
            value={form.extraEndpoint}
            onChange={(e) => onChange({ extraEndpoint: e.target.value })}
            placeholder={t("guacamolePlaceholder")}
          />
        </div>
      )}

      {form.widgetType === "adguard" && (
        <p className="text-xs text-muted-foreground">
          {t("adguardHint", { admin: "admin" })}
        </p>
      )}

      {form.widgetType === "npm" && (
        <p className="text-xs text-muted-foreground">
          {t("npmHint", { api: "/api" })}
        </p>
      )}

      {form.widgetType === "transmission" && (
        <p className="text-xs text-muted-foreground">{t("transmissionHint")}</p>
      )}

      {form.widgetType === "deluge" && (
        <p className="text-xs text-muted-foreground">
          {t("delugeHint", { api: "/json" })}
        </p>
      )}

      {form.widgetType === "audiobookshelf" && (
        <p className="text-xs text-muted-foreground">
          {t("audiobookshelfHint")}
        </p>
      )}

      {form.widgetType === "n8n" && (
        <p className="text-xs text-muted-foreground">{t("n8nHint")}</p>
      )}

      {form.widgetType === "grafana" && (
        <p className="text-xs text-muted-foreground">{t("grafanaHint")}</p>
      )}

      {form.widgetType === "paperless" && (
        <p className="text-xs text-muted-foreground">{t("paperlessHint")}</p>
      )}

      {form.widgetType === "tautulli" && (
        <p className="text-xs text-muted-foreground">{t("tautulliHint")}</p>
      )}

      {form.widgetType === "navidrome" && (
        <p className="text-xs text-muted-foreground">{t("navidromeHint")}</p>
      )}

      {form.widgetType === "fritzbox" && (
        <p className="text-xs text-muted-foreground">
          {t("fritzboxHint", { example: "http://192.168.178.1" })}
        </p>
      )}

      {form.widgetType === "iframe" && (
        <p className="text-xs text-muted-foreground">{t("iframeHint")}</p>
      )}

      {form.widgetType === "filebrowser" && (
        <p className="text-xs text-muted-foreground">
          {t("filebrowserHint", { api: "/api/usage" })}
        </p>
      )}
    </>
  );
}

function getApiKeyLabel(
  widgetType: string,
  t: ReturnType<typeof useTranslations<"widgets">>,
): string {
  const key = widgetType as keyof typeof credentialLabelKeys;
  if (key in credentialLabelKeys) {
    return t(`credentialLabels.${key}`);
  }
  return t("credentialLabels.default");
}

const credentialLabelKeys = {
  portainer: true,
  pihole: true,
  adguard: true,
  plex: true,
  nextcloud: true,
  immich: true,
  kavita: true,
  technitium: true,
  audiobookshelf: true,
  paperless: true,
  tautulli: true,
  n8n: true,
  grafana: true,
} as const;

function getApiUrlPlaceholder(widgetType: string): string {
  switch (widgetType) {
    case "docker":
      return "http://docker-socket-proxy:2375";
    case "pihole":
      return "http://pi.hole";
    case "jellyseerr":
    case "overseerr":
      return "http://requests.local:5055";
    case "immich":
      return "http://immich.local:2283";
    case "mealie":
      return "http://mealie.local:9000";
    case "kavita":
      return "http://kavita.local:5000";
    case "plex":
      return "http://plex.local:32400";
    case "nextcloud":
      return "http://nextcloud.local";
    case "technitium":
      return "http://dns.local:5380";
    case "qnap":
      return "https://nas.local:8080";
    case "filebrowser":
      return "http://files.local:8080";
    case "guacamole":
      return "http://guacamole.local:8080/guacamole";
    case "fritzbox":
      return "http://192.168.178.1";
    case "iframe":
      return "https://grafana.local/d/abc123";
    case "npm":
      return "http://npm.local:81";
    case "adguard":
      return "http://adguard.local";
    case "transmission":
      return "http://transmission.local:9091";
    case "deluge":
      return "http://deluge.local:8112";
    case "audiobookshelf":
      return "http://audiobookshelf.local:13378";
    case "n8n":
      return "http://n8n.local:5678";
    case "grafana":
      return "http://grafana.local:3000";
    case "paperless":
      return "http://paperless.local:8000";
    case "tautulli":
      return "http://tautulli.local:8181";
    case "navidrome":
      return "http://navidrome.local:4533";
    case "bazarr":
      return "http://bazarr.local:6767";
    default:
      return "";
  }
}
