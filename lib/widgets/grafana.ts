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

    const [healthRes, statsRes, datasourcesRes, orgsRes] = await Promise.all([
      fetchWithTimeout(`${base}/api/health`, { headers }, config.extraConfig),
      fetchWithTimeout(`${base}/api/admin/stats`, { headers }, config.extraConfig),
      fetchWithTimeout(`${base}/api/datasources`, { headers }, config.extraConfig).catch(() => null),
      fetchWithTimeout(`${base}/api/orgs`, { headers }, config.extraConfig).catch(() => null),
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
    const datasources = datasourcesRes?.ok
      ? ((await datasourcesRes.json()) as unknown[]).length
      : 0;
    const orgs = orgsRes?.ok ? ((await orgsRes.json()) as unknown[]).length : 0;

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
        {
          label: "Data Source",
          value: String(datasources),
        },
        {
          label: "Total",
          value: String(orgs),
        },
        {
          label: "Active",
          value: String(users),
          highlight: users > 0,
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
