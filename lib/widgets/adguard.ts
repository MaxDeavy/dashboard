import {
  credentialString,
  fetchWithTimeout,
  formatPercent,
  normalizeApiUrl,
  type WidgetConfigInput,
  type WidgetResult,
} from "./base";

interface AdGuardStats {
  num_dns_queries?: number;
  num_blocked_filtering?: number;
  num_replaced_safebrowsing?: number;
  num_replaced_safesearch?: number;
  avg_processing_time?: number;
}

export async function fetchAdguardWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const password = credentialString(config.credentials?.apiKey);
  const base = normalizeApiUrl(config.apiUrl);

  if (!password) {
    return {
      title: "AdGuard",
      status: "warning",
      fields: [],
      error: "Password required",
    };
  }

  try {
    const loginRes = await fetchWithTimeout(
      `${base}/control/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: credentialString(config.credentials?.username) || "admin",
          password,
        }),
      },
      config.extraConfig,
    );

    if (!loginRes.ok) {
      throw new Error(`Login: ${loginRes.status}`);
    }

    const cookie = loginRes.headers.get("set-cookie") ?? "";

    const statsRes = await fetchWithTimeout(
      `${base}/control/stats`,
      {
        headers: cookie ? { Cookie: cookie.split(";")[0] } : {},
      },
      config.extraConfig,
    );

    if (!statsRes.ok) {
      throw new Error(`Stats: ${statsRes.status}`);
    }

    const stats = (await statsRes.json()) as AdGuardStats;
    const queries = stats.num_dns_queries ?? 0;
    const blocked = stats.num_blocked_filtering ?? 0;
    const blockRate = queries > 0 ? (blocked / queries) * 100 : 0;

    return {
      title: "AdGuard",
      status: "ok",
      fields: [
        {
          label: "DNS Queries",
          value: String(queries),
        },
        {
          label: "Blocked",
          value: String(blocked),
          highlight: blocked > 0,
        },
        {
          label: "Block Rate",
          value: formatPercent(blockRate),
        },
        {
          label: "Avg Latency",
          value: stats.avg_processing_time
            ? `${stats.avg_processing_time.toFixed(2)} ms`
            : "—",
        },
      ],
    };
  } catch (error) {
    return {
      title: "AdGuard",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Unreachable",
    };
  }
}
