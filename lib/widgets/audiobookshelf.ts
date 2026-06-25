import {
  fetchWithTimeout,
  normalizeApiUrl,
  type WidgetConfigInput,
  type WidgetResult,
} from "./base";

export async function fetchAudiobookshelfWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const token = config.credentials?.apiKey;
  const base = normalizeApiUrl(config.apiUrl);

  if (!token) {
    return {
      title: "Audiobookshelf",
      status: "warning",
      fields: [],
      error: "API token required",
    };
  }

  try {
    const headers = { Authorization: `Bearer ${token}` };

    const [meRes, librariesRes, sessionsRes] = await Promise.all([
      fetchWithTimeout(`${base}/api/me`, { headers }, config.extraConfig),
      fetchWithTimeout(`${base}/api/libraries`, { headers }, config.extraConfig),
      fetchWithTimeout(`${base}/api/sessions`, { headers }, config.extraConfig),
    ]);

    if (!meRes.ok) {
      throw new Error(`API: ${meRes.status}`);
    }

    const libraries = librariesRes.ok
      ? ((await librariesRes.json()) as { libraries?: unknown[] }).libraries ?? []
      : [];
    const sessions = sessionsRes.ok
      ? ((await sessionsRes.json()) as unknown[])
      : [];

    let totalItems = 0;
    for (const library of libraries) {
      const lib = library as { mediaType?: string; stats?: { totalItems?: number } };
      totalItems += lib.stats?.totalItems ?? 0;
    }

    return {
      title: "Audiobookshelf",
      status: "ok",
      fields: [
        {
          label: "Libraries",
          value: String(libraries.length),
        },
        {
          label: "Media",
          value: String(totalItems),
        },
        {
          label: "Sessions",
          value: String(sessions.length),
          highlight: sessions.length > 0,
        },
      ],
    };
  } catch (error) {
    return {
      title: "Audiobookshelf",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Unreachable",
    };
  }
}
