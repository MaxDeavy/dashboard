import {
  fetchWithTimeout,
  formatBytes,
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
      error: "No credentials configured",
    };
  }

  try {
    const cookie = await loginQbittorrent(apiUrl, username, password);
    if (!cookie) {
      return {
        title: "qBittorrent",
        status: "error",
        fields: [],
        error: "Login failed",
      };
    }

    const headers = { Cookie: cookie };
    const [transferRes, activeRes, allTorrentsRes] = await Promise.all([
      fetchWithTimeout(`${apiUrl}/api/v2/transfer/info`, { headers }),
      fetchWithTimeout(`${apiUrl}/api/v2/torrents/info?filter=active`, {
        headers,
      }),
      fetchWithTimeout(`${apiUrl}/api/v2/torrents/info`, {
        headers,
      }),
    ]);

    if (!transferRes.ok) {
      throw new Error(`Transfer API: ${transferRes.status}`);
    }

    const transfer = await transferRes.json();
    const activeTorrents = activeRes.ok ? await activeRes.json() : [];
    const allTorrents = allTorrentsRes.ok ? await allTorrentsRes.json() : [];
    const queuedCount = Array.isArray(allTorrents)
      ? allTorrents.filter(
          (torrent: { state?: string }) =>
            torrent.state?.includes("queued") ||
            torrent.state?.includes("stalled"),
        ).length
      : 0;
    const freeSpace = Number(transfer.free_space_on_disk ?? 0);
    const dlInfoData = Number(transfer.dl_info_data ?? 0);
    const connectionStatus = transfer.connection_status ?? "unknown";

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
          label: "Active Torrents",
          value: String(activeTorrents.length ?? 0),
          highlight: (activeTorrents.length ?? 0) > 0,
        },
        {
          label: "Queue",
          value: dlInfoData > 0 ? "Active" : "Empty",
        },
        {
          label: "Total",
          value: String(allTorrents.length ?? 0),
        },
        {
          label: "Free Storage",
          value: formatBytes(freeSpace),
        },
        {
          label: "Total Download",
          value: formatBytes(Number(transfer.alltime_dl ?? 0)),
        },
        {
          label: "Total Upload",
          value: formatBytes(Number(transfer.alltime_ul ?? 0)),
        },
        {
          label: "Status",
          value: String(connectionStatus),
          highlight: connectionStatus === "connected",
        },
        {
          label: "Pending",
          value: String(queuedCount),
          highlight: queuedCount > 0,
        },
      ],
    };
  } catch (error) {
    return {
      title: "qBittorrent",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Unreachable",
    };
  }
}
