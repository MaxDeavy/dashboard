import {
  fetchWithTimeout,
  normalizeApiUrl,
  type WidgetConfigInput,
  type WidgetResult,
} from "./base";

export async function fetchPaperlessWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const token = config.credentials?.apiKey;
  const base = normalizeApiUrl(config.apiUrl);

  if (!token) {
    return {
      title: "Paperless",
      status: "warning",
      fields: [],
      error: "API token required",
    };
  }

  try {
    const headers = { Authorization: `Token ${token}` };

    const statsRes = await fetchWithTimeout(
      `${base}/api/statistics/`,
      { headers },
      config.extraConfig,
    );

    if (!statsRes.ok) {
      throw new Error(`API: ${statsRes.status}`);
    }

    const stats = (await statsRes.json()) as {
      documents_total?: number;
      documents_inbox?: number;
      inbox_tag?: number;
      character_count?: number;
    };

    return {
      title: "Paperless",
      status: "ok",
      fields: [
        {
          label: "Documents",
          value: String(stats.documents_total ?? 0),
        },
        {
          label: "Inbox",
          value: String(stats.documents_inbox ?? 0),
          highlight: (stats.documents_inbox ?? 0) > 0,
        },
        {
          label: "Characters",
          value: formatCount(stats.character_count ?? 0),
        },
      ],
    };
  } catch (error) {
    return {
      title: "Paperless",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Unreachable",
    };
  }
}

function formatCount(value: number): string {
  if (value < 1_000_000) return `${(value / 1000).toFixed(1)}k`;
  return `${(value / 1_000_000).toFixed(1)}M`;
}
