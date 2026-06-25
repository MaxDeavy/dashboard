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
    throw new Error("Auth: Keine Session-ID erhalten");
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
      error: "Kein API-Key konfiguriert",
    };
  }

  try {
    const data = await fetchPiholeSummary(base, apiKey, extraConfig);

    if (isLegacyPiHoleSummary(data)) {
      return buildLegacyResult(data);
    }

    const queries = data.queries ?? {};
    const gravity = data.gravity ?? {};

    return {
      title: "Pi-hole",
      status: "ok",
      fields: [
        {
          label: "DNS-Anfragen",
          value: String(queries.total ?? 0),
        },
        {
          label: "Blockiert",
          value: String(queries.blocked ?? 0),
          highlight: (queries.blocked ?? 0) > 0,
        },
        {
          label: "Block-Rate",
          value: formatPercent(queries.percent_blocked ?? 0),
        },
        {
          label: "Blocklisten",
          value: String(gravity.domains_being_blocked ?? 0),
        },
      ],
    };
  } catch (error) {
    return {
      title: "Pi-hole",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Nicht erreichbar",
    };
  }
}

function buildLegacyResult(data: PiHoleSummary): WidgetResult {
  return {
    title: "Pi-hole",
    status: "ok",
    fields: [
      {
        label: "DNS-Anfragen heute",
        value: String(data.dns_queries_today ?? 0),
      },
      {
        label: "Blockiert heute",
        value: String(data.ads_blocked_today ?? 0),
        highlight: (data.ads_blocked_today ?? 0) > 0,
      },
      {
        label: "Block-Rate",
        value: formatPercent(data.ads_percentage_today ?? 0),
      },
      {
        label: "Blocklisten",
        value: String(data.domains_being_blocked ?? 0),
      },
    ],
  };
}
