import {
  fetchWithTimeout,
  normalizeApiUrl,
  type WidgetConfigInput,
  type WidgetResult,
} from "./base";
import { fetchHeaderCount } from "./http-helpers";

function authentikBase(url: string): string {
  const base = normalizeApiUrl(url);
  return base.endsWith("/api/v3") ? base : `${base}/api/v3`;
}

export async function fetchAuthentikWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const token = config.credentials?.apiKey;
  const base = authentikBase(config.apiUrl);

  if (!token) {
    return {
      title: "Authentik",
      status: "warning",
      fields: [],
      error: "API key required",
    };
  }

  try {
    const headers = { Authorization: `Bearer ${token}` };

    const [users, applications, groups, providers, failedLoginsRes] =
      await Promise.all([
        fetchHeaderCount(`${base}/core/users/?page_size=1`, headers, config.extraConfig),
        fetchHeaderCount(
          `${base}/core/applications/?superuser_full_list=true&page_size=1`,
          headers,
          config.extraConfig,
        ),
        fetchHeaderCount(`${base}/core/groups/?page_size=1`, headers, config.extraConfig),
        fetchHeaderCount(`${base}/core/providers/all/?page_size=1`, headers, config.extraConfig),
        fetchWithTimeout(
          `${base}/events/events/?action=login_failed&page_size=1`,
          { headers },
          config.extraConfig,
        ).catch(() => null),
      ]);

    const failedLogins = failedLoginsRes?.ok
      ? (((await failedLoginsRes.json()) as { pagination?: { count?: number } })
          .pagination?.count ?? 0)
      : 0;

    return {
      title: "Authentik",
      status: "ok",
      fields: [
        { label: "Users", value: String(users) },
        { label: "Applications", value: String(applications) },
        { label: "Groups", value: String(groups) },
        { label: "Providers", value: String(providers) },
        {
          label: "Failed Logins",
          value: String(failedLogins),
          highlight: failedLogins > 0,
        },
      ],
    };
  } catch (error) {
    return {
      title: "Authentik",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Unreachable",
    };
  }
}
