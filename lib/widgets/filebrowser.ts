import {
  fetchWithTimeout,
  formatBytes,
  normalizeApiUrl,
  readApiError,
  type WidgetConfigInput,
  type WidgetResult,
} from "./base";

interface FilebrowserUsage {
  total?: number;
  used?: number;
}

async function loginFilebrowser(
  base: string,
  username: string,
  password: string,
  extraConfig?: Record<string, string>,
): Promise<string> {
  const loginUrls = [`${base}/api/login`, `${base}/api/login/`];
  let lastError: Error | null = null;

  for (const url of loginUrls) {
    const response = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      },
      extraConfig,
    );

    if (!response.ok) {
      lastError = new Error(`Login: ${response.status}`);
      continue;
    }

    const text = (await response.text()).trim();
    if (!text) {
      lastError = new Error("Login: No token received");
      continue;
    }

    try {
      const json = JSON.parse(text) as { token?: string };
      if (json.token) {
        return json.token;
      }
    } catch {
      // plain JWT string
    }

    return text.replace(/^"|"$/g, "");
  }

  throw lastError ?? new Error("Login failed");
}

async function fetchFilebrowserUsage(
  base: string,
  token: string,
  extraConfig?: Record<string, string>,
): Promise<FilebrowserUsage> {
  const usageUrls = [`${base}/api/usage/`, `${base}/api/usage`];
  let lastError: Error | null = null;

  for (const url of usageUrls) {
    const response = await fetchWithTimeout(
      url,
      {
        headers: { "X-Auth": token },
      },
      extraConfig,
    );

    if (response.ok) {
      return (await response.json()) as FilebrowserUsage;
    }

    lastError = new Error(await readApiError(response));
    if (response.status === 404) {
      continue;
    }
    throw lastError;
  }

  throw lastError ?? new Error("API: usage unavailable");
}

function extractVersionFromSettings(data: Record<string, unknown>): string {
  const candidates = [
    data.version,
    data.Version,
    (data.server as Record<string, unknown> | undefined)?.version,
    (data.server as Record<string, unknown> | undefined)?.Version,
  ];

  for (const value of candidates) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed && trimmed !== "(untracked)") {
        return trimmed;
      }
    }
  }

  return "";
}

function extractVersionFromHtml(html: string): string {
  const match =
    html.match(/"Version"\s*:\s*"([^"]+)"/) ??
    html.match(/"version"\s*:\s*"([^"]+)"/);

  const version = match?.[1]?.trim();
  if (version && version !== "(untracked)") {
    return version;
  }

  return "";
}

async function fetchFilebrowserVersion(
  base: string,
  token: string,
  extraConfig?: Record<string, string>,
): Promise<string> {
  const authHeaders = { "X-Auth": token };

  for (const endpoint of ["/api/settings", "/api/settings?property=server"]) {
    const response = await fetchWithTimeout(
      `${base}${endpoint}`,
      { headers: authHeaders },
      extraConfig,
    ).catch(() => null);

    if (!response?.ok) {
      continue;
    }

    const version = extractVersionFromSettings(
      (await response.json()) as Record<string, unknown>,
    );
    if (version) {
      return version;
    }
  }

  const indexResponse = await fetchWithTimeout(
    base,
    { headers: { Accept: "text/html" } },
    extraConfig,
  ).catch(() => null);

  if (indexResponse?.ok) {
    const version = extractVersionFromHtml(await indexResponse.text());
    if (version) {
      return version;
    }
  }

  return "";
}

async function fetchOptionalCount(
  base: string,
  token: string,
  endpoint: string,
  extraConfig?: Record<string, string>,
): Promise<number> {
  const response = await fetchWithTimeout(
    `${base}${endpoint}`,
    { headers: { "X-Auth": token } },
    extraConfig,
  );
  if (!response.ok) return 0;
  const data = (await response.json()) as unknown[] | { items?: unknown[] };
  if (Array.isArray(data)) return data.length;
  return data.items?.length ?? 0;
}

export async function fetchFilebrowserWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const username = config.credentials?.username;
  const password = config.credentials?.password;
  const base = normalizeApiUrl(config.apiUrl);

  if (!username || !password) {
    return {
      title: "FileBrowser",
      status: "warning",
      fields: [],
      error: "Username and password required",
    };
  }

  try {
    const token = await loginFilebrowser(
      base,
      username,
      password,
      config.extraConfig,
    );

    const [usage, users, shares, version] = await Promise.all([
      fetchFilebrowserUsage(
        base,
        token,
        config.extraConfig,
      ),
      fetchOptionalCount(base, token, "/api/users", config.extraConfig).catch(() => 0),
      fetchOptionalCount(base, token, "/api/share", config.extraConfig).catch(() => 0),
      fetchFilebrowserVersion(base, token, config.extraConfig).catch(() => ""),
    ]);
    const total = usage.total ?? 0;
    const used = usage.used ?? 0;
    const free = Math.max(total - used, 0);
    const usedPercent = total > 0 ? (used / total) * 100 : 0;

    return {
      title: "FileBrowser",
      status: "ok",
      fields: [
        {
          label: "Used",
          value: formatBytes(used),
          highlight: usedPercent > 85,
        },
        { label: "Free", value: formatBytes(free) },
        { label: "Total", value: formatBytes(total) },
        {
          label: "Usage",
          value: `${usedPercent.toFixed(1)}%`,
        },
        {
          label: "Users",
          value: String(users),
        },
        {
          label: "Shares",
          value: String(shares),
        },
        {
          label: "Version",
          value: version || "—",
        },
      ],
    };
  } catch (error) {
    return {
      title: "FileBrowser",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Unreachable",
    };
  }
}
