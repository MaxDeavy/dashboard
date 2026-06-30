import {
  fetchWithTimeout,
  normalizeApiUrl,
  type WidgetConfigInput,
  type WidgetResult,
} from "./base";

interface GuacamoleTokenResponse {
  authToken?: string;
  dataSource?: string;
}

async function loginGuacamole(
  base: string,
  username: string,
  password: string,
  extraConfig?: Record<string, string>,
): Promise<GuacamoleTokenResponse> {
  const response = await fetchWithTimeout(
    `${base}/api/tokens`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username, password }).toString(),
    },
    extraConfig,
  );

  if (!response.ok) {
    throw new Error(`Login: ${response.status}`);
  }

  return (await response.json()) as GuacamoleTokenResponse;
}

export async function fetchGuacamoleWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const username = config.credentials?.username;
  const password = config.credentials?.password;
  const base = normalizeApiUrl(config.apiUrl);

  if (!username || !password) {
    return {
      title: "Guacamole",
      status: "warning",
      fields: [],
      error: "Username and password required",
    };
  }

  try {
    const login = await loginGuacamole(
      base,
      username,
      password,
      config.extraConfig,
    );

    const authToken = login.authToken;
    if (!authToken) {
      throw new Error("Login: No token received");
    }

    const dataSource =
      config.extraConfig?.dataSource?.trim() ||
      config.extraConfig?.endpointId?.trim() ||
      login.dataSource ||
      "postgresql";

    const headers = { Accept: "application/json" };
    const tokenParam = `token=${encodeURIComponent(authToken)}`;

    const [activeRes, connectionsRes, usersRes, groupsRes, historyRes] = await Promise.all([
      fetchWithTimeout(
        `${base}/api/session/data/${encodeURIComponent(dataSource)}/activeConnections?${tokenParam}`,
        { headers },
        config.extraConfig,
      ),
      fetchWithTimeout(
        `${base}/api/session/data/${encodeURIComponent(dataSource)}/connections?${tokenParam}`,
        { headers },
        config.extraConfig,
      ),
      fetchWithTimeout(
        `${base}/api/session/data/${encodeURIComponent(dataSource)}/users?${tokenParam}`,
        { headers },
        config.extraConfig,
      ).catch(() => null),
      fetchWithTimeout(
        `${base}/api/session/data/${encodeURIComponent(dataSource)}/userGroups?${tokenParam}`,
        { headers },
        config.extraConfig,
      ).catch(() => null),
      fetchWithTimeout(
        `${base}/api/session/data/${encodeURIComponent(dataSource)}/history/connections?${tokenParam}`,
        { headers },
        config.extraConfig,
      ).catch(() => null),
    ]);

    if (!activeRes.ok) {
      throw new Error(`Sessions: ${activeRes.status}`);
    }

    const activeConnections = (await activeRes.json()) as Record<
      string,
      unknown
    >;
    const activeCount = Object.keys(activeConnections).length;

    let configuredCount = "—";
    if (connectionsRes.ok) {
      const connections = (await connectionsRes.json()) as Record<
        string,
        unknown
      >;
      configuredCount = String(Object.keys(connections).length);
    }
    const users = usersRes?.ok
      ? Object.keys((await usersRes.json()) as Record<string, unknown>).length
      : 0;
    const groups = groupsRes?.ok
      ? Object.keys((await groupsRes.json()) as Record<string, unknown>).length
      : 0;
    const history = historyRes?.ok
      ? Object.keys((await historyRes.json()) as Record<string, unknown>).length
      : 0;

    return {
      title: "Guacamole",
      status: "ok",
      fields: [
        {
          label: "Active Sessions",
          value: String(activeCount),
          highlight: activeCount > 0,
        },
        { label: "Connections", value: configuredCount },
        { label: "Data Source", value: dataSource },
        { label: "Users", value: String(users) },
        { label: "Groups", value: String(groups) },
        {
          label: "History",
          value: String(history),
          highlight: history > 0,
        },
      ],
    };
  } catch (error) {
    return {
      title: "Guacamole",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Unreachable",
    };
  }
}
