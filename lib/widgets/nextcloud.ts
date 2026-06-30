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
  const capabilitiesUrl =
    `${base}/ocs/v2.php/cloud/capabilities?format=json`;
  const sharesUrl = `${base}/ocs/v2.php/apps/files_sharing/api/v1/shares?format=json`;

  try {
    const requestOptions = {
      headers: {
        Accept: "application/json",
        "OCS-APIRequest": "true",
        "NC-Token": token,
      },
    };
    const [response, capabilitiesRes, sharesRes] = await Promise.all([
      fetchWithTimeout(url, requestOptions, config.extraConfig),
      fetchWithTimeout(capabilitiesUrl, requestOptions, config.extraConfig).catch(() => null),
      fetchWithTimeout(sharesUrl, requestOptions, config.extraConfig).catch(() => null),
    ]);

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
    const activeHour = Number((activeUsers as { last1hour?: number | string } | undefined)?.last1hour ?? 0);
    const activeDay = Number((activeUsers as { last24hours?: number | string } | undefined)?.last24hours ?? 0);
    const files = Number(storage?.num_files ?? 0);
    const shares = sharesRes?.ok
      ? (((await sharesRes.json()) as { ocs?: { data?: unknown[] } }).ocs?.data?.length ?? 0)
      : 0;
    const capabilities = capabilitiesRes?.ok
      ? ((await capabilitiesRes.json()) as {
          ocs?: {
            data?: {
              version?: { string?: string };
              apps?: { enabled?: string[] };
            };
          };
        })
      : {};
    const appsCount = capabilities.ocs?.data?.apps?.enabled?.length ?? 0;
    const version = capabilities.ocs?.data?.version?.string ?? "—";

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
        {
          label: "Version",
          value: version,
        },
        {
          label: "Total",
          value: String(appsCount),
        },
        {
          label: "Pending",
          value: String(shares),
          highlight: shares > 0,
        },
        {
          label: "Users",
          value: `${active}/${activeHour}/${activeDay}`,
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
