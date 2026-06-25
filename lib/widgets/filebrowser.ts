import {
  fetchWithTimeout,
  formatBytes,
  normalizeApiUrl,
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
  const response = await fetchWithTimeout(
    `${base}/api/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    },
    extraConfig,
  );

  if (!response.ok) {
    throw new Error(`Login: ${response.status}`);
  }

  const text = (await response.text()).trim();
  if (!text) {
    throw new Error("Login: No token received");
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

    const response = await fetchWithTimeout(
      `${base}/api/usage`,
      {
        headers: { "X-Auth": token },
      },
      config.extraConfig,
    );

    if (!response.ok) {
      throw new Error(`API: ${response.status}`);
    }

    const usage = (await response.json()) as FilebrowserUsage;
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
