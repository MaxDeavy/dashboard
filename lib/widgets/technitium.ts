import {
  fetchWithTimeout,
  normalizeApiUrl,
  type WidgetConfigInput,
  type WidgetResult,
} from "./base";

interface TechnitiumStats {
  totalQueries?: number;
  totalBlocked?: number;
  totalCached?: number;
  totalClients?: number;
}

const VALID_RANGES = new Set([
  "LastHour",
  "LastDay",
  "LastWeek",
  "LastMonth",
  "LastYear",
]);

async function fetchTechnitiumStats(
  base: string,
  apiKey: string,
  range: string,
  node: string | undefined,
  extraConfig?: Record<string, string>,
): Promise<TechnitiumStats> {
  const params = new URLSearchParams({
    type: range,
    utc: "true",
  });
  if (node) {
    params.set("node", node);
  }

  const url = `${base}/api/dashboard/stats/get?${params.toString()}`;
  const authHeaders = { Authorization: `Bearer ${apiKey}` };

  let response = await fetchWithTimeout(
    url,
    { headers: authHeaders },
    extraConfig,
  );

  if (!response.ok) {
    response = await fetchWithTimeout(
      `${url}&token=${encodeURIComponent(apiKey)}`,
      {},
      extraConfig,
    );
  }

  if (!response.ok) {
    throw new Error(`API: ${response.status}`);
  }

  const payload = (await response.json()) as {
    status?: string;
    response?: { stats?: TechnitiumStats };
  };

  if (payload.status && payload.status !== "ok") {
    throw new Error("API: Invalid response");
  }

  return payload.response?.stats ?? {};
}

export async function fetchTechnitiumWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const apiKey = config.credentials?.apiKey;
  const base = normalizeApiUrl(config.apiUrl);
  const rangeInput = config.extraConfig?.range ?? config.extraConfig?.endpointId;
  const range =
    rangeInput && VALID_RANGES.has(rangeInput) ? rangeInput : "LastHour";
  const node = config.extraConfig?.node?.trim() || undefined;

  if (!apiKey) {
    return {
      title: "Technitium",
      status: "warning",
      fields: [],
      error: "No API token configured",
    };
  }

  try {
    const stats = await fetchTechnitiumStats(
      base,
      apiKey,
      range,
      node,
      config.extraConfig,
    );

    return {
      title: "Technitium DNS",
      status: "ok",
      fields: [
        {
          label: "Queries",
          value: String(stats.totalQueries ?? 0),
        },
        {
          label: "Blocked",
          value: String(stats.totalBlocked ?? 0),
          highlight: (stats.totalBlocked ?? 0) > 0,
        },
        {
          label: "Cache",
          value: String(stats.totalCached ?? 0),
        },
        {
          label: "Clients",
          value: String(stats.totalClients ?? 0),
        },
      ],
    };
  } catch (error) {
    return {
      title: "Technitium DNS",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Unreachable",
    };
  }
}
