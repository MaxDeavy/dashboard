import {
  fetchWithTimeout,
  normalizeApiUrl,
  type WidgetConfigInput,
  type WidgetResult,
} from "./base";
import { readSetCookie } from "./http-helpers";

interface VaultwardenUser {
  userEnabled?: boolean;
  organizations?: unknown[];
}

async function loginVaultwardenAdmin(
  base: string,
  token: string,
  extraConfig?: Record<string, string>,
): Promise<string> {
  const response = await fetchWithTimeout(
    `${base}/admin`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `token=${encodeURIComponent(token)}`,
    },
    extraConfig,
  );

  if (!response.ok) {
    throw new Error(`Login: ${response.status}`);
  }

  const cookie = readSetCookie(response.headers, "VW_ADMIN");
  if (!cookie) {
    throw new Error("Login failed");
  }

  return cookie;
}

export async function fetchVaultwardenWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const token = config.credentials?.apiKey;
  const base = normalizeApiUrl(config.apiUrl);

  if (!token) {
    return {
      title: "Vaultwarden",
      status: "warning",
      fields: [],
      error: "API key required",
    };
  }

  try {
    const cookie = await loginVaultwardenAdmin(base, token, config.extraConfig);
    const authHeaders = { Cookie: `VW_ADMIN=${cookie}` };

    const [usersRes, diagnosticsRes] = await Promise.all([
      fetchWithTimeout(`${base}/admin/users`, { headers: authHeaders }, config.extraConfig),
      fetchWithTimeout(
        `${base}/admin/diagnostics/config`,
        { headers: authHeaders },
        config.extraConfig,
      ).catch(() => null),
    ]);

    if (!usersRes.ok) {
      throw new Error(`API: ${usersRes.status}`);
    }

    const users = (await usersRes.json()) as VaultwardenUser[];
    const enabled = users.filter((user) => user.userEnabled !== false).length;
    const organizations = users.reduce(
      (sum, user) => sum + (user.organizations?.length ?? 0),
      0,
    );

    let version = "—";
    let webVaultEnabled = "—";
    if (diagnosticsRes?.ok) {
      const diagnostics = (await diagnosticsRes.json()) as {
        version?: string;
        web_vault_enabled?: boolean;
      };
      version = diagnostics.version ?? "—";
      webVaultEnabled =
        typeof diagnostics.web_vault_enabled === "boolean"
          ? diagnostics.web_vault_enabled
            ? "Yes"
            : "No"
          : "—";
    }

    return {
      title: "Vaultwarden",
      status: "ok",
      fields: [
        { label: "Users", value: String(users.length) },
        {
          label: "Enabled Users",
          value: String(enabled),
          highlight: enabled > 0,
        },
        { label: "Organizations", value: String(organizations) },
        { label: "Version", value: version },
        { label: "Web Vault", value: webVaultEnabled },
      ],
    };
  } catch (error) {
    return {
      title: "Vaultwarden",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Unreachable",
    };
  }
}
