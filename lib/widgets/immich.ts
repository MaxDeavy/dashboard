import {
  fetchWithTimeout,
  formatBytes,
  type WidgetConfigInput,
  type WidgetResult,
} from "./base";

interface ImmichStatistics {
  photos?: number;
  videos?: number;
  usage?: number;
  usagePhotos?: number;
  usageVideos?: number;
}

export async function fetchImmichWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const apiKey = config.credentials?.apiKey;
  const base = config.apiUrl.replace(/\/$/, "");

  if (!apiKey) {
    return {
      title: "Immich",
      status: "warning",
      fields: [],
      error: "Kein API-Key konfiguriert",
    };
  }

  try {
    const headers = {
      Accept: "application/json",
      "x-api-key": apiKey,
    };

    const response = await fetchWithTimeout(
      `${base}/api/server/statistics`,
      { headers },
      config.extraConfig,
    );

    if (!response.ok) {
      throw new Error(`API: ${response.status}`);
    }

    const stats = (await response.json()) as ImmichStatistics;
    const photos = stats.photos ?? 0;
    const videos = stats.videos ?? 0;
    const usage = stats.usage ?? 0;

    return {
      title: "Immich",
      status: "ok",
      fields: [
        { label: "Fotos", value: String(photos) },
        { label: "Videos", value: String(videos) },
        {
          label: "Speicher",
          value: formatBytes(usage),
          highlight: usage > 0,
        },
      ],
    };
  } catch (error) {
    return {
      title: "Immich",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Nicht erreichbar",
    };
  }
}
