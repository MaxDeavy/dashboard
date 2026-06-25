import { fetchWithTimeout, type WidgetConfigInput, type WidgetResult } from "./base";

interface JellyfinSession {
  UserName?: string;
  NowPlayingItem?: { Name?: string };
  PlayState?: { IsPaused?: boolean };
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
      error: "Kein API-Key konfiguriert",
    };
  }

  try {
    const headers = { "X-Emby-Token": apiKey };
    const [sessionsRes, infoRes] = await Promise.all([
      fetchWithTimeout(`${base}/Sessions`, { headers }),
      fetchWithTimeout(`${base}/System/Info/Public`),
    ]);

    const sessions: JellyfinSession[] = sessionsRes.ok
      ? await sessionsRes.json()
      : [];
    const activeStreams = sessions.filter(
      (s) => s.NowPlayingItem && !s.PlayState?.IsPaused,
    ).length;
    const info = infoRes.ok ? await infoRes.json() : {};

    return {
      title: "Jellyfin",
      status: "ok",
      fields: [
        {
          label: "Aktive Streams",
          value: String(activeStreams),
          highlight: activeStreams > 0,
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
          label: "Server",
          value: String(info.ServerName ?? "Jellyfin"),
        },
      ],
    };
  } catch (error) {
    return {
      title: "Jellyfin",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Nicht erreichbar",
    };
  }
}
