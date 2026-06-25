import {
  fetchWithTimeout,
  formatBytesPerSec,
  type WidgetConfigInput,
  type WidgetResult,
} from "./base";

async function loginQbittorrent(
  apiUrl: string,
  username: string,
  password: string,
): Promise<string | null> {
  const body = new URLSearchParams({ username, password }).toString();
  const response = await fetchWithTimeout(`${apiUrl}/api/v2/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) return null;
  const cookie = response.headers.get("set-cookie");
  return cookie?.split(";")[0] ?? null;
}

export async function fetchQbittorrentWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const { apiUrl, credentials } = config;
  const username = credentials?.username ?? "admin";
  const password = credentials?.password ?? "";

  if (!password && !credentials?.apiKey) {
    return {
      title: "qBittorrent",
      status: "warning",
      fields: [],
      error: "Keine Zugangsdaten konfiguriert",
    };
  }

  try {
    const cookie = await loginQbittorrent(apiUrl, username, password);
    if (!cookie) {
      return {
        title: "qBittorrent",
        status: "error",
        fields: [],
        error: "Login fehlgeschlagen",
      };
    }

    const headers = { Cookie: cookie };
    const [transferRes, torrentsRes] = await Promise.all([
      fetchWithTimeout(`${apiUrl}/api/v2/transfer/info`, { headers }),
      fetchWithTimeout(`${apiUrl}/api/v2/torrents/info?filter=active`, {
        headers,
      }),
    ]);

    if (!transferRes.ok) {
      throw new Error(`Transfer API: ${transferRes.status}`);
    }

    const transfer = await transferRes.json();
    const torrents = torrentsRes.ok ? await torrentsRes.json() : [];

    return {
      title: "qBittorrent",
      status: "ok",
      fields: [
        {
          label: "Download",
          value: formatBytesPerSec(transfer.dl_info_speed ?? 0),
          highlight: true,
        },
        {
          label: "Upload",
          value: formatBytesPerSec(transfer.up_info_speed ?? 0),
        },
        {
          label: "Aktive Torrents",
          value: String(torrents.length ?? 0),
        },
        {
          label: "Queue",
          value: String(transfer.dl_info_data ?? 0 > 0 ? "Aktiv" : "Leer"),
        },
      ],
    };
  } catch (error) {
    return {
      title: "qBittorrent",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Nicht erreichbar",
    };
  }
}
