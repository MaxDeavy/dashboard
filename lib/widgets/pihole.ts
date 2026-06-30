import {
  fetchWithTimeout,
  formatPercent,
  normalizeApiUrl,
  type WidgetConfigInput,
  type WidgetResult,
} from "./base";

interface PiHoleSummary {
  domains_being_blocked?: number;
  dns_queries_today?: number;
  ads_blocked_today?: number;
  ads_percentage_today?: number;
}

interface PiHoleV6Summary {
  queries?: {
    total?: number;
    blocked?: number;
    percent_blocked?: number;
  };
  gravity?: {
    domains_being_blocked?: number;
  };
}

function isLegacyPiHoleSummary(
  data: PiHoleSummary | PiHoleV6Summary,
): data is PiHoleSummary {
  return "dns_queries_today" in data || "ads_blocked_today" in data;
}

export async function authenticatePihole(
  base: string,
  password: string,
  extraConfig?: Record<string, string>,
): Promise<string> {
  const response = await fetchWithTimeout(
    `${base}/api/auth`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ password }),
    },
    extraConfig,
  );

  if (!response.ok) {
    throw new Error(`Auth: ${response.status}`);
  }

  const data = (await response.json()) as {
    session?: { sid?: string; valid?: boolean };
    sid?: string;
  };

  const sid = data.session?.sid ?? data.sid;
  if (!sid) {
    throw new Error("Auth: No session ID received");
  }

  return sid;
}

export async function fetchPiholeSummary(
  base: string,
  apiKey: string,
  extraConfig?: Record<string, string>,
): Promise<PiHoleSummary | PiHoleV6Summary> {
  const legacyUrl = `${base}/admin/api.php?summaryRaw&auth=${encodeURIComponent(apiKey)}`;
  const legacyRes = await fetchWithTimeout(legacyUrl, {}, extraConfig);

  if (legacyRes.ok) {
    return (await legacyRes.json()) as PiHoleSummary;
  }

  const sid = await authenticatePihole(base, apiKey, extraConfig);
  const v6Res = await fetchWithTimeout(
    `${base}/api/stats/summary`,
    {
      headers: {
        Accept: "application/json",
        "X-FTL-SID": sid,
      },
    },
    extraConfig,
  );

  if (!v6Res.ok) {
    throw new Error(`API: ${v6Res.status}`);
  }

  const payload = (await v6Res.json()) as PiHoleV6Summary & {
    summary?: PiHoleV6Summary;
  };

  return payload.summary ?? payload;
}

export async function fetchPiholeWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const apiKey = config.credentials?.apiKey;
  const base = normalizeApiUrl(config.apiUrl);
  const extraConfig = config.extraConfig;

  if (!apiKey) {
    return {
      title: "Pi-hole",
      status: "warning",
      fields: [],
      error: "No API key configured",
    };
  }

  try {
    const [data, clientsRes] = await Promise.all([
      fetchPiholeSummary(base, apiKey, extraConfig),
      fetchWithTimeout(
        `${base}/admin/api.php?getQuerySources&auth=${encodeURIComponent(apiKey)}`,
        {},
        extraConfig,
      ).catch(() => null),
    ]);
    const clients = clientsRes?.ok
      ? Object.keys(
          (((await clientsRes.json()) as { data?: Record<string, unknown> }).data ??
            {}) as Record<string, unknown>,
        ).length
      : 0;

    if (isLegacyPiHoleSummary(data)) {
      return buildLegacyResult(data, clients);
    }

    const queries = data.queries ?? {};
    const gravity = data.gravity ?? {};

    return {
      title: "Pi-hole",
      status: "ok",
      fields: [
        {
          label: "DNS Queries",
          value: String(queries.total ?? 0),
        },
        {
          label: "Blocked",
          value: String(queries.blocked ?? 0),
          highlight: (queries.blocked ?? 0) > 0,
        },
        {
          label: "Block Rate",
          value: formatPercent(queries.percent_blocked ?? 0),
        },
        {
          label: "Blocklists",
          value: String(gravity.domains_being_blocked ?? 0),
        },
        {
          label: "Clients",
          value: String(clients),
        },
        {
          label: "Total",
          value: String((queries.total ?? 0) + (queries.blocked ?? 0)),
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
      title: "Pi-hole",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Unreachable",
    };
  }
}

function buildLegacyResult(data: PiHoleSummary, clients = 0): WidgetResult {
  return {
    title: "Pi-hole",
    status: "ok",
    fields: [
      {
        label: "DNS Queries Today",
        value: String(data.dns_queries_today ?? 0),
      },
      {
        label: "Blocked Today",
        value: String(data.ads_blocked_today ?? 0),
        highlight: (data.ads_blocked_today ?? 0) > 0,
      },
      {
        label: "Block Rate",
        value: formatPercent(data.ads_percentage_today ?? 0),
      },
      {
        label: "Blocklists",
        value: String(data.domains_being_blocked ?? 0),
      },
      {
        label: "Clients",
        value: String(clients),
      },
      {
        label: "Total",
        value: String((data.dns_queries_today ?? 0) + (data.ads_blocked_today ?? 0)),
      },
      {
        label: "Status",
        value: "Connected",
        highlight: true,
      },
    ],
  };
}
