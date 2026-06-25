import {
  credentialString,
  fetchWithTimeout,
  normalizeApiUrl,
  type WidgetConfigInput,
  type WidgetResult,
} from "./base";

function buildSubsonicUrl(
  base: string,
  command: string,
  username: string,
  password: string,
  extra: Record<string, string> = {},
): string {
  const params = new URLSearchParams({
    u: username,
    p: password,
    v: "1.16.0",
    c: "homelab-dashboard",
    f: "json",
    ...extra,
  });

  return `${normalizeApiUrl(base)}/rest/${command}?${params.toString()}`;
}

export async function fetchNavidromeWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const username = credentialString(config.credentials?.username);
  const password = credentialString(config.credentials?.password);
  const base = config.apiUrl;

  if (!username || !password) {
    return {
      title: "Navidrome",
      status: "warning",
      fields: [],
      error: "Benutzername und Passwort erforderlich",
    };
  }

  try {
    const pingRes = await fetchWithTimeout(
      buildSubsonicUrl(base, "ping", username, password),
      {},
      config.extraConfig,
    );

    if (!pingRes.ok) {
      throw new Error(`Ping: ${pingRes.status}`);
    }

    const ping = (await pingRes.json()) as {
      "subsonic-response"?: { status?: string; version?: string };
    };

    if (ping["subsonic-response"]?.status !== "ok") {
      throw new Error("Authentifizierung fehlgeschlagen");
    }

    const indexesRes = await fetchWithTimeout(
      buildSubsonicUrl(base, "getIndexes", username, password),
      {},
      config.extraConfig,
    );

    let artists = 0;
    if (indexesRes.ok) {
      const indexes = (await indexesRes.json()) as {
        "subsonic-response"?: {
          indexes?: { index?: Array<{ artist?: unknown[] }> };
        };
      };
      const indexList = indexes["subsonic-response"]?.indexes?.index ?? [];
      for (const entry of indexList) {
        artists += entry.artist?.length ?? 0;
      }
    }

    const nowPlayingRes = await fetchWithTimeout(
      buildSubsonicUrl(base, "getNowPlaying", username, password),
      {},
      config.extraConfig,
    );

    let playing = 0;
    if (nowPlayingRes.ok) {
      const nowPlaying = (await nowPlayingRes.json()) as {
        "subsonic-response"?: {
          nowPlaying?: { entry?: unknown[] };
        };
      };
      playing = nowPlaying["subsonic-response"]?.nowPlaying?.entry?.length ?? 0;
    }

    return {
      title: "Navidrome",
      status: "ok",
      fields: [
        {
          label: "Version",
          value: ping["subsonic-response"]?.version ?? "—",
        },
        {
          label: "Künstler",
          value: String(artists),
        },
        {
          label: "Wiedergaben",
          value: String(playing),
          highlight: playing > 0,
        },
      ],
    };
  } catch (error) {
    return {
      title: "Navidrome",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Nicht erreichbar",
    };
  }
}
