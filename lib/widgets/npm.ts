import {
  credentialString,
  fetchWithTimeout,
  normalizeApiUrl,
  truncate,
  type WidgetConfigInput,
  type WidgetResult,
} from "./base";

interface NpmProxyHost {
  enabled?: boolean;
  domain_names?: string[];
  meta?: { online?: boolean };
}

interface NpmCertificate {
  expires_on?: string;
  domain_names?: string[];
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

function formatOfflineHosts(hosts: NpmProxyHost[]): string {
  const domains = hosts
    .filter((host) => host.enabled !== false && host.meta?.online === false)
    .flatMap((host) => host.domain_names ?? [])
    .filter(Boolean);

  if (domains.length === 0) return "—";

  return truncate(domains.join(", "), 40);
}

function countExpiringCerts(certs: NpmCertificate[], withinDays: number): number {
  const threshold = Date.now() + withinDays * 86_400_000;
  return certs.filter((cert) => {
    if (!cert.expires_on) return false;
    const expires = new Date(cert.expires_on).getTime();
    return expires > Date.now() && expires < threshold;
  }).length;
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

    const [proxyRes, redirectRes, certRes, streamRes] = await Promise.all([
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
      fetchWithTimeout(
        `${base}/api/nginx/certificates`,
        { headers },
        config.extraConfig,
      ),
      fetchWithTimeout(
        `${base}/api/nginx/streams`,
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
    const certificates = certRes.ok
      ? ((await certRes.json()) as NpmCertificate[])
      : [];
    const streams = streamRes.ok
      ? ((await streamRes.json()) as NpmProxyHost[])
      : [];

    const enabled = proxyHosts.filter((host) => host.enabled !== false);
    const online = enabled.filter((host) => host.meta?.online === true).length;
    const offline = enabled.length - online;
    const expiringSoon = countExpiringCerts(certificates, 30);
    const offlineHosts = formatOfflineHosts(proxyHosts);

    return {
      title: "Nginx Proxy Manager",
      status: "ok",
      fields: [
        {
          label: "Proxy-Hosts",
          value: `${online}/${enabled.length} online`,
          highlight: online > 0,
        },
        {
          label: "Offline Hosts",
          value: offlineHosts,
          highlight: offline > 0,
        },
        {
          label: "SSL Certificates",
          value: String(certificates.length),
        },
        {
          label: "Certs Expiring",
          value: expiringSoon > 0 ? `${expiringSoon} in 30d` : "—",
          highlight: expiringSoon > 0,
        },
        {
          label: "Redirections",
          value: String(redirects.length),
        },
        {
          label: "Streams",
          value: String(streams.length),
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
