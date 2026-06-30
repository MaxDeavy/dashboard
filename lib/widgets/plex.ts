import {
  fetchWithTimeout,
  formatMultilineList,
  truncate,
  type WidgetConfigInput,
  type WidgetResult,
} from "./base";

interface PlexSession {
  title?: string;
  type?: string;
  User?: { title?: string };
  Player?: { state?: string };
  TranscodeSession?: Record<string, unknown>;
}

interface PlexSessionsResponse {
  MediaContainer?: {
    size?: string | number;
    Metadata?: PlexSession | PlexSession[];
  };
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function formatActiveViewers(sessions: PlexSession[]): string {
  const active = sessions.filter(
    (session) => session.Player?.state === "playing",
  );

  return formatMultilineList(
    active.map((session) => {
      const user = session.User?.title ?? "Unknown";
      const title = session.title?.trim();
      return title ? `${user} – ${truncate(title, 24)}` : user;
    }),
  );
}

export async function fetchPlexWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const token = config.credentials?.apiKey ?? config.credentials?.token;
  const base = config.apiUrl.replace(/\/$/, "");

  if (!token) {
    return {
      title: "Plex",
      status: "warning",
      fields: [],
      error: "No Plex token configured",
    };
  }

  try {
    const headers = {
      Accept: "application/json",
      "X-Plex-Token": token,
    };

    const [sessionsResponse, sectionsRes, identityRes] = await Promise.all([
      fetchWithTimeout(
        `${base}/status/sessions`,
        { headers },
        config.extraConfig,
      ),
      fetchWithTimeout(`${base}/library/sections`, { headers }, config.extraConfig).catch(() => null),
      fetchWithTimeout(`${base}/identity`, { headers }, config.extraConfig).catch(() => null),
    ]);

    if (!sessionsResponse.ok) {
      throw new Error(`API: ${sessionsResponse.status}`);
    }

    const data = (await sessionsResponse.json()) as PlexSessionsResponse;
    const sessions = asArray(data.MediaContainer?.Metadata);

    const playing = sessions.filter(
      (session) => session.Player?.state === "playing",
    ).length;
    const transcodes = sessions.filter(
      (session) => session.TranscodeSession != null,
    ).length;
    const paused = sessions.filter((session) => session.Player?.state === "paused").length;
    const totalSessions = sessions.length;
    const libraries = sectionsRes?.ok
      ? (((await sectionsRes.json()) as {
          MediaContainer?: { Directory?: unknown[] };
        }).MediaContainer?.Directory?.length ?? 0)
      : 0;
    const version = identityRes?.ok
      ? (((await identityRes.json()) as { MediaContainer?: { version?: string } }).MediaContainer?.version ??
        "—")
      : "—";
    const viewers = formatActiveViewers(sessions);

    return {
      title: "Plex",
      status: "ok",
      fields: [
        {
          label: "Active Streams",
          value: String(playing),
          highlight: playing > 0,
        },
        {
          label: "Transcodes",
          value: String(transcodes),
          highlight: transcodes > 0,
        },
        ...(playing > 0
          ? [
              {
                label: "Watching Now",
                value: viewers,
                highlight: true,
              },
            ]
          : []),
        {
          label: "Libraries",
          value: String(libraries),
        },
        {
          label: "Paused",
          value: String(paused),
          highlight: paused > 0,
        },
        {
          label: "Sessions",
          value: String(totalSessions),
        },
        {
          label: "Version",
          value: version,
        },
      ],
    };
  } catch (error) {
    return {
      title: "Plex",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Unreachable",
    };
  }
}
