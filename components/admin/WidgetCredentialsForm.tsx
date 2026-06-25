"use client";

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
  if (!form.widgetType) return null;

  return (
    <>
      <div className="space-y-2">
        <Label>API-URL</Label>
        <Input
          value={form.apiUrl}
          onChange={(e) => onChange({ apiUrl: e.target.value })}
          placeholder={getApiUrlPlaceholder(form.widgetType)}
        />
      </div>

      {form.widgetType === "adguard" && (
        <div className="space-y-2">
          <Label>Benutzername (optional)</Label>
          <Input
            value={form.username}
            onChange={(e) => onChange({ username: e.target.value })}
            placeholder="admin"
          />
        </div>
      )}

      {API_KEY_WIDGETS.has(form.widgetType) && (
        <div className="space-y-2">
          <Label>{getApiKeyLabel(form.widgetType)}</Label>
          <Input
            type="password"
            value={form.apiKey}
            onChange={(e) => onChange({ apiKey: e.target.value })}
            placeholder={editing ? "Leer lassen = unverändert" : ""}
          />
        </div>
      )}

      {USERNAME_PASSWORD_WIDGETS.has(form.widgetType) && (
        <>
          <div className="space-y-2">
            <Label>
              {form.widgetType === "npm"
                ? "E-Mail"
                : "Benutzername"}
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
              <Label>Passwort</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => onChange({ password: e.target.value })}
                placeholder={editing ? "Leer lassen = unverändert" : ""}
              />
            </div>
          )}
        </>
      )}

      {TOKEN_WIDGETS.has(form.widgetType) && (
        <div className="space-y-2">
          <Label>
            {form.widgetType === "mealie" ? "API-Token" : "Access-Token"}
          </Label>
          <Input
            type="password"
            value={form.token}
            onChange={(e) => onChange({ token: e.target.value })}
            placeholder={editing ? "Leer lassen = unverändert" : ""}
          />
        </div>
      )}

      {form.widgetType === "proxmox" && (
        <>
          <div className="space-y-2">
            <Label>Token-ID</Label>
            <Input
              value={form.token}
              onChange={(e) => onChange({ token: e.target.value })}
              placeholder="root@pam!dashboard"
            />
            <p className="text-xs text-muted-foreground">
              Format: Benutzer@Realm!Tokenname (ohne Secret). Node-Name wird bei
              Bedarf automatisch ermittelt.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Secret</Label>
            <Input
              type="password"
              value={form.tokenSecret}
              onChange={(e) => onChange({ tokenSecret: e.target.value })}
              placeholder={editing ? "Leer lassen = unverändert" : ""}
            />
          </div>
          <div className="space-y-2">
            <Label>Node-Name</Label>
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
          <Label>Endpoint-ID (optional)</Label>
          <Input
            value={form.extraEndpoint}
            onChange={(e) => onChange({ extraEndpoint: e.target.value })}
            placeholder="Leer = erster lokaler Endpoint"
          />
        </div>
      )}

      {form.widgetType === "homeassistant" && (
        <div className="space-y-2">
          <Label>Entity-ID (optional)</Label>
          <Input
            value={form.extraEntity}
            onChange={(e) => onChange({ extraEntity: e.target.value })}
            placeholder="z.B. sensor.cpu_temp"
          />
        </div>
      )}

      {form.widgetType === "docker" && (
        <p className="text-xs text-muted-foreground">
          Docker Engine API URL, z. B. http://docker-socket-proxy:2375
        </p>
      )}

      {form.widgetType === "pihole" && (
            <p className="text-xs text-muted-foreground">
              App-Passwort aus Pi-hole v6 (Einstellungen → API) oder API-Key aus
              v5. Basis-URL ohne <code className="text-[10px]">/admin</code>.
            </p>
      )}

      {form.widgetType === "immich" && (
        <p className="text-xs text-muted-foreground">
          API-Key unter Benutzereinstellungen → API-Schlüssel mit Berechtigung{" "}
          <code className="text-[10px]">server.statistics</code>.
        </p>
      )}

      {form.widgetType === "mealie" && (
        <p className="text-xs text-muted-foreground">
          API-Token unter Profil → API-Tokens erzeugen (Bearer-Token).
        </p>
      )}

      {form.widgetType === "kavita" && (
        <p className="text-xs text-muted-foreground">
          Auth-Key unter Benutzereinstellungen → Auth Keys (Header{" "}
          <code className="text-[10px]">x-api-key</code>).
        </p>
      )}

      {form.widgetType === "plex" && (
        <p className="text-xs text-muted-foreground">
          Plex-Token aus Kontoeinstellungen. Basis-URL des Media Servers (Port
          32400), ohne Pfad.
        </p>
      )}

      {form.widgetType === "nextcloud" && (
        <p className="text-xs text-muted-foreground">
          App „Server info“ muss aktiv sein. Token per{" "}
          <code className="text-[10px]">occ config:app:set serverinfo token</code>{" "}
          setzen — nur ASCII-Zeichen (keine Umlaute).
        </p>
      )}

      {form.widgetType === "overseerr" && (
        <p className="text-xs text-muted-foreground">
          API-Key aus Overseerr → Einstellungen → General → API Key.
        </p>
      )}

      {form.widgetType === "technitium" && (
        <>
          <div className="space-y-2">
            <Label>Zeitraum (optional)</Label>
            <Input
              value={form.extraEndpoint}
              onChange={(e) => onChange({ extraEndpoint: e.target.value })}
              placeholder="LastHour"
            />
            <p className="text-xs text-muted-foreground">
              LastHour, LastDay, LastWeek, LastMonth oder LastYear. API-Token im
              Technitium-Dashboard erzeugen.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Cluster-Node (optional)</Label>
            <Input
              value={form.extraNode}
              onChange={(e) => onChange({ extraNode: e.target.value })}
              placeholder="Leer = aktueller Node"
            />
          </div>
        </>
      )}

      {form.widgetType === "qnap" && (
        <>
          <div className="space-y-2">
            <Label>Volume-Name (optional)</Label>
            <Input
              value={form.extraEntity}
              onChange={(e) => onChange({ extraEntity: e.target.value })}
              placeholder="Leer = alle Volumes"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Benutzer braucht Systemüberwachung-Rechte, 2FA muss deaktiviert sein.
          </p>
        </>
      )}

      {form.widgetType === "guacamole" && (
        <div className="space-y-2">
          <Label>Datenquelle (optional)</Label>
          <Input
            value={form.extraEndpoint}
            onChange={(e) => onChange({ extraEndpoint: e.target.value })}
            placeholder="postgresql oder mysql"
          />
        </div>
      )}

      {form.widgetType === "adguard" && (
        <p className="text-xs text-muted-foreground">
          Admin-Passwort der AdGuard-Weboberfläche. Optional Benutzername, Standard
          ist <code className="text-[10px]">admin</code>.
        </p>
      )}

      {form.widgetType === "npm" && (
        <p className="text-xs text-muted-foreground">
          Login-Daten der NPM-Weboberfläche (Port 81). API-URL ohne{" "}
          <code className="text-[10px]">/api</code>.
        </p>
      )}

      {form.widgetType === "transmission" && (
        <p className="text-xs text-muted-foreground">
          RPC-URL zur Transmission-Instanz. Benutzername leer lassen, wenn nur
          Passwort gesetzt ist.
        </p>
      )}

      {form.widgetType === "deluge" && (
        <p className="text-xs text-muted-foreground">
          Deluge-WebUI-URL. Passwort aus den WebUI-Einstellungen (
          <code className="text-[10px]">/json</code>-API).
        </p>
      )}

      {form.widgetType === "audiobookshelf" && (
        <p className="text-xs text-muted-foreground">
          API-Token unter Benutzer → API Keys erzeugen.
        </p>
      )}

      {form.widgetType === "n8n" && (
        <p className="text-xs text-muted-foreground">
          API-Key unter Einstellungen → API. Basis-URL ohne Pfad.
        </p>
      )}

      {form.widgetType === "grafana" && (
        <p className="text-xs text-muted-foreground">
          Service-Account- oder API-Key mit Lesezugriff auf Organisation/Stats.
        </p>
      )}

      {form.widgetType === "paperless" && (
        <p className="text-xs text-muted-foreground">
          API-Token unter Benutzerprofil → API Tokens erzeugen.
        </p>
      )}

      {form.widgetType === "tautulli" && (
        <p className="text-xs text-muted-foreground">
          API-Key aus Tautulli → Einstellungen → Webinterface.
        </p>
      )}

      {form.widgetType === "navidrome" && (
        <p className="text-xs text-muted-foreground">
          Navidrome-Zugangsdaten (Subsonic-API). URL zur Web-Oberfläche.
        </p>
      )}

      {form.widgetType === "fritzbox" && (
        <p className="text-xs text-muted-foreground">
          Keine Anmeldung nötig (UPnP/TR-064). URL zur Fritz!Box, z. B.{" "}
          <code className="text-[10px]">http://192.168.178.1</code>. UPnP-Zugriff
          für Apps muss aktiv sein.
        </p>
      )}

      {form.widgetType === "filebrowser" && (
        <p className="text-xs text-muted-foreground">
          Admin-Zugang für Login und Speicher-Statistik (
          <code className="text-[10px]">/api/usage</code>).
        </p>
      )}
    </>
  );
}

function getApiKeyLabel(widgetType: string): string {
  if (widgetType === "portainer") return "API-Token";
  if (widgetType === "pihole") return "App-Passwort / API-Key";
  if (widgetType === "adguard") return "Passwort";
  if (widgetType === "plex") return "Plex-Token";
  if (widgetType === "nextcloud") return "NC-Token";
  if (widgetType === "immich") return "API-Key (server.statistics)";
  if (widgetType === "kavita") return "Auth-Key";
  if (widgetType === "technitium") return "API-Token";
  if (widgetType === "audiobookshelf") return "API-Token";
  if (widgetType === "paperless") return "API-Token";
  if (widgetType === "tautulli") return "API-Key";
  if (widgetType === "n8n") return "API-Key";
  if (widgetType === "grafana") return "API-Key";
  return "API-Key";
}

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
