import {
  fetchWithTimeout,
  formatBytes,
  formatBytesPerSec,
  formatPercent,
  credentialString,
  normalizeApiUrl,
  type WidgetConfigInput,
  type WidgetResult,
} from "./base";
import { extractXmlTagValue, extractXmlTagValues } from "./xml-utils";

const sessionCache = new Map<string, { sid: string; expiresAt: number }>();
const SESSION_TTL_MS = 10 * 60 * 1000;

function getSessionCacheKey(base: string, username: string): string {
  return `${base}::${username}`;
}

function encodeBase64Utf8(value: string): string {
  return Buffer.from(value, "utf8").toString("base64");
}

async function loginQnap(
  base: string,
  username: string,
  password: string,
  extraConfig?: Record<string, string>,
): Promise<string> {
  const cacheKey = getSessionCacheKey(base, username);
  const cached = sessionCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.sid;
  }

  const loginBody = `user=${encodeURIComponent(username)}&pwd=${encodeURIComponent(encodeBase64Utf8(password))}`;

  const response = await fetchWithTimeout(
    `${base}/cgi-bin/authLogin.cgi`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: loginBody,
    },
    extraConfig,
  );

  if (!response.ok) {
    throw new Error(`Login: ${response.status}`);
  }

  const xml = await response.text();
  const sid = extractXmlTagValue(xml, "authSid");
  const authPassed = extractXmlTagValue(xml, "authPassed");

  if (!sid || authPassed === "0") {
    throw new Error("Login failed");
  }

  sessionCache.set(cacheKey, {
    sid,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });

  return sid;
}

async function qnapApiCall(
  base: string,
  sid: string,
  endpoint: string,
  extraConfig?: Record<string, string>,
): Promise<string> {
  const separator = endpoint.includes("?") ? "&" : "?";
  const response = await fetchWithTimeout(
    `${base}${endpoint}${separator}sid=${encodeURIComponent(sid)}`,
    {},
    extraConfig,
  );

  if (!response.ok) {
    throw new Error(`API: ${response.status}`);
  }

  return response.text();
}

function parseVolumeUsage(
  volumeXml: string,
  volumeLabel?: string,
): { total: number; free: number } {
  const blocks = volumeXml.match(/<volumeUse>[\s\S]*?<\/volumeUse>/gi) ?? [];
  let total = 0;
  let free = 0;

  if (blocks.length === 0) {
    total = Number(extractXmlTagValue(volumeXml, "total_size")) || 0;
    free = Number(extractXmlTagValue(volumeXml, "free_size")) || 0;
    return { total, free };
  }

  if (volumeLabel) {
    const labels = volumeXml.match(/<volumeLabel>[\s\S]*?<\/volumeLabel>/gi) ?? [];
    const index = labels.findIndex(
      (entry) => extractXmlTagValue(entry, "volumeLabel") === volumeLabel,
    );
    if (index >= 0 && blocks[index]) {
      total = Number(extractXmlTagValue(blocks[index], "total_size")) || 0;
      free = Number(extractXmlTagValue(blocks[index], "free_size")) || 0;
      return { total, free };
    }
  }

  for (const block of blocks) {
    total += Number(extractXmlTagValue(block, "total_size")) || 0;
    free += Number(extractXmlTagValue(block, "free_size")) || 0;
  }

  return { total, free };
}

function parseQnapUptimeSeconds(xml: string): number {
  const days = Number(extractXmlTagValue(xml, "uptime_day").trim()) || 0;
  const hours = Number(extractXmlTagValue(xml, "uptime_hour").trim()) || 0;
  const minutes = Number(extractXmlTagValue(xml, "uptime_min").trim()) || 0;
  const seconds = Number(extractXmlTagValue(xml, "uptime_sec").trim()) || 0;
  const fromParts = days * 86_400 + hours * 3_600 + minutes * 60 + seconds;
  if (fromParts > 0) {
    return fromParts;
  }

  const legacy = Number(extractXmlTagValue(xml, "up_time").trim());
  return Number.isFinite(legacy) && legacy > 0 ? legacy : 0;
}

