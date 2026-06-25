import {
  fetchWithTimeout,
  normalizeApiUrl,
  type WidgetConfigInput,
  type WidgetResult,
} from "./base";

export async function fetchGrafanaWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const apiKey = config.credentials?.apiKey;
  const base = normalizeApiUrl(config.apiUrl);

  if (!apiKey) {
    return {
      title: "Grafana",
      status: "warning",
      fields: [],
      error: "API key required",
    };
  }

  try {
    const headers = { Authorization: `Bearer ${apiKey}` };

    const [healthRes, statsRes] = await Promise.all([
      fetchWithTimeout(`${base}/api/health`, { headers }, config.extraConfig),
      fetchWithTimeout(`${base}/api/admin/stats`, { headers }, config.extraConfig),
    ]);

    if (!healthRes.ok) {
      throw new Error(`Health: ${healthRes.status}`);
    }

    const health = (await healthRes.json()) as {
      database?: string;
      version?: string;
    };

    let dashboards = 0;
    let users = 0;
    let alerts = 0;

    if (statsRes.ok) {
      const stats = (await statsRes.json()) as {
        dashboards?: number;
        users?: number;
        alerts?: number;
      };
      dashboards = stats.dashboards ?? 0;
      users = stats.users ?? 0;
      alerts = stats.alerts ?? 0;
    }

    return {
      title: "Grafana",
      status: "ok",
      fields: [
        {
          label: "Version",
          value: health.version ?? "—",
        },
        {
          label: "Dashboards",
          value: String(dashboards),
        },
        {
          label: "Users",
          value: String(users),
        },
        {
          label: "Alerts",
          value: String(alerts),
          highlight: alerts > 0,
        },
      ],
    };
  } catch (error) {
    return {
      title: "Grafana",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Unreachable",
    };
  }
}
