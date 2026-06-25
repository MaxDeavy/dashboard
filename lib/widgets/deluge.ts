import {
  credentialString,
  fetchWithTimeout,
  formatBytesPerSec,
  normalizeApiUrl,
  type WidgetConfigInput,
  type WidgetResult,
} from "./base";

async function delugeRpc<T>(
  base: string,
  method: string,
  params: unknown[],
  extraConfig?: Record<string, string>,
): Promise<T> {
  const response = await fetchWithTimeout(
    `${normalizeApiUrl(base)}/json`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method, params, id: 1 }),
    },
    extraConfig,
  );

  if (!response.ok) {
    throw new Error(`RPC: ${response.status}`);
  }

  const payload = (await response.json()) as {
    result?: T;
    error?: { message?: string } | null;
  };

  if (payload.error) {
    throw new Error(payload.error.message ?? "RPC fehlgeschlagen");
  }

  return payload.result as T;
}

export async function fetchDelugeWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const password = credentialString(config.credentials?.password);
  const base = config.apiUrl;

  if (!password) {
    return {
      title: "Deluge",
      status: "warning",
      fields: [],
      error: "Passwort erforderlich",
    };
  }

  try {
    await delugeRpc<boolean>(base, "auth.login", [password], config.extraConfig);

    const stats = await delugeRpc<{
      download_rate?: number;
      upload_rate?: number;
      num_peers?: number;
    }>(base, "core.get_session_status", [["download_rate", "upload_rate", "num_peers"]], config.extraConfig);

    const torrents = await delugeRpc<Record<string, { state?: string }>>(
      base,
      "core.get_torrents_status",
      [{}, ["state"]],
      config.extraConfig,
    );

    const torrentList = Object.values(torrents ?? {});
    const active = torrentList.filter(
      (torrent) => torrent.state === "Downloading" || torrent.state === "Seeding",
    ).length;

    return {
      title: "Deluge",
      status: "ok",
      fields: [
        {
          label: "Download",
          value: formatBytesPerSec(stats.download_rate ?? 0),
          highlight: (stats.download_rate ?? 0) > 0,
        },
        {
          label: "Upload",
          value: formatBytesPerSec(stats.upload_rate ?? 0),
        },
        {
          label: "Aktiv",
          value: String(active),
          highlight: active > 0,
        },
        {
          label: "Peers",
          value: String(stats.num_peers ?? 0),
        },
      ],
    };
  } catch (error) {
    return {
      title: "Deluge",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Nicht erreichbar",
    };
  }
}
