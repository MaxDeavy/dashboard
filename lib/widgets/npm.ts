import {
  credentialString,
  fetchWithTimeout,
  normalizeApiUrl,
  type WidgetConfigInput,
  type WidgetResult,
} from "./base";

interface NpmProxyHost {
  enabled?: boolean;
  meta?: { online?: boolean };
}

async function loginNpm(
  base: string,
  identity: string,
  secret: string,
  extraConfig?: Record<string, string>,
): Promise<string> {
  const response = await fetchWithTimeout(
    `${base}/api/tokens`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identity, secret }),
    },
    extraConfig,
  );

  if (!response.ok) {
    throw new Error(`Login: ${response.status}`);
  }

  const data = (await response.json()) as { token?: string };
  if (!data.token) {
    throw new Error("Login: No token received");
  }

  return data.token;
}

export async function fetchNpmWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const identity = credentialString(config.credentials?.username);
  const secret = credentialString(config.credentials?.password);
  const base = normalizeApiUrl(config.apiUrl);

  if (!identity || !secret) {
    return {
      title: "NPM",
      status: "warning",
      fields: [],
      error: "Email and password required",
    };
  }

  try {
    const token = await loginNpm(base, identity, secret, config.extraConfig);
    const headers = { Authorization: `Bearer ${token}` };

    const [proxyRes, redirectRes] = await Promise.all([
      fetchWithTimeout(
        `${base}/api/nginx/proxy-hosts`,
        { headers },
        config.extraConfig,
      ),
      fetchWithTimeout(
        `${base}/api/nginx/redirection-hosts`,
        { headers },
        config.extraConfig,
      ),
    ]);

    if (!proxyRes.ok) {
      throw new Error(`Proxy-Hosts: ${proxyRes.status}`);
    }

    const proxyHosts = (await proxyRes.json()) as NpmProxyHost[];
    const redirects = redirectRes.ok
      ? ((await redirectRes.json()) as NpmProxyHost[])
      : [];

    const enabled = proxyHosts.filter((host) => host.enabled !== false).length;
    const online = proxyHosts.filter(
      (host) => host.enabled !== false && host.meta?.online === true,
    ).length;
    const offline = enabled - online;

    return {
      title: "NPM",
      status: "ok",
      fields: [
        {
          label: "Proxy-Hosts",
          value: String(proxyHosts.length),
        },
        {
          label: "Active",
          value: String(enabled),
        },
        {
          label: "Online",
          value: String(online),
          highlight: online > 0,
        },
        {
          label: "Offline",
          value: String(Math.max(offline, 0)),
          highlight: offline > 0,
        },
        {
          label: "Redirections",
          value: String(redirects.length),
        },
      ],
    };
  } catch (error) {
    return {
      title: "NPM",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Unreachable",
    };
  }
}
