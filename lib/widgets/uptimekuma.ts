import {
  fetchWithTimeout,
  normalizeApiUrl,
  type WidgetConfigInput,
  type WidgetResult,
} from "./base";
import { parsePrometheusLabeledMetrics } from "./http-helpers";

interface HeartbeatPayload {
  heartbeatList?: Record<string, Array<{ status?: number }>>;
  uptimeList?: Record<string, number>;
}

function parseMetrics(text: string) {
  const { labeled } = parsePrometheusLabeledMetrics(text);
  let up = 0;
  let down = 0;
  let maintenance = 0;
  const responseTimes: number[] = [];

  for (const metric of labeled) {
    if (metric.name === "monitor_status") {
      if (metric.value === 1) up += 1;
      else if (metric.value === 0) down += 1;
      else if (metric.value === 3) maintenance += 1;
    }
    if (metric.name === "monitor_response_time" && metric.value >= 0) {
      responseTimes.push(metric.value);
    }
  }

  const total = up + down + maintenance;
  const avgResponse =
    responseTimes.length > 0
      ? responseTimes.reduce((sum, value) => sum + value, 0) /
        responseTimes.length
      : 0;

  return { up, down, maintenance, total, avgResponse };
}

function parseHeartbeat(payload: HeartbeatPayload) {
  let up = 0;
  let down = 0;
  let maintenance = 0;
  const uptimes: number[] = [];

  for (const beats of Object.values(payload.heartbeatList ?? {})) {
    const status = beats[0]?.status;
    if (status === 1) up += 1;
    else if (status === 0) down += 1;
    else if (status === 3) maintenance += 1;
  }

  for (const value of Object.values(payload.uptimeList ?? {})) {
    if (typeof value === "number") {
      uptimes.push(value);
    }
  }

  const avgUptime =
    uptimes.length > 0
      ? (uptimes.reduce((sum, value) => sum + value, 0) / uptimes.length) * 100
      : 0;

  return {
    up,
    down,
    maintenance,
    total: up + down + maintenance,
    avgUptime,
  };
}

export async function fetchUptimeKumaWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const apiKey = config.credentials?.apiKey;
  const base = normalizeApiUrl(config.apiUrl);
  const statusPageSlug = config.extraConfig?.statusPageSlug?.trim();

  if (!apiKey && !statusPageSlug) {
    return {
      title: "Uptime Kuma",
      status: "warning",
      fields: [],
      error: "API key or status page slug required",
    };
  }

  try {
    if (apiKey) {
      const auth = Buffer.from(`:${apiKey}`).toString("base64");
      const response = await fetchWithTimeout(
        `${base}/metrics`,
        { headers: { Authorization: `Basic ${auth}` } },
        config.extraConfig,
      );

      if (!response.ok) {
        throw new Error(`API: ${response.status}`);
      }

      const stats = parseMetrics(await response.text());

      return {
        title: "Uptime Kuma",
        status: "ok",
        fields: [
          {
            label: "Monitors Up",
            value: String(stats.up),
            highlight: stats.up > 0,
          },
          {
            label: "Monitors Down",
            value: String(stats.down),
            highlight: stats.down > 0,
          },
          { label: "Monitors Total", value: String(stats.total) },
          {
            label: "Maintenance",
            value: String(stats.maintenance),
            highlight: stats.maintenance > 0,
          },
          {
            label: "Avg Response Time",
            value:
              stats.avgResponse > 0
                ? `${stats.avgResponse.toFixed(0)} ms`
                : "—",
          },
        ],
      };
    }

    const response = await fetchWithTimeout(
      `${base}/api/status-page/heartbeat/${encodeURIComponent(statusPageSlug!)}`,
      {},
      config.extraConfig,
    );

    if (!response.ok) {
      throw new Error(`API: ${response.status}`);
    }

    const stats = parseHeartbeat(
      (await response.json()) as HeartbeatPayload,
    );

    return {
      title: "Uptime Kuma",
      status: "ok",
      fields: [
        {
          label: "Monitors Up",
          value: String(stats.up),
          highlight: stats.up > 0,
        },
        {
          label: "Monitors Down",
          value: String(stats.down),
          highlight: stats.down > 0,
        },
        { label: "Monitors Total", value: String(stats.total) },
        {
          label: "Maintenance",
          value: String(stats.maintenance),
          highlight: stats.maintenance > 0,
        },
        {
          label: "24h Avg Uptime",
          value:
            stats.avgUptime > 0 ? `${stats.avgUptime.toFixed(1)}%` : "—",
        },
      ],
    };
  } catch (error) {
    return {
      title: "Uptime Kuma",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Unreachable",
    };
  }
}
