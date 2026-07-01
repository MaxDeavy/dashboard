import {
  fetchWithTimeout,
  normalizeApiUrl,
  type WidgetConfigInput,
  type WidgetResult,
} from "./base";

interface AutobrrStats {
  total_count?: number;
  filtered_count?: number;
  filter_rejected_count?: number;
  push_approved_count?: number;
  push_rejected_count?: number;
  push_error_count?: number;
}

function autobrrBase(url: string): string {
  const base = normalizeApiUrl(url);
  return base.endsWith("/api") ? base : `${base}/api`;
}

export async function fetchAutobrrWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const token = config.credentials?.apiKey;
  const base = autobrrBase(config.apiUrl);

  if (!token) {
    return {
      title: "Autobrr",
      status: "warning",
      fields: [],
      error: "API key required",
    };
  }

  try {
    const headers = { "X-API-Token": token };

    const [statsRes, filtersRes, indexersRes] = await Promise.all([
      fetchWithTimeout(`${base}/release/stats`, { headers }, config.extraConfig),
      fetchWithTimeout(`${base}/filters`, { headers }, config.extraConfig).catch(() => null),
      fetchWithTimeout(`${base}/indexer`, { headers }, config.extraConfig).catch(() => null),
    ]);

    if (!statsRes.ok) {
      throw new Error(`API: ${statsRes.status}`);
    }

    const stats = (await statsRes.json()) as AutobrrStats;
    const filters = filtersRes?.ok
      ? ((await filtersRes.json()) as Array<{ enabled?: boolean }>)
      : [];
    const enabledFilters = filters.filter((filter) => filter.enabled !== false).length;
    const indexers = indexersRes?.ok
      ? ((await indexersRes.json()) as unknown[]).length
      : 0;

    return {
      title: "Autobrr",
      status: "ok",
      fields: [
        {
          label: "Approved Pushes",
          value: String(stats.push_approved_count ?? 0),
          highlight: (stats.push_approved_count ?? 0) > 0,
        },
        {
          label: "Rejected Pushes",
          value: String(stats.push_rejected_count ?? 0),
        },
        {
          label: "Push Errors",
          value: String(stats.push_error_count ?? 0),
          highlight: (stats.push_error_count ?? 0) > 0,
        },
        { label: "Total Releases", value: String(stats.total_count ?? 0) },
        { label: "Active Filters", value: String(enabledFilters) },
        { label: "Indexers", value: String(indexers) },
        {
          label: "Filter Rejected",
          value: String(stats.filter_rejected_count ?? 0),
        },
        { label: "Filtered", value: String(stats.filtered_count ?? 0) },
      ],
    };
  } catch (error) {
    return {
      title: "Autobrr",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Unreachable",
    };
  }
}
