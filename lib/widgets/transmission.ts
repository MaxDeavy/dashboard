import {
  credentialString,
  fetchWithTimeout,
  formatBytes,
  formatBytesPerSec,
  normalizeApiUrl,
  type WidgetConfigInput,
  type WidgetResult,
} from "./base";

interface TransmissionRpcResponse<T> {
  arguments?: T;
  result?: string;
}

async function transmissionRpc<T>(
  base: string,
  method: string,
  username: string,
  password: string,
  extraConfig?: Record<string, string>,
  sessionId?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
  };
  if (sessionId) {
    headers["X-Transmission-Session-Id"] = sessionId;
  }

  const response = await fetchWithTimeout(
    `${normalizeApiUrl(base)}/transmission/rpc`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ method, arguments: {} }),
    },
    extraConfig,
  );

  const nextSessionId =
    response.headers.get("X-Transmission-Session-Id") ?? sessionId ?? "";

  if (response.status === 409 && nextSessionId) {
    return transmissionRpc<T>(
      base,
      method,
      username,
      password,
      extraConfig,
      nextSessionId,
    );
  }

  if (!response.ok) {
    throw new Error(`RPC: ${response.status}`);
  }

  const payload = (await response.json()) as TransmissionRpcResponse<T>;
  if (payload.result !== "success") {
    throw new Error("RPC failed");
  }

  return payload.arguments as T;
}

export async function fetchTransmissionWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const username = credentialString(config.credentials?.username) || "";
  const password = credentialString(config.credentials?.password);
  const base = config.apiUrl;

  if (!password) {
    return {
      title: "Transmission",
      status: "warning",
      fields: [],
      error: "Password required",
    };
  }

  try {
    const [stats, session] = await Promise.all([
      transmissionRpc<{
        activeTorrentCount?: number;
        downloadSpeed?: number;
        uploadSpeed?: number;
        pausedTorrentCount?: number;
        torrentCount?: number;
        cumulativeStats?: {
          downloadedBytes?: number;
          uploadedBytes?: number;
        };
      }>(base, "session-stats", username, password, config.extraConfig),
      transmissionRpc<{
        version?: string;
        "download-dir"?: string;
      }>(base, "session-get", username, password, config.extraConfig),
    ]);
    const totalTorrents = stats.torrentCount ?? 0;
    const cumulativeDownloaded = stats.cumulativeStats?.downloadedBytes ?? 0;
    const cumulativeUploaded = stats.cumulativeStats?.uploadedBytes ?? 0;

    return {
      title: "Transmission",
      status: "ok",
      fields: [
        {
          label: "Download",
          value: formatBytesPerSec(stats.downloadSpeed ?? 0),
          highlight: (stats.downloadSpeed ?? 0) > 0,
        },
        {
          label: "Upload",
          value: formatBytesPerSec(stats.uploadSpeed ?? 0),
        },
        {
          label: "Active",
          value: String(stats.activeTorrentCount ?? 0),
          highlight: (stats.activeTorrentCount ?? 0) > 0,
        },
        {
          label: "Paused",
          value: String(stats.pausedTorrentCount ?? 0),
        },
        {
          label: "Total",
          value: String(totalTorrents),
        },
        {
          label: "Total Download",
          value: formatBytes(cumulativeDownloaded),
        },
        {
          label: "Total Upload",
          value: formatBytes(cumulativeUploaded),
        },
        {
          label: "Version",
          value: session.version ?? "—",
        },
        {
          label: "Location",
          value: session["download-dir"] ?? "—",
        },
      ],
    };
  } catch (error) {
    return {
      title: "Transmission",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Unreachable",
    };
  }
}
