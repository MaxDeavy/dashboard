import {
  credentialString,
  fetchWithTimeout,
  formatMultilineList,
  normalizeApiUrl,
  truncate,
  type WidgetConfigInput,
  type WidgetResult,
} from "./base";

interface SubsonicArtist {
  name?: string;
}

interface SubsonicNowPlayingEntry {
  title?: string;
  artist?: string;
  username?: string;
}

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

function formatNowPlaying(entries: SubsonicNowPlayingEntry[]): string {
  return formatMultilineList(
    entries.map((entry) => {
      const user = entry.username ?? "Unknown";
      const title = entry.title?.trim();
      const artist = entry.artist?.trim();
      const track =
        title && artist ? `${artist} – ${title}` : (title ?? artist ?? "");
      return track ? `${user} – ${truncate(track, 24)}` : user;
    }),
  );
}

async function fetchSubsonicAlbumCount(
  base: string,
  username: string,
  password: string,
  extraConfig?: Record<string, string>,
): Promise<number> {
  const response = await fetchWithTimeout(
    buildSubsonicUrl(base, "getAlbumList2", username, password, {
      type: "alphabeticalByName",
      size: "1",
    }),
    {},
    extraConfig,
  );

  if (!response.ok) {
    return 0;
  }

  const headerCount = Number(response.headers.get("x-total-count"));
  if (Number.isFinite(headerCount) && headerCount >= 0) {
    return headerCount;
  }

  const data = (await response.json()) as {
    "subsonic-response"?: {
      albumList2?: { album?: unknown[] | unknown };
    };
  };
  const album = data["subsonic-response"]?.albumList2?.album;
  if (Array.isArray(album)) {
    return album.length;
  }
  return album ? 1 : 0;
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
      error: "Username and password required",
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
      throw new Error("Authentication failed");
    }

    const [indexesRes, albumCountRes, nowPlayingRes, playlistsRes] = await Promise.all([
      fetchWithTimeout(
        buildSubsonicUrl(base, "getIndexes", username, password),
        {},
        config.extraConfig,
      ),
      fetchSubsonicAlbumCount(base, username, password, config.extraConfig),
      fetchWithTimeout(
        buildSubsonicUrl(base, "getNowPlaying", username, password),
        {},
        config.extraConfig,
      ),
      fetchWithTimeout(
        buildSubsonicUrl(base, "getPlaylists", username, password),
        {},
        config.extraConfig,
      ).catch(() => null),
    ]);

    let artists = 0;
    if (indexesRes.ok) {
      const indexes = (await indexesRes.json()) as {
        "subsonic-response"?: {
          indexes?: { index?: Array<{ artist?: SubsonicArtist[] }> };
        };
      };
      const indexList = indexes["subsonic-response"]?.indexes?.index ?? [];
      for (const entry of indexList) {
        for (const artist of entry.artist ?? []) {
          artists += 1;
        }
      }
    }

    const albums = albumCountRes;

    let playingEntries: SubsonicNowPlayingEntry[] = [];
    if (nowPlayingRes.ok) {
      const nowPlaying = (await nowPlayingRes.json()) as {
        "subsonic-response"?: {
          nowPlaying?: { entry?: SubsonicNowPlayingEntry[] };
        };
      };
      playingEntries =
        nowPlaying["subsonic-response"]?.nowPlaying?.entry ?? [];
    }
    const playlists = playlistsRes?.ok
      ? (((await playlistsRes.json()) as {
          "subsonic-response"?: { playlists?: { playlist?: unknown[] } };
        })["subsonic-response"]?.playlists?.playlist?.length ?? 0)
      : 0;

    return {
      title: "Navidrome",
      status: "ok",
      fields: [
        {
          label: "Artists",
          value: String(artists),
        },
        {
          label: "Albums",
          value: String(albums),
          highlight: albums > 0,
        },
        ...(playingEntries.length > 0
          ? [
              {
                label: "Now Playing",
                value: formatNowPlaying(playingEntries),
                highlight: true,
              },
            ]
          : []),
        {
          label: "Listeners",
          value: String(playingEntries.length),
          highlight: playingEntries.length > 0,
        },
        {
          label: "Version",
          value: ping["subsonic-response"]?.version ?? "—",
        },
        {
          label: "Libraries",
          value: String(playlists),
        },
        {
          label: "Total",
          value: String(artists + albums),
        },
        {
          label: "Status",
          value: "Connected",
          highlight: true,
        },
      ],
    };
  } catch (error) {
    return {
      title: "Navidrome",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Unreachable",
    };
  }
}
