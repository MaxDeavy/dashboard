import {
  fetchWithTimeout,
  formatMultilineList,
  truncate,
  type WidgetConfigInput,
  type WidgetResult,
} from "./base";

interface JellyfinSession {
  UserName?: string;
  NowPlayingItem?: { Name?: string };
  PlayState?: { IsPaused?: boolean };
  TranscodingInfo?: Record<string, unknown> | null;
}

interface JellyfinCounts {
  MovieCount?: number;
  SeriesCount?: number;
  EpisodeCount?: number;
  SongCount?: number;
}

function formatActiveViewers(sessions: JellyfinSession[]): string {
  const active = sessions.filter(
    (session) => session.NowPlayingItem && !session.PlayState?.IsPaused,
  );

  if (active.length === 0) return "—";

  return formatMultilineList(
    active.map((session) => {
      const user = session.UserName ?? "Unknown";
      const title = session.NowPlayingItem?.Name?.trim();
      return title ? `${user} – ${truncate(title, 22)}` : user;
    }),
  );
}

export async function fetchJellyfinWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const apiKey = config.credentials?.apiKey;
  const base = config.apiUrl.replace(/\/$/, "");

  if (!apiKey) {
    return {
      title: "Jellyfin",
      status: "warning",
      fields: [],
      error: "No API key configured",
    };
  }

  try {
    const headers = { "X-Emby-Token": apiKey };
    const [sessionsRes, infoRes, countsRes, usersRes] = await Promise.all([
      fetchWithTimeout(`${base}/Sessions`, { headers }, config.extraConfig),
      fetchWithTimeout(`${base}/System/Info/Public`, {}, config.extraConfig),
      fetchWithTimeout(`${base}/Items/Counts`, { headers }, config.extraConfig),
      fetchWithTimeout(`${base}/Users`, { headers }, config.extraConfig).catch(() => null),
    ]);

    const sessions: JellyfinSession[] = sessionsRes.ok
      ? await sessionsRes.json()
      : [];
    const activeStreams = sessions.filter(
      (session) => session.NowPlayingItem && !session.PlayState?.IsPaused,
    ).length;
    const transcodes = sessions.filter(
      (session) => session.TranscodingInfo != null,
    ).length;
    const pausedSessions = sessions.filter((session) => session.PlayState?.IsPaused).length;
    const remoteSessions = sessions.filter(
      (session) =>
        (session as { RemoteEndPoint?: string }).RemoteEndPoint != null,
    ).length;
    const info = infoRes.ok ? await infoRes.json() : {};
    const counts: JellyfinCounts = countsRes.ok ? await countsRes.json() : {};
    const users = usersRes?.ok ? ((await usersRes.json()) as unknown[]).length : 0;
    const viewers = formatActiveViewers(sessions);

    const mediaParts: string[] = [];
    if (counts.MovieCount != null) {
      mediaParts.push(`${counts.MovieCount} movies`);
    }
    if (counts.SeriesCount != null) {
      mediaParts.push(`${counts.SeriesCount} series`);
    }
    if (counts.EpisodeCount != null && counts.SeriesCount != null) {
      mediaParts.push(`${counts.EpisodeCount} eps`);
    }

    return {
      title: String(info.ServerName ?? "Jellyfin"),
      status: "ok",
      fields: [
        {
          label: "Active Streams",
          value: String(activeStreams),
          highlight: activeStreams > 0,
        },
        ...(activeStreams > 0
          ? [
              {
                label: "Watching Now",
                value: viewers,
                highlight: true,
              },
            ]
          : []),
        {
          label: "Transcodes",
          value: String(transcodes),
          highlight: transcodes > 0,
        },
        {
          label: "Library",
          value: formatMultilineList(mediaParts),
        },
        {
          label: "Sessions",
          value: String(sessions.length),
        },
        {
          label: "Version",
          value: String(info.Version ?? "—"),
        },
        {
          label: "Music Tracks",
          value: String(counts.SongCount ?? 0),
        },
        {
          label: "Paused",
          value: String(pausedSessions),
          highlight: pausedSessions > 0,
        },
        {
          label: "Users",
          value: String(users),
        },
        {
          label: "Remote",
          value: String(remoteSessions),
          highlight: remoteSessions > 0,
        },
      ],
    };
  } catch (error) {
    return {
      title: "Jellyfin",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Unreachable",
    };
  }
}
