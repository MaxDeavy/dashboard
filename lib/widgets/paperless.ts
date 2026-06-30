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

    const [statsRes, tagsRes, correspondentsRes, docTypesRes] = await Promise.all([
      fetchWithTimeout(
        `${base}/api/statistics/`,
        { headers },
        config.extraConfig,
      ),
      fetchWithTimeout(`${base}/api/tags/?page_size=1`, { headers }, config.extraConfig).catch(() => null),
      fetchWithTimeout(
        `${base}/api/correspondents/?page_size=1`,
        { headers },
        config.extraConfig,
      ).catch(() => null),
      fetchWithTimeout(
        `${base}/api/document_types/?page_size=1`,
        { headers },
        config.extraConfig,
      ).catch(() => null),
    ]);

    if (!statsRes.ok) {
      throw new Error(`API: ${statsRes.status}`);
    }

    const stats = (await statsRes.json()) as {
      documents_total?: number;
      documents_inbox?: number;
      inbox_tag?: number;
      character_count?: number;
    };
    const tags = tagsRes?.ok
      ? (((await tagsRes.json()) as { count?: number }).count ?? 0)
      : 0;
    const correspondents = correspondentsRes?.ok
      ? (((await correspondentsRes.json()) as { count?: number }).count ?? 0)
      : 0;
    const documentTypes = docTypesRes?.ok
      ? (((await docTypesRes.json()) as { count?: number }).count ?? 0)
      : 0;

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
        {
          label: "Tags",
          value: String(tags),
        },
        {
          label: "Users",
          value: String(correspondents),
        },
        {
          label: "Categories",
          value: String(documentTypes),
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
