import {
  fetchWithTimeout,
  normalizeApiUrl,
  type WidgetConfigInput,
  type WidgetResult,
} from "./base";

async function freshRssAuth(
  base: string,
  email: string,
  password: string,
  extraConfig?: Record<string, string>,
): Promise<string> {
  const response = await fetchWithTimeout(
    `${base}/api/greader.php/accounts/ClientLogin?Email=${encodeURIComponent(email)}&Passwd=${encodeURIComponent(password)}`,
    {},
    extraConfig,
  );

  if (!response.ok) {
    throw new Error(`Login: ${response.status}`);
  }

  const text = await response.text();
  const authMatch = text.match(/Auth=([^\n\r]+)/);
  if (!authMatch?.[1]) {
    throw new Error("Login failed");
  }

  return authMatch[1];
}

export async function fetchFreshRssWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const email = config.credentials?.username;
  const password = config.credentials?.password;
  const base = normalizeApiUrl(config.apiUrl);

  if (!email || !password) {
    return {
      title: "FreshRSS",
      status: "warning",
      fields: [],
      error: "Username and password required",
    };
  }

  try {
    const auth = await freshRssAuth(base, email, password, config.extraConfig);
    const headers = { Authorization: `GoogleLogin auth=${auth}` };
    const apiBase = `${base}/api/greader.php/reader/api/0`;

    const [unreadRes, subscriptionsRes, tagsRes] = await Promise.all([
      fetchWithTimeout(
        `${apiBase}/unread-count?output=json`,
        { headers },
        config.extraConfig,
      ),
      fetchWithTimeout(
        `${apiBase}/subscription/list?output=json`,
        { headers },
        config.extraConfig,
      ),
      fetchWithTimeout(
        `${apiBase}/tag/list?output=json`,
        { headers },
        config.extraConfig,
      ).catch(() => null),
    ]);

    if (!unreadRes.ok || !subscriptionsRes.ok) {
      throw new Error(`API: ${unreadRes.status || subscriptionsRes.status}`);
    }

    const unreadPayload = (await unreadRes.json()) as {
      unreadcounts?: Array<{ id?: string; count?: number }>;
    };
    const subscriptionsPayload = (await subscriptionsRes.json()) as {
      subscriptions?: unknown[];
    };
    const tagsPayload = tagsRes?.ok
      ? ((await tagsRes.json()) as { tags?: unknown[] })
      : null;

    const unreadCounts = unreadPayload.unreadcounts ?? [];
    const totalUnread = unreadCounts.reduce(
      (sum, entry) => sum + (entry.count ?? 0),
      0,
    );
    const feedsWithUnread = unreadCounts.filter(
      (entry) => (entry.count ?? 0) > 0 && !entry.id?.includes("reading-list"),
    ).length;
    const subscriptions = subscriptionsPayload.subscriptions?.length ?? 0;
    const categories = tagsPayload?.tags?.length ?? 0;

    return {
      title: "FreshRSS",
      status: "ok",
      fields: [
        {
          label: "Unread Articles",
          value: String(totalUnread),
          highlight: totalUnread > 0,
        },
        { label: "Subscriptions", value: String(subscriptions) },
        { label: "Categories", value: String(categories) },
        {
          label: "Feeds with Unread",
          value: String(feedsWithUnread),
          highlight: feedsWithUnread > 0,
        },
      ],
    };
  } catch (error) {
    return {
      title: "FreshRSS",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Unreachable",
    };
  }
}
