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
      error: "API-Key erforderlich",
    };
  }

  try {
    const params = new URLSearchParams({
      apikey: apiKey,
      cmd: "get_activity",
      out_type: "json",
    });

    const activityRes = await fetchWithTimeout(
      `${base}/api/v2?${params.toString()}`,
      {},
      config.extraConfig,
    );

    if (!activityRes.ok) {
      throw new Error(`API: ${activityRes.status}`);
    }

    const activityPayload = (await activityRes.json()) as {
      response?: {
        data?: {
          stream_count?: number;
          stream_count_direct_play?: number;
          stream_count_transcode?: number;
        };
      };
    };

    const activity = activityPayload.response?.data;
    const streams = activity?.stream_count ?? 0;

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
          label: "Bibliotheken",
          value: String(libraries),
        },
      ],
    };
  } catch (error) {
    return {
      title: "Tautulli",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Nicht erreichbar",
    };
  }
}
