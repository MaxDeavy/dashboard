import {
  fetchWithTimeout,
  formatBytes,
  normalizeApiUrl,
  type WidgetConfigInput,
  type WidgetResult,
} from "./base";

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

function triliumBase(url: string): string {
  return normalizeApiUrl(url).replace(/\/etapi$/i, "");
}

export async function fetchTriliumWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const token = config.credentials?.token;
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
    const response = await fetchWithTimeout(
      `${base}/etapi/metrics?format=json`,
      {
        headers: { Authorization: token },
      },
      config.extraConfig,
    );

    if (!response.ok) {
      throw new Error(`API: ${response.status}`);
    }

    const metrics = (await response.json()) as TriliumMetrics;
    const database = metrics.database ?? {};
    const activeNotes = database.activeNotes ?? 0;
    const deletedNotes = database.deletedNotes ?? 0;
    const dbSize = metrics.statistics?.databaseSizeBytes ?? 0;

    return {
      title: "Trilium",
      status: "ok",
      fields: [
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
        {
          label: "Version",
          value: metrics.version?.app || "—",
        },
      ],
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
