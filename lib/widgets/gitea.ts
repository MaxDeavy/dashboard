import {
  fetchWithTimeout,
  normalizeApiUrl,
  type WidgetConfigInput,
  type WidgetResult,
} from "./base";
import { fetchHeaderCount } from "./http-helpers";

function giteaBase(url: string): string {
  const base = normalizeApiUrl(url);
  return base.endsWith("/api/v1") ? base : `${base}/api/v1`;
}

export async function fetchGiteaWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const token = config.credentials?.apiKey;
  const base = giteaBase(config.apiUrl);

  if (!token) {
    return {
      title: "Gitea",
      status: "warning",
      fields: [],
      error: "API key required",
    };
  }

  try {
    const headers = { Authorization: `token ${token}` };

    const [versionRes, users, orgs, repos, issues, pulls] = await Promise.all([
      fetchWithTimeout(`${base}/version`, { headers }, config.extraConfig),
      fetchHeaderCount(`${base}/admin/users?limit=1`, headers, config.extraConfig),
      fetchHeaderCount(`${base}/admin/orgs?limit=1`, headers, config.extraConfig),
      fetchHeaderCount(`${base}/repos/search?limit=1`, headers, config.extraConfig),
      fetchHeaderCount(
        `${base}/repos/issues/search?state=open&type=issues&limit=1`,
        headers,
        config.extraConfig,
      ),
      fetchHeaderCount(
        `${base}/repos/issues/search?state=open&type=pulls&limit=1`,
        headers,
        config.extraConfig,
      ),
    ]);

    if (!versionRes.ok) {
      throw new Error(`API: ${versionRes.status}`);
    }

    const version = ((await versionRes.json()) as { version?: string }).version ?? "—";

    return {
      title: "Gitea",
      status: "ok",
      fields: [
        { label: "Version", value: version },
        { label: "Users", value: String(users) },
        { label: "Organizations", value: String(orgs) },
        { label: "Repositories", value: String(repos) },
        {
          label: "Open Issues",
          value: String(issues),
          highlight: issues > 0,
        },
        {
          label: "Open Pull Requests",
          value: String(pulls),
          highlight: pulls > 0,
        },
      ],
    };
  } catch (error) {
    return {
      title: "Gitea",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Unreachable",
    };
  }
}
