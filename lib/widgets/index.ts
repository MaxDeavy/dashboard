import { decrypt } from "@/lib/crypto";
import { getServiceById } from "@/lib/db/queries";
import type { WidgetConfig } from "@/lib/db/schema";
import { withWidgetFetchContext } from "@/lib/server-fetch";
import { fetchArrWidget } from "./arr";
import type { WidgetConfigInput, WidgetCredentials, WidgetResult } from "./base";
import { credentialString } from "./base";
import { fetchAdguardWidget } from "./adguard";
import { fetchAudiobookshelfWidget } from "./audiobookshelf";
import { fetchDelugeWidget } from "./deluge";
import { fetchDockerWidget } from "./docker";
import { fetchFilebrowserWidget } from "./filebrowser";
import { fetchFritzboxWidget } from "./fritzbox";
import { fetchGenericWidget } from "./generic";
import { fetchGrafanaWidget } from "./grafana";
import { fetchGuacamoleWidget } from "./guacamole";
import { fetchHomeAssistantWidget } from "./homeassistant";
import { fetchImmichWidget } from "./immich";
import { fetchJellyfinWidget } from "./jellyfin";
import { fetchJellyseerrWidget } from "./jellyseerr";
import { fetchKavitaWidget } from "./kavita";
import { fetchMealieWidget } from "./mealie";
import { fetchN8nWidget } from "./n8n";
import { fetchNavidromeWidget } from "./navidrome";
import { fetchNextcloudWidget } from "./nextcloud";
import { fetchNpmWidget } from "./npm";
import { fetchOverseerrWidget } from "./overseerr";
import { fetchPaperlessWidget } from "./paperless";
import { fetchPiholeWidget } from "./pihole";
import { fetchPlexWidget } from "./plex";
import { fetchPortainerWidget } from "./portainer";
import { fetchProxmoxWidget } from "./proxmox";
import { fetchQbittorrentWidget } from "./qbittorrent";
import { fetchQnapWidget } from "./qnap";
import { fetchSabnzbdWidget } from "./sabnzbd";
import { fetchTautulliWidget } from "./tautulli";
import { fetchTechnitiumWidget } from "./technitium";
import { fetchTransmissionWidget } from "./transmission";

function normalizeCredentials(
  raw: Record<string, unknown> | null,
): WidgetCredentials | null {
  if (!raw) return null;

  const credentials: WidgetCredentials = {};
  for (const key of [
    "username",
    "password",
    "apiKey",
    "token",
    "tokenSecret",
  ] as const) {
    const value = credentialString(raw[key]);
    if (value) credentials[key] = value;
  }

  return Object.keys(credentials).length > 0 ? credentials : null;
}

function parseCredentials(
  encrypted: string | null,
): WidgetCredentials | null {
  if (!encrypted) return null;
  try {
    return normalizeCredentials(
      JSON.parse(decrypt(encrypted)) as Record<string, unknown>,
    );
  } catch {
    return null;
  }
}

function toConfigInput(config: WidgetConfig): WidgetConfigInput {
  const parsed = parseCredentials(config.credentials);
  return {
    widgetType: config.widgetType,
    apiUrl: config.apiUrl,
    credentials: parsed,
    credentialsStored: Boolean(config.credentials),
    extraConfig: config.extraConfig
      ? (JSON.parse(config.extraConfig) as Record<string, string>)
      : {},
  };
}

const widgetCache = new Map<
  number,
  { data: WidgetResult; expiresAt: number }
>();

const CACHE_TTL_MS = 30_000;

export function invalidateWidgetCache() {
  widgetCache.clear();
}

export async function fetchWidgetData(
  serviceId: number,
  config: WidgetConfig,
): Promise<WidgetResult> {
  const cached = widgetCache.get(serviceId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const input = toConfigInput(config);
  const service = await getServiceById(serviceId);
  const extraConfig = {
    ...input.extraConfig,
    ...(service?.insecureTls || input.extraConfig?.insecureTls === "true"
      ? { insecureTls: "true" }
      : {}),
  };
  const widgetInput = { ...input, extraConfig };
  let result: WidgetResult;

  result = await withWidgetFetchContext(extraConfig, async () => {
    switch (config.widgetType) {
      case "qbittorrent":
        return fetchQbittorrentWidget(widgetInput);
      case "transmission":
        return fetchTransmissionWidget(widgetInput);
      case "deluge":
        return fetchDelugeWidget(widgetInput);
      case "proxmox":
        return fetchProxmoxWidget(widgetInput);
      case "sonarr":
      case "radarr":
      case "lidarr":
      case "prowlarr":
      case "bazarr":
        return fetchArrWidget(widgetInput);
      case "docker":
        return fetchDockerWidget(widgetInput);
      case "portainer":
        return fetchPortainerWidget(widgetInput);
      case "npm":
        return fetchNpmWidget(widgetInput);
      case "pihole":
        return fetchPiholeWidget(widgetInput);
      case "adguard":
        return fetchAdguardWidget(widgetInput);
      case "jellyseerr":
        return fetchJellyseerrWidget(widgetInput);
      case "overseerr":
        return fetchOverseerrWidget(widgetInput);
      case "sabnzbd":
        return fetchSabnzbdWidget(widgetInput);
      case "homeassistant":
        return fetchHomeAssistantWidget(widgetInput);
      case "jellyfin":
        return fetchJellyfinWidget(widgetInput);
      case "plex":
        return fetchPlexWidget(widgetInput);
      case "tautulli":
        return fetchTautulliWidget(widgetInput);
      case "nextcloud":
        return fetchNextcloudWidget(widgetInput);
      case "immich":
        return fetchImmichWidget(widgetInput);
      case "mealie":
        return fetchMealieWidget(widgetInput);
      case "kavita":
        return fetchKavitaWidget(widgetInput);
      case "audiobookshelf":
        return fetchAudiobookshelfWidget(widgetInput);
      case "navidrome":
        return fetchNavidromeWidget(widgetInput);
      case "paperless":
        return fetchPaperlessWidget(widgetInput);
      case "n8n":
        return fetchN8nWidget(widgetInput);
      case "grafana":
        return fetchGrafanaWidget(widgetInput);
      case "technitium":
        return fetchTechnitiumWidget(widgetInput);
      case "qnap":
        return fetchQnapWidget(widgetInput);
      case "filebrowser":
        return fetchFilebrowserWidget(widgetInput);
      case "guacamole":
        return fetchGuacamoleWidget(widgetInput);
      case "fritzbox":
        return fetchFritzboxWidget(widgetInput);
      case "generic":
        return fetchGenericWidget(widgetInput);
      default:
        return {
          title: config.widgetType,
          status: "warning" as const,
          fields: [],
          error: `Unbekannter Widget-Typ: ${config.widgetType}`,
        };
    }
  });

  widgetCache.set(serviceId, {
    data: result,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return result;
}
