import {
  fetchWithTimeout,
  normalizeApiUrl,
  type WidgetConfigInput,
  type WidgetResult,
} from "./base";

export async function fetchTautulliWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const apiKey = config.credentials?.apiKey;
  const base = normalizeApiUrl(config.apiUrl);

  if (!apiKey) {
    return {
      title: "Tautulli",
      status: "warning",
      fields: [],
      error: "API key required",
    };
  }

  try {
    const params = new URLSearchParams({
      apikey: apiKey,
      cmd: "get_activity",
      out_type: "json",
    });

    const [activityRes, infoRes] = await Promise.all([
      fetchWithTimeout(
        `${base}/api/v2?${params.toString()}`,
        {},
        config.extraConfig,
      ),
      fetchWithTimeout(
        `${base}/api/v2?${new URLSearchParams({
          apikey: apiKey,
          cmd: "get_server_info",
          out_type: "json",
        }).toString()}`,
        {},
        config.extraConfig,
      ).catch(() => null),
    ]);

    if (!activityRes.ok) {
      throw new Error(`API: ${activityRes.status}`);
    }

    const activityPayload = (await activityRes.json()) as {
      response?: {
        data?: {
          stream_count?: number;
          stream_count_direct_stream?: number;
          stream_count_direct_play?: number;
          stream_count_transcode?: number;
          total_bandwidth?: number;
          sessions?: Array<{ user?: string }>;
        };
      };
    };

    const activity = activityPayload.response?.data;
    const streams = activity?.stream_count ?? 0;
    const usersWatching = new Set(
      (activity?.sessions ?? []).map((session) => session.user).filter(Boolean),
    ).size;

    const libParams = new URLSearchParams({
      apikey: apiKey,
      cmd: "get_libraries",
      out_type: "json",
    });

    const libRes = await fetchWithTimeout(
      `${base}/api/v2?${libParams.toString()}`,
      {},
      config.extraConfig,
    );

    let libraries = 0;
    if (libRes.ok) {
      const libPayload = (await libRes.json()) as {
        response?: { data?: unknown[] };
      };
      libraries = libPayload.response?.data?.length ?? 0;
    }

    const infoPayload = infoRes?.ok
      ? ((await infoRes.json()) as { response?: { data?: { version?: string } } })
      : {};
    const plexVersion = infoPayload.response?.data?.version ?? "—";
    const bandwidth = activity?.total_bandwidth ?? 0;

    return {
      title: "Tautulli",
      status: "ok",
      fields: [
        {
          label: "Streams",
          value: String(streams),
          highlight: streams > 0,
        },
        {
          label: "Direct Play",
          value: String(activity?.stream_count_direct_play ?? 0),
        },
        {
          label: "Transcode",
          value: String(activity?.stream_count_transcode ?? 0),
          highlight: (activity?.stream_count_transcode ?? 0) > 0,
        },
        {
          label: "Libraries",
          value: String(libraries),
        },
        {
          label: "Users",
          value: String(usersWatching),
          highlight: usersWatching > 0,
        },
        {
          label: "Usage",
          value: bandwidth > 0 ? `${bandwidth} kbps` : "0 kbps",
          highlight: bandwidth > 0,
        },
        {
          label: "Version",
          value: plexVersion,
        },
      ],
    };
  } catch (error) {
    return {
      title: "Tautulli",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Unreachable",
    };
  }
}
