import {
  fetchWithTimeout,
  formatBytes,
  normalizeApiUrl,
  type WidgetConfigInput,
  type WidgetResult,
} from "./base";

interface RommStats {
  PLATFORMS?: number;
  ROMS?: number;
  SAVES?: number;
  STATES?: number;
  SCREENSHOTS?: number;
  TOTAL_FILESIZE_BYTES?: number;
  METADATA_COVERAGE?: number;
}

async function rommToken(
  base: string,
  username: string,
  password: string,
  extraConfig?: Record<string, string>,
): Promise<string> {
  const response = await fetchWithTimeout(
    `${base}/api/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&grant_type=password&scope=roms.read platforms.read stats.read`,
    },
    extraConfig,
  );

  if (!response.ok) {
    throw new Error(`Login: ${response.status}`);
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("Login failed");
  }

  return data.access_token;
}

export async function fetchRommWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const username = config.credentials?.username;
  const password = config.credentials?.password;
  const bearer = config.credentials?.token;
  const base = normalizeApiUrl(config.apiUrl);

  if (!bearer && (!username || !password)) {
    return {
      title: "Romm",
      status: "warning",
      fields: [],
      error: "Username and password required",
    };
  }

  try {
    const token =
      bearer ?? (await rommToken(base, username!, password!, config.extraConfig));
    const headers = { Authorization: `Bearer ${token}` };

    const response = await fetchWithTimeout(
      `${base}/api/stats?include_platform_stats=true`,
      { headers },
      config.extraConfig,
    );

    if (!response.ok) {
      throw new Error(`API: ${response.status}`);
    }

    const stats = (await response.json()) as RommStats;
    const totalSize = stats.TOTAL_FILESIZE_BYTES ?? 0;
    const metadataCoverage = stats.METADATA_COVERAGE ?? 0;

    return {
      title: "Romm",
      status: "ok",
      fields: [
        { label: "Platforms", value: String(stats.PLATFORMS ?? 0) },
        {
          label: "ROMs",
          value: String(stats.ROMS ?? 0),
          highlight: (stats.ROMS ?? 0) > 0,
        },
        { label: "Saves", value: String(stats.SAVES ?? 0) },
        { label: "States", value: String(stats.STATES ?? 0) },
        { label: "Screenshots", value: String(stats.SCREENSHOTS ?? 0) },
        { label: "Total Size", value: totalSize > 0 ? formatBytes(totalSize) : "—" },
        {
          label: "Metadata Coverage",
          value:
            metadataCoverage > 0 ? `${metadataCoverage.toFixed(1)}%` : "—",
        },
      ],
    };
  } catch (error) {
    return {
      title: "Romm",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Unreachable",
    };
  }
}
