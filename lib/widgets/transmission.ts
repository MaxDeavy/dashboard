import {
  credentialString,
  fetchWithTimeout,
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
    throw new Error("RPC fehlgeschlagen");
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
      error: "Passwort erforderlich",
    };
  }

  try {
    const stats = await transmissionRpc<{
      activeTorrentCount?: number;
      downloadSpeed?: number;
      uploadSpeed?: number;
      pausedTorrentCount?: number;
    }>(base, "session-stats", username, password, config.extraConfig);

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
          label: "Aktiv",
          value: String(stats.activeTorrentCount ?? 0),
          highlight: (stats.activeTorrentCount ?? 0) > 0,
        },
        {
          label: "Pausiert",
          value: String(stats.pausedTorrentCount ?? 0),
        },
      ],
    };
  } catch (error) {
    return {
      title: "Transmission",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Nicht erreichbar",
    };
  }
}
