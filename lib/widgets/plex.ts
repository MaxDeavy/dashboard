import {
  fetchWithTimeout,
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

interface PlexLibraryDirectory {
  title?: string;
  type?: string;
  count?: number | string;
}

interface PlexLibraryResponse {
  MediaContainer?: {
    Directory?: PlexLibraryDirectory | PlexLibraryDirectory[];
  };
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function formatActiveViewers(sessions: PlexSession[]): string {
  const active = sessions.filter(
    (session) => session.Player?.state === "playing",
  );

  if (active.length === 0) return "—";

  return active
    .map((session) => {
      const user = session.User?.title ?? "Unbekannt";
      const title = session.title?.trim();
      return title ? `${user} · ${truncate(title, 24)}` : user;
    })
    .join(", ");
}

async function fetchLibraryInfo(
  base: string,
  headers: Record<string, string>,
  extraConfig?: Record<string, string>,
): Promise<{ movies: number; shows: number; summary: string }> {
  const response = await fetchWithTimeout(
    `${base}/library/sections`,
    { headers },
    extraConfig,
  );

  if (!response.ok) {
    return { movies: 0, shows: 0, summary: "—" };
  }

  const data = (await response.json()) as PlexLibraryResponse;
  const directories = asArray(data.MediaContainer?.Directory);

  let movies = 0;
  let shows = 0;
  const sections: string[] = [];

  for (const directory of directories) {
    const count = Number(directory.count ?? 0);
    if (directory.type === "movie") {
      movies += count;
    } else if (directory.type === "show") {
      shows += count;
    }

    if (directory.title && count > 0) {
      sections.push(`${directory.title} (${count})`);
    }
  }

  const summary =
    sections.length > 0
      ? sections.slice(0, 2).join(", ") +
        (sections.length > 2 ? ` +${sections.length - 2}` : "")
      : movies > 0 || shows > 0
        ? `${movies} Filme · ${shows} Serien`
        : "—";

  return { movies, shows, summary };
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
      error: "Kein Plex-Token konfiguriert",
    };
  }

  try {
    const headers = {
      Accept: "application/json",
      "X-Plex-Token": token,
    };

    const [sessionsResponse, libraryInfo] = await Promise.all([
      fetchWithTimeout(`${base}/status/sessions`, { headers }, config.extraConfig),
      fetchLibraryInfo(base, headers, config.extraConfig),
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
    const viewers = formatActiveViewers(sessions);

    return {
      title: "Plex",
      status: "ok",
      fields: [
        {
          label: "Aktive Streams",
          value: String(playing),
          highlight: playing > 0,
        },
        {
          label: "Transcodes",
          value: String(transcodes),
          highlight: transcodes > 0,
        },
        {
          label: "Bibliothek",
          value: libraryInfo.summary,
        },
        {
          label: "Schaut gerade",
          value: viewers,
          highlight: playing > 0,
        },
      ],
    };
  } catch (error) {
    return {
      title: "Plex",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Nicht erreichbar",
    };
  }
}