function formatUptime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const days = Math.floor(total / 86_400);
  const hours = Math.floor((total % 86_400) / 3_600);
  const minutes = Math.floor((total % 3_600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export async function fetchQnapWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const username = credentialString(config.credentials?.username) || "admin";
  const password = credentialString(config.credentials?.password);
  const base = normalizeApiUrl(config.apiUrl);
  const volumeLabel =
    config.extraConfig?.volume?.trim() ||
    config.extraConfig?.entityId?.trim() ||
    undefined;

  if (!password) {
    return {
      title: "QNAP",
      status: "warning",
      fields: [],
      error: "Password required",
    };
  }

  try {
    const sid = await loginQnap(base, username, password, config.extraConfig);

    const [systemXml, volumeXml] = await Promise.all([
      qnapApiCall(
        base,
        sid,
        "/cgi-bin/management/manaRequest.cgi?subfunc=sysinfo&hd=no&multicpu=1",
        config.extraConfig,
      ),
      qnapApiCall(
        base,
        sid,
        "/cgi-bin/management/chartReq.cgi?chart_func=disk_usage&disk_select=all&include=all",
        config.extraConfig,
      ),
    ]);

    const cpuValues = extractXmlTagValues(systemXml, "cpu_usage")
      .map((value) => Number(value.replace(/\s*%/g, "").trim()))
      .filter((value) => !Number.isNaN(value));
    const cpuUsage =
      cpuValues.length > 0
        ? cpuValues.reduce((sum, value) => sum + value, 0) / cpuValues.length
        : 0;
    const totalMemory = Number(extractXmlTagValue(systemXml, "total_memory")) || 0;
    const freeMemory = Number(extractXmlTagValue(systemXml, "free_memory")) || 0;
    const memoryUsage =
      totalMemory > 0 ? ((totalMemory - freeMemory) / totalMemory) * 100 : 0;
    const systemTemp = extractXmlTagValue(systemXml, "sys_tempc");
    const uptimeSeconds = parseQnapUptimeSeconds(systemXml);
    const firmwareVersion =
      extractXmlTagValue(systemXml, "version") ||
      extractXmlTagValue(systemXml, "firmware_version");
    const rxBytes = Number(extractXmlTagValue(systemXml, "rx_bytes")) || 0;
    const txBytes = Number(extractXmlTagValue(systemXml, "tx_bytes")) || 0;

    const { total: volumeTotal, free: volumeFree } = parseVolumeUsage(
      volumeXml,
      volumeLabel,
    );
    const volumeUsed = Math.max(volumeTotal - volumeFree, 0);
    const volumePercent =
      volumeTotal > 0 ? (volumeUsed / volumeTotal) * 100 : 0;

    return {
      title: "QNAP",
      status: "ok",
      fields: [
        {
          label: "CPU",
          value: formatPercent(cpuUsage),
          highlight: cpuUsage > 80,
        },
        {
          label: "RAM",
          value: formatPercent(memoryUsage),
          highlight: memoryUsage > 85,
        },
        {
          label: "Volume",
          value: `${formatBytes(volumeUsed)} / ${formatBytes(volumeTotal)}`,
          highlight: volumePercent > 90,
        },
        {
          label: "Temperature",
          value: systemTemp ? `${systemTemp} °C` : "—",
        },
        {
          label: "Uptime",
          value: uptimeSeconds > 0 ? formatUptime(uptimeSeconds) : "—",
        },
        {
          label: "Version",
          value: firmwareVersion || "—",
        },
        {
          label: "Download",
          value: rxBytes > 0 ? formatBytesPerSec(rxBytes) : "—",
        },
        {
          label: "Upload",
          value: txBytes > 0 ? formatBytesPerSec(txBytes) : "—",
        },
      ],
    };
  } catch (error) {
    return {
      title: "QNAP",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Unreachable",
    };
  }
}
