import { fetchWithTimeout, type WidgetConfigInput, type WidgetResult } from "./base";

const ARR_APPS: Record<string, { title: string; apiPath: string }> = {
  sonarr: { title: "Sonarr", apiPath: "/api/v3" },
  radarr: { title: "Radarr", apiPath: "/api/v3" },
  lidarr: { title: "Lidarr", apiPath: "/api/v1" },
  prowlarr: { title: "Prowlarr", apiPath: "/api/v1" },
  bazarr: { title: "Bazarr", apiPath: "/api/v1" },
};

export async function fetchArrWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const app = ARR_APPS[config.widgetType] ?? ARR_APPS.sonarr;
  const apiKey = config.credentials?.apiKey;

  if (!apiKey) {
    return {
      title: app.title,
      status: "warning",
      fields: [],
      error: "No API key configured",
    };
  }

  try {
    const base = `${config.apiUrl}${app.apiPath}`;
    const headers = { "X-Api-Key": apiKey };

    const [queueRes, wantedRes, indexerRes] = await Promise.all([
      fetchWithTimeout(`${base}/queue/status`, { headers }),
      fetchWithTimeout(`${base}/wanted/missing?page=1&pageSize=1`, { headers }),
      config.widgetType === "prowlarr"
        ? fetchWithTimeout(`${base}/indexer`, { headers })
        : Promise.resolve(null),
    ]);

    let queueCount = 0;
    let queueTotal = 0;

    if (queueRes.ok) {
      const queue = await queueRes.json();
      queueCount = queue.totalCount ?? queue.records?.length ?? 0;
      queueTotal = queue.totalSize ?? 0;
    }

    let missingCount = 0;
    if (wantedRes?.ok) {
      const wanted = await wantedRes.json();
      missingCount = wanted.totalRecords ?? 0;
    }

    if (config.widgetType === "prowlarr") {
      let indexerCount = 0;
      let enabledCount = 0;
      if (indexerRes?.ok) {
        const indexers = await indexerRes.json();
        if (Array.isArray(indexers)) {
          indexerCount = indexers.length;
          enabledCount = indexers.filter((i: { enable?: boolean }) => i.enable).length;
        }
      }

      return {
        title: app.title,
        status: "ok",
        fields: [
          {
            label: "Total Indexers",
            value: String(indexerCount),
          },
          {
            label: "Active",
            value: String(enabledCount),
            highlight: enabledCount > 0,
          },
          {
            label: "Queue",
            value: String(queueCount),
            highlight: queueCount > 0,
          },
        ],
      };
    }

    return {
      title: app.title,
      status: "ok",
      fields: [
        {
          label: "Queue",
          value: String(queueCount),
          highlight: queueCount > 0,
        },
        {
          label: "Queue Size",
          value: formatSize(queueTotal),
        },
        {
          label: "Missing",
          value: String(missingCount),
          highlight: missingCount > 0,
        },
      ],
    };
  } catch (error) {
    return {
      title: app.title,
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Unreachable",
    };
  }
}

function formatSize(bytes: number): string {
  if (!bytes) return "0 B";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
