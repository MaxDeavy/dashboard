import {
  fetchWithTimeout,
  formatBytes,
  type WidgetConfigInput,
  type WidgetResult,
} from "./base";

interface KavitaServerStats {
  seriesCount?: number;
  series_count?: number;
  totalFiles?: number;
  total_files?: number;
  totalSize?: number;
  total_size?: number;
}

export async function fetchKavitaWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const apiKey = config.credentials?.apiKey;
  const base = config.apiUrl.replace(/\/$/, "");

  if (!apiKey) {
    return {
      title: "Kavita",
      status: "warning",
      fields: [],
      error: "No API key configured",
    };
  }

  try {
    const headers = {
      Accept: "application/json",
      "x-api-key": apiKey,
    };

    const response = await fetchWithTimeout(
      `${base}/api/Stats/server/stats`,
      { headers },
      config.extraConfig,
    );

    if (!response.ok) {
      throw new Error(`API: ${response.status}`);
    }

    const stats = (await response.json()) as KavitaServerStats;
    const series = stats.series_count ?? stats.seriesCount ?? 0;
    const files = stats.total_files ?? stats.totalFiles ?? 0;
    const size = stats.total_size ?? stats.totalSize ?? 0;

    return {
      title: "Kavita",
      status: "ok",
      fields: [
        {
          label: "Series",
          value: String(series),
          highlight: series > 0,
        },
        { label: "Files", value: String(files) },
        { label: "Storage", value: formatBytes(size) },
      ],
    };
  } catch (error) {
    return {
      title: "Kavita",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Unreachable",
    };
  }
}
