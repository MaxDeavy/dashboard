import {
  fetchWithTimeout,
  formatBytes,
  formatPercent,
  type WidgetConfigInput,
  type WidgetResult,
} from "./base";

interface NextcloudInfoResponse {
  ocs?: {
    meta?: { status?: string; statuscode?: number; message?: string };
    data?: {
      nextcloud?: {
        system?: {
          freespace?: number | string;
          cpuload?: Array<number | string>;
          mem_total?: number | string;
          mem_free?: number | string;
        };
        storage?: {
          num_files?: number | string;
        };
      };
      activeUsers?: {
        last5minutes?: number | string;
      };
    };
  };
}

const INFO_PATH =
  "/ocs/v2.php/apps/serverinfo/api/v1/info?format=json&skipApps=true";

function sanitizeToken(token: string): string {
  return token
    .replace(/^\uFEFF/, "")
    .normalize("NFC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim()
    .replace(/^["']|["']$/g, "");
}

function resolveNextcloudBaseUrl(apiUrl: string): string {
  const trimmed = apiUrl.trim().replace(/\/+$/, "");
  const ocsIndex = trimmed.toLowerCase().indexOf("/ocs/");
  if (ocsIndex !== -1) {
    return trimmed.slice(0, ocsIndex);
  }
  return trimmed;
}

function formatCpuLoad(cpuload: Array<number | string> | undefined): string {
  if (!cpuload?.length) return "—";
  const value = Number(cpuload[0]);
  if (!Number.isFinite(value)) return "—";
  return value.toFixed(2);
}

function formatMemoryUsage(
  memTotal: number | string | undefined,
  memFree: number | string | undefined,
): string {
  const total = Number(memTotal);
  const free = Number(memFree);
  if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(free)) {
    return "—";
  }

  return formatPercent(((total - free) / total) * 100);
}

export async function fetchNextcloudWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const token = sanitizeToken(config.credentials?.apiKey ?? "");
  const base = resolveNextcloudBaseUrl(config.apiUrl);

  if (config.credentialsStored && !token) {
    return {
      title: "Nextcloud",
      status: "warning",
      fields: [],
      error:
        "Credentials in DB, but decryption failed (keep SESSION_SECRET unchanged and re-save token)",
    };
  }

  if (!token) {
    return {
      title: "Nextcloud",
      status: "warning",
      fields: [],
      error: "No NC token configured",
    };
  }

  if (!base) {
    return {
      title: "Nextcloud",
      status: "warning",
      fields: [],
      error: "No API URL configured",
    };
  }

  const url = `${base}${INFO_PATH}`;

  try {
    const response = await fetchWithTimeout(
      url,
      {
        headers: {
          Accept: "application/json",
          "OCS-APIRequest": "true",
          "NC-Token": token,
        },
      },
      config.extraConfig,
    );

    const text = await response.text();
    let payload: NextcloudInfoResponse;

    try {
      payload = JSON.parse(text) as NextcloudInfoResponse;
    } catch {
      throw new Error(`API: ${response.status} — Invalid response`);
    }

    const meta = payload.ocs?.meta;
    if (!response.ok || meta?.status !== "ok") {
      const hint = /[^\x00-\x7F]/.test(token)
        ? " (Token contains special characters?)"
        : "";
      const message = meta?.message ?? "Request failed";
      throw new Error(
        `API: ${meta?.statuscode ?? response.status} — ${message}${hint}`,
      );
    }

    const system = payload.ocs?.data?.nextcloud?.system;
    const storage = payload.ocs?.data?.nextcloud?.storage;
    const activeUsers = payload.ocs?.data?.activeUsers;

    const cpuLoad = formatCpuLoad(system?.cpuload);
    const memory = formatMemoryUsage(system?.mem_total, system?.mem_free);
    const freespace = Number(system?.freespace ?? 0);
    const active = Number(activeUsers?.last5minutes ?? 0);
    const files = Number(storage?.num_files ?? 0);

    return {
      title: "Nextcloud",
      status: "ok",
      fields: [
        {
          label: "CPU Load (1 min)",
          value: cpuLoad,
          highlight: Number(cpuLoad) > 1,
        },
        {
          label: "RAM",
          value: memory,
          highlight: memory !== "—" && Number.parseFloat(memory) > 80,
        },
        {
          label: "Free Storage",
          value: freespace > 0 ? formatBytes(freespace) : "—",
        },
        {
          label: "Active Users (5 min)",
          value: String(active),
          highlight: active > 0,
        },
        {
          label: "Files",
          value: files > 0 ? String(files) : "—",
        },
      ],
    };
  } catch (error) {
    return {
      title: "Nextcloud",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Unreachable",
    };
  }
}
