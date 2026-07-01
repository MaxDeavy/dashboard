import {
  fetchWithTimeout,
  formatBytes,
  normalizeApiUrl,
  type WidgetConfigInput,
  type WidgetResult,
} from "./base";
import { parsePrometheusLabeledMetrics } from "./http-helpers";

interface TriliumMetrics {
  version?: { app?: string };
  database?: {
    activeNotes?: number;
    deletedNotes?: number;
    activeAttachments?: number;
    totalBranches?: number;
    totalAttributes?: number;
    totalRevisions?: number;
  };
  statistics?: {
    databaseSizeBytes?: number;
  };
}

interface TriliumAppInfo {
  appVersion?: string;
  dbVersion?: number;
  utcDateTime?: string;
}

function triliumBase(url: string): string {
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    parsed.search = "";
    parsed.hash = "";
    parsed.pathname = parsed.pathname
      .replace(/\/etapi\/.*$/i, "")
      .replace(/\/api\/metrics$/i, "")
      .replace(/\/$/, "");
    return `${parsed.origin}${parsed.pathname}`.replace(/\/$/, "");
  } catch {
    return normalizeApiUrl(trimmed).replace(/\/etapi(\/.*)?$/i, "");
  }
}

function triliumToken(config: WidgetConfigInput): string | undefined {
  return config.credentials?.token?.trim() || config.credentials?.apiKey?.trim();
}

function triliumAuthHeaderSets(token: string): Record<string, string>[] {
  const trimmed = token.trim();
  const basic = Buffer.from(`etapi:${trimmed}`).toString("base64");
  return [
    { Authorization: trimmed },
    { Authorization: `Bearer ${trimmed}` },
    { Authorization: `Basic ${basic}` },
  ];
}

function parsePrometheusMetrics(text: string): TriliumMetrics {
  const { labeled } = parsePrometheusLabeledMetrics(text);
  const metrics: TriliumMetrics = {
    version: {},
    database: {},
    statistics: {},
  };

  for (const metric of labeled) {
    if (metric.name === "trilium_info" && metric.labels.version) {
      metrics.version!.app = metric.labels.version;
    }
    if (metric.name === "trilium_notes_active") {
      metrics.database!.activeNotes = metric.value;
    }
    if (metric.name === "trilium_notes_deleted") {
      metrics.database!.deletedNotes = metric.value;
    }
    if (metric.name === "trilium_attachments_active") {
      metrics.database!.activeAttachments = metric.value;
    }
    if (metric.name === "trilium_branches_total") {
      metrics.database!.totalBranches = metric.value;
    }
    if (metric.name === "trilium_attributes_total") {
      metrics.database!.totalAttributes = metric.value;
    }
    if (metric.name === "trilium_revisions_total") {
      metrics.database!.totalRevisions = metric.value;
    }
    if (metric.name === "trilium_database_size_bytes") {
      metrics.statistics!.databaseSizeBytes = metric.value;
    }
  }

  return metrics;
}

async function fetchWithTriliumAuth(
  url: string,
  token: string,
  extraConfig?: Record<string, string>,
): Promise<Response | null> {
  let lastResponse: Response | null = null;

  for (const headers of triliumAuthHeaderSets(token)) {
    const response = await fetchWithTimeout(url, { headers }, extraConfig);
    if (response.ok) {
      return response;
    }
    lastResponse = response;
    if (response.status !== 401 && response.status !== 404) {
      return response;
    }
  }

  return lastResponse;
}

async function fetchTriliumMetrics(
  base: string,
  token: string,
  extraConfig?: Record<string, string>,
): Promise<TriliumMetrics | null> {
  const endpoints = [
    `${base}/etapi/metrics?format=json`,
    `${base}/etapi/metrics`,
  ];

  for (const endpoint of endpoints) {
    const response = await fetchWithTriliumAuth(endpoint, token, extraConfig);
    if (!response?.ok) {
      continue;
    }

    const text = await response.text();
    if (text.trim().startsWith("{")) {
      return JSON.parse(text) as TriliumMetrics;
    }

    return parsePrometheusMetrics(text);
  }

  return null;
}

async function fetchTriliumAppInfo(
  base: string,
  token: string,
  extraConfig?: Record<string, string>,
): Promise<TriliumAppInfo | null> {
  const response = await fetchWithTriliumAuth(
    `${base}/etapi/app-info`,
    token,
    extraConfig,
  );
  if (!response?.ok) {
    return null;
  }
  return (await response.json()) as TriliumAppInfo;
}

export async function fetchTriliumWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const token = triliumToken(config);
  const base = triliumBase(config.apiUrl);

  if (!token) {
    return {
      title: "Trilium",
      status: "warning",
      fields: [],
      error: "No API token configured",
    };
  }

  try {
    const metrics = await fetchTriliumMetrics(base, token, config.extraConfig);
    const appInfo = metrics
      ? null
      : await fetchTriliumAppInfo(base, token, config.extraConfig);

    if (!metrics && !appInfo) {
      throw new Error("API: 404");
    }

    const database = metrics?.database ?? {};
    const activeNotes = database.activeNotes ?? 0;
    const deletedNotes = database.deletedNotes ?? 0;
    const dbSize = metrics?.statistics?.databaseSizeBytes ?? 0;
    const version =
      metrics?.version?.app || appInfo?.appVersion || "—";

    const fields = metrics
      ? [
          {
            label: "Notes",
            value: String(activeNotes),
            highlight: activeNotes > 0,
          },
          {
            label: "Attachments",
            value: String(database.activeAttachments ?? 0),
          },
          {
            label: "Branches",
            value: String(database.totalBranches ?? 0),
          },
          {
            label: "Attributes",
            value: String(database.totalAttributes ?? 0),
          },
          {
            label: "Revisions",
            value: String(database.totalRevisions ?? 0),
          },
          {
            label: "Storage",
            value: dbSize > 0 ? formatBytes(dbSize) : "—",
          },
          {
            label: "Deleted",
            value: String(deletedNotes),
            highlight: deletedNotes > 0,
          },
          { label: "Version", value: version },
        ]
      : [
          { label: "Version", value: version },
          {
            label: "DB Version",
            value:
              appInfo?.dbVersion != null ? String(appInfo.dbVersion) : "—",
          },
          {
            label: "Status",
            value: "Metrics unavailable",
          },
          {
            label: "Note",
            value: "TriliumNext ≥ 0.94 required",
          },
        ];

    return {
      title: "Trilium",
      status: "ok",
      fields,
    };
  } catch (error) {
    return {
      title: "Trilium",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Unreachable",
    };
  }
}
