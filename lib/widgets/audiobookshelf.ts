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

    const [meRes, librariesRes, sessionsRes, usersRes, statusRes] = await Promise.all([
      fetchWithTimeout(`${base}/api/me`, { headers }, config.extraConfig),
      fetchWithTimeout(`${base}/api/libraries`, { headers }, config.extraConfig),
      fetchWithTimeout(`${base}/api/sessions`, { headers }, config.extraConfig),
      fetchWithTimeout(`${base}/api/users`, { headers }, config.extraConfig).catch(() => null),
      fetchWithTimeout(`${base}/api/status`, { headers }, config.extraConfig).catch(() => null),
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
    const users = usersRes?.ok ? ((await usersRes.json()) as { users?: unknown[] }).users ?? [] : [];
    const status = statusRes?.ok
      ? ((await statusRes.json()) as { version?: string })
      : {};
    const activeUsers = new Set(
      (sessions as Array<{ userId?: string; user?: { id?: string } }>).map(
        (session) => session.userId ?? session.user?.id,
      ).filter(Boolean),
    ).size;

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
        {
          label: "Users",
          value: String(users.length),
        },
        {
          label: "Active",
          value: String(activeUsers),
          highlight: activeUsers > 0,
        },
        {
          label: "Version",
          value: status.version ?? "—",
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
