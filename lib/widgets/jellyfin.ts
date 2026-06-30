import {
  fetchWithTimeout,
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

  return active
    .map((session) => {
      const user = session.UserName ?? "Unknown";
      const title = session.NowPlayingItem?.Name?.trim();
      return title ? `${user} · ${truncate(title, 22)}` : user;
    })
    .join(", ");
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
    const [sessionsRes, infoRes, countsRes] = await Promise.all([
      fetchWithTimeout(`${base}/Sessions`, { headers }, config.extraConfig),
      fetchWithTimeout(`${base}/System/Info/Public`, {}, config.extraConfig),
      fetchWithTimeout(`${base}/Items/Counts`, { headers }, config.extraConfig),
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
    const info = infoRes.ok ? await infoRes.json() : {};
    const counts: JellyfinCounts = countsRes.ok ? await countsRes.json() : {};
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
        {
          label: "Watching Now",
          value: viewers,
          highlight: activeStreams > 0,
        },
        {
          label: "Transcodes",
          value: String(transcodes),
          highlight: transcodes > 0,
        },
        {
          label: "Library",
          value: mediaParts.length > 0 ? mediaParts.join(" · ") : "—",
        },
        {
          label: "Sessions",
          value: String(sessions.length),
        },
        {
          label: "Version",
          value: String(info.Version ?? "—"),
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
