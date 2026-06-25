import {
  fetchWithTimeout,
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
