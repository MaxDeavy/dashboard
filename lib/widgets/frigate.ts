import {
  fetchWithTimeout,
  normalizeApiUrl,
  type WidgetConfigInput,
  type WidgetResult,
} from "./base";
import { readSetCookie } from "./http-helpers";

interface FrigateStats {
  cameras?: Record<
    string,
    {
      camera_fps?: number;
      detection_fps?: number;
      process_fps?: number;
    }
  >;
  detection_fps?: number;
  detectors?: Record<string, { inference_speed?: number }>;
  gpu_usages?: Record<string, number>;
  service?: { version?: string };
}

async function loginFrigate(
  base: string,
  username: string,
  password: string,
  extraConfig?: Record<string, string>,
): Promise<string> {
  for (const path of ["/login", "/api/login"]) {
    const response = await fetchWithTimeout(
      `${base}${path}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: username, password }),
      },
      extraConfig,
    );

    if (!response.ok) {
      continue;
    }

    const cookie = readSetCookie(response.headers, "frigate_token");
    if (cookie) {
      return cookie;
    }

    const data = (await response.json().catch(() => ({}))) as {
      access_token?: string;
    };
    if (data.access_token) {
      return data.access_token;
    }
  }

  throw new Error("Login failed");
}

function frigateApiBase(url: string): string {
  const base = normalizeApiUrl(url);
  return base.endsWith("/api") ? base.slice(0, -4) : base;
}

export async function fetchFrigateWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const username = config.credentials?.username;
  const password = config.credentials?.password;
  const base = frigateApiBase(config.apiUrl);

  const authHeaders: Record<string, string> = {};

  try {
    if (username && password) {
      const token = await loginFrigate(base, username, password, config.extraConfig);
      authHeaders.Cookie = `frigate_token=${token}`;
    }

    const [statsRes, configRes, summaryRes] = await Promise.all([
      fetchWithTimeout(`${base}/api/stats`, { headers: authHeaders }, config.extraConfig),
      fetchWithTimeout(`${base}/api/config`, { headers: authHeaders }, config.extraConfig).catch(
        () => null,
      ),
      fetchWithTimeout(
        `${base}/api/events/summary`,
        { headers: authHeaders },
        config.extraConfig,
      ).catch(() => null),
    ]);

    if (!statsRes.ok) {
      if (!username || !password) {
        return {
          title: "Frigate",
          status: "warning",
          fields: [],
          error: "Username and password required",
        };
      }
      throw new Error(`API: ${statsRes.status}`);
    }

    const stats = (await statsRes.json()) as FrigateStats;
    const cameras = stats.cameras ?? {};
    const cameraNames = Object.keys(cameras);
    const cameraFps = cameraNames.reduce(
      (sum, name) => sum + (cameras[name]?.camera_fps ?? 0),
      0,
    );
    const detectionFps = cameraNames.reduce(
      (sum, name) => sum + (cameras[name]?.detection_fps ?? 0),
      0,
    );
    const detectors = Object.values(stats.detectors ?? {});
    const avgInference =
      detectors.length > 0
        ? detectors.reduce((sum, detector) => sum + (detector.inference_speed ?? 0), 0) /
          detectors.length
        : 0;
    const configuredCameras = configRes?.ok
      ? Object.keys(
          ((await configRes.json()) as { cameras?: Record<string, unknown> }).cameras ?? {},
        ).length
      : cameraNames.length;
    const eventsToday = summaryRes?.ok
      ? ((await summaryRes.json()) as Array<{ count?: number }>).reduce(
          (sum, entry) => sum + (entry.count ?? 0),
          0,
        )
      : 0;
    const gpuUsage = Object.entries(stats.gpu_usages ?? {})
      .filter(([key]) => !["pid", "mib"].includes(key.toLowerCase()))
      .map(([, value]) => value)
      .find((value) => typeof value === "number" && value >= 0);

    return {
      title: "Frigate",
      status: "ok",
      fields: [
        { label: "Cameras", value: String(configuredCameras) },
        {
          label: "Detection FPS",
          value: (stats.detection_fps ?? detectionFps).toFixed(1),
        },
        { label: "Camera FPS", value: cameraFps.toFixed(1) },
        {
          label: "Inference Speed",
          value: avgInference > 0 ? `${avgInference.toFixed(0)} ms` : "—",
        },
        {
          label: "Events Today",
          value: String(eventsToday),
          highlight: eventsToday > 0,
        },
        {
          label: "Detectors Active",
          value: String(detectors.length),
        },
        {
          label: "GPU Usage",
          value: typeof gpuUsage === "number" ? `${gpuUsage.toFixed(1)}%` : "—",
        },
        { label: "Version", value: stats.service?.version ?? "—" },
      ],
    };
  } catch (error) {
    return {
      title: "Frigate",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Unreachable",
    };
  }
}
