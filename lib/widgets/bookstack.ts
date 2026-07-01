import {
  fetchWithTimeout,
  normalizeApiUrl,
  type WidgetConfigInput,
  type WidgetResult,
} from "./base";
import { fetchHeaderCount } from "./http-helpers";

function bookStackBase(url: string): string {
  const base = normalizeApiUrl(url);
  return base.endsWith("/api") ? base : `${base}/api`;
}

export async function fetchBookStackWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const token = config.credentials?.apiKey;
  const base = bookStackBase(config.apiUrl);
  const statusBase = normalizeApiUrl(config.apiUrl).replace(/\/api$/, "");

  if (!token) {
    return {
      title: "BookStack",
      status: "warning",
      fields: [],
      error: "API key required",
    };
  }

  try {
    const headers = { Authorization: `Token ${token}` };

    const [systemRes, shelves, books, pages, users, healthRes] =
      await Promise.all([
        fetchWithTimeout(`${base}/system`, { headers }, config.extraConfig),
        fetchHeaderCount(`${base}/shelves?count=1`, headers, config.extraConfig),
        fetchHeaderCount(`${base}/books?count=1`, headers, config.extraConfig),
        fetchHeaderCount(`${base}/pages?count=1`, headers, config.extraConfig),
        fetchHeaderCount(`${base}/users?count=1`, headers, config.extraConfig).catch(() =>
          Promise.resolve(0),
        ),
        fetchWithTimeout(`${statusBase}/status`, {}, config.extraConfig).catch(() => null),
      ]);

    if (!systemRes.ok) {
      throw new Error(`API: ${systemRes.status}`);
    }

    const system = (await systemRes.json()) as {
      version?: string;
      app_name?: string;
    };
    const health = healthRes?.ok
      ? ((await healthRes.json()) as {
          database?: boolean;
          cache?: boolean;
        })
      : null;

    return {
      title: "BookStack",
      status: "ok",
      fields: [
        { label: "Version", value: system.version ?? "—" },
        { label: "Shelves", value: String(shelves) },
        { label: "Books", value: String(books) },
        { label: "Pages", value: String(pages) },
        { label: "Users", value: String(users) },
        { label: "App Name", value: system.app_name ?? "—" },
        {
          label: "Database OK",
          value:
            typeof health?.database === "boolean"
              ? health.database
                ? "Yes"
                : "No"
              : "—",
        },
        {
          label: "Cache OK",
          value:
            typeof health?.cache === "boolean"
              ? health.cache
                ? "Yes"
                : "No"
              : "—",
        },
      ],
    };
  } catch (error) {
    return {
      title: "BookStack",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Unreachable",
    };
  }
}
