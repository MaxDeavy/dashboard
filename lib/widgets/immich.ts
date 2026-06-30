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
      error: "No API key configured",
    };
  }

  try {
    const headers = {
      Accept: "application/json",
      "x-api-key": apiKey,
    };

    const [statsRes, aboutRes, usersRes] = await Promise.all([
      fetchWithTimeout(
        `${base}/api/server/statistics`,
        { headers },
        config.extraConfig,
      ),
      fetchWithTimeout(`${base}/api/server/about`, { headers }, config.extraConfig).catch(() => null),
      fetchWithTimeout(`${base}/api/user`, { headers }, config.extraConfig).catch(() => null),
    ]);

    if (!statsRes.ok) {
      throw new Error(`API: ${statsRes.status}`);
    }

    const stats = (await statsRes.json()) as ImmichStatistics;
    const photos = stats.photos ?? 0;
    const videos = stats.videos ?? 0;
    const usage = stats.usage ?? 0;
    const usagePhotos = stats.usagePhotos ?? 0;
    const usageVideos = stats.usageVideos ?? 0;
    const about = aboutRes?.ok
      ? ((await aboutRes.json()) as { version?: string })
      : {};
    const users = usersRes?.ok ? ((await usersRes.json()) as unknown[]).length : 0;

    return {
      title: "Immich",
      status: "ok",
      fields: [
        { label: "Photos", value: String(photos) },
        { label: "Videos", value: String(videos) },
        {
          label: "Storage",
          value: formatBytes(usage),
          highlight: usage > 0,
        },
        {
          label: "Photo Storage",
          value: formatBytes(usagePhotos),
        },
        {
          label: "Video Storage",
          value: formatBytes(usageVideos),
        },
        {
          label: "Users",
          value: String(users),
        },
        {
          label: "Version",
          value: about.version ?? "—",
        },
      ],
    };
  } catch (error) {
    return {
      title: "Immich",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Unreachable",
    };
  }
}
