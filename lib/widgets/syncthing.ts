import {
  fetchWithTimeout,
  formatBytes,
  normalizeApiUrl,
  type WidgetConfigInput,
  type WidgetResult,
} from "./base";

function syncthingBase(url: string): string {
  const base = normalizeApiUrl(url);
  return base.endsWith("/rest") ? base : `${base}/rest`;
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  }
  return `${Math.floor(seconds / 86400)}d`;
}

export async function fetchSyncthingWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const apiKey = config.credentials?.apiKey;
  const base = syncthingBase(config.apiUrl);

  if (!apiKey) {
    return {
      title: "Syncthing",
      status: "warning",
      fields: [],
      error: "API key required",
    };
  }

  try {
    const headers = { "X-API-Key": apiKey };

    const [statusRes, connectionsRes, configRes, folderStatsRes] =
      await Promise.all([
        fetchWithTimeout(`${base}/system/status`, { headers }, config.extraConfig),
        fetchWithTimeout(`${base}/system/connections`, { headers }, config.extraConfig),
        fetchWithTimeout(`${base}/config`, { headers }, config.extraConfig).catch(() => null),
        fetchWithTimeout(`${base}/stats/folder`, { headers }, config.extraConfig).catch(() => null),
      ]);

    if (!statusRes.ok) {
      throw new Error(`API: ${statusRes.status}`);
    }

    const status = (await statusRes.json()) as { uptime?: number };
    const connections = connectionsRes.ok
      ? ((await connectionsRes.json()) as {
          connections?: Record<string, { connected?: boolean }>;
          total?: { inBytesTotal?: number; outBytesTotal?: number };
        })
      : {};
    const deviceEntries = Object.values(connections.connections ?? {});
    const connected = deviceEntries.filter((entry) => entry.connected).length;

    const folderStats = folderStatsRes?.ok
      ? ((await folderStatsRes.json()) as Record<
          string,
          { lastFile?: { at?: string } }
        >)
      : {};
    const folders = configRes?.ok
      ? (((await configRes.json()) as { folders?: unknown[] }).folders?.length ?? 0)
      : Object.keys(folderStats).length;
    const lastScan = Object.values(folderStats)
      .map((entry) => entry.lastFile?.at)
      .filter(Boolean)
      .sort()
      .pop();

    return {
      title: "Syncthing",
      status: "ok",
      fields: [
        {
          label: "Uptime",
          value: status.uptime ? formatUptime(status.uptime) : "—",
        },
        {
          label: "Connected Devices",
          value: String(connected),
          highlight: connected > 0,
        },
        { label: "Total Devices", value: String(deviceEntries.length) },
        { label: "Folders", value: String(folders) },
        {
          label: "Data In",
          value: formatBytes(connections.total?.inBytesTotal ?? 0),
        },
        {
          label: "Data Out",
          value: formatBytes(connections.total?.outBytesTotal ?? 0),
        },
        { label: "Last Scan", value: lastScan ? lastScan.slice(0, 19) : "—" },
      ],
    };
  } catch (error) {
    return {
      title: "Syncthing",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Unreachable",
    };
  }
}
