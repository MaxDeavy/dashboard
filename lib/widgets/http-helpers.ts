import { fetchWithTimeout } from "./base";

export function readSetCookie(headers: Headers, name: string): string {
  const raw = headers.get("set-cookie") ?? "";
  const match = raw.match(new RegExp(`${name}=([^;,\\s]+)`));
  return match?.[1] ?? "";
}

export async function fetchHeaderCount(
  url: string,
  headers: Record<string, string>,
  extraConfig?: Record<string, string>,
): Promise<number> {
  const response = await fetchWithTimeout(url, { headers }, extraConfig);
  const total = response.headers.get("x-total-count");
  if (total) {
    return Number.parseInt(total, 10) || 0;
  }

  if (!response.ok) {
    return 0;
  }

  const data = (await response.json()) as {
    total?: number;
    pagination?: { count?: number };
    data?: unknown[];
  };

  return data.pagination?.count ?? data.total ?? data.data?.length ?? 0;
}

export function parsePrometheusLabeledMetrics(text: string): {
  gauges: Map<string, number>;
  labeled: Array<{ name: string; labels: Record<string, string>; value: number }>;
} {
  const gauges = new Map<string, number>();
  const labeled: Array<{
    name: string;
    labels: Record<string, string>;
    value: number;
  }> = [];

  for (const line of text.split("\n")) {
    if (!line || line.startsWith("#")) continue;

    const match = line.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)(\{([^}]*)\})?\s+(-?[0-9.eE+-]+)/);
    if (!match) continue;

    const name = match[1];
    const value = Number.parseFloat(match[4]);
    if (!Number.isFinite(value)) continue;

    if (!match[2]) {
      gauges.set(name, value);
      continue;
    }

    const labels: Record<string, string> = {};
    for (const part of match[3].split(",")) {
      const labelMatch = part.match(/([a-zA-Z_][a-zA-Z0-9_]*)="([^"]*)"/);
      if (labelMatch) {
        labels[labelMatch[1]] = labelMatch[2];
      }
    }

    labeled.push({ name, labels, value });
  }

  return { gauges, labeled };
}
