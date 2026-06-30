import {
  fetchWithTimeout,
  formatBytes,
  formatBytesPerSec,
  type WidgetConfigInput,
  type WidgetResult,
} from "./base";

export async function fetchSabnzbdWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const apiKey = config.credentials?.apiKey;
  const base = config.apiUrl.replace(/\/$/, "");

  if (!apiKey) {
    return {
      title: "SABnzbd",
      status: "warning",
      fields: [],
      error: "No API key configured",
    };
  }

  try {
    const [queueRes, statusRes] = await Promise.all([
      fetchWithTimeout(
        `${base}/api?mode=queue&output=json&apikey=${encodeURIComponent(apiKey)}`,
      ),
      fetchWithTimeout(
        `${base}/api?mode=status&output=json&apikey=${encodeURIComponent(apiKey)}`,
      ),
    ]);

    if (!statusRes.ok) {
      throw new Error(`Status API: ${statusRes.status}`);
    }

    const status = await statusRes.json();
    const queue = queueRes.ok ? await queueRes.json() : { queue: { slots: [] } };
    const slots = queue?.queue?.slots ?? [];
    const speed = status?.status?.speed ?? 0;
    const remaining = status?.status?.mb ?? 0;
    const paused = Boolean(status?.status?.paused);
    const diskSpace = Number(status?.status?.diskspace1 ?? 0);
    const version = status?.status?.version ?? "—";

    return {
      title: "SABnzbd",
      status: "ok",
      fields: [
        {
          label: "Download",
          value: formatBytesPerSec(Number(speed) * 1024),
          highlight: Number(speed) > 0,
        },
        {
          label: "Queue",
          value: String(slots.length),
          highlight: slots.length > 0,
        },
        {
          label: "Remaining",
          value: `${Number(remaining).toFixed(1)} MB`,
        },
        {
          label: "Status",
          value: status?.status?.status ?? "unknown",
        },
        {
          label: "Paused",
          value: paused ? "Yes" : "No",
          highlight: paused,
        },
        {
          label: "Free Storage",
          value: diskSpace > 0 ? formatBytes(diskSpace * 1024 * 1024) : "—",
        },
        {
          label: "Version",
          value: String(version),
        },
      ],
    };
  } catch (error) {
    return {
      title: "SABnzbd",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Unreachable",
    };
  }
}
