import {
  fetchWithTimeout,
  formatBytes,
  formatPercent,
  normalizeApiUrl,
  readApiError,
  type WidgetConfigInput,
  type WidgetResult,
} from "./base";

interface ProxmoxGuest {
  status?: string;
}

export async function fetchProxmoxWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const { apiUrl, credentials, extraConfig } = config;
  const base = normalizeApiUrl(apiUrl);
  const preferredNode = extraConfig?.node?.trim() || "pve";
  const token = buildProxmoxToken(credentials);

  if (!token) {
    return {
      title: "Proxmox",
      status: "warning",
      fields: [],
      error: "No API token configured (Token-ID + Secret)",
    };
  }

  try {
    const headers = {
      Authorization: `PVEAPIToken=${token}`,
    };

    const node = await resolveProxmoxNode(
      base,
      headers,
      preferredNode,
      extraConfig,
    );

    const [statusRes, qemuRes, lxcRes] = await Promise.all([
      fetchWithTimeout(
        `${base}/api2/json/nodes/${encodeURIComponent(node)}/status`,
        { headers },
        extraConfig,
      ),
      fetchWithTimeout(
        `${base}/api2/json/nodes/${encodeURIComponent(node)}/qemu`,
        { headers },
        extraConfig,
      ),
      fetchWithTimeout(
        `${base}/api2/json/nodes/${encodeURIComponent(node)}/lxc`,
        { headers },
        extraConfig,
      ),
    ]);

    if (!statusRes.ok) {
      throw new Error(await readApiError(statusRes));
    }

    const data = await statusRes.json();
    const status = data.data;

    const vms = qemuRes.ok
      ? ((await qemuRes.json()).data as ProxmoxGuest[])
      : [];
    const lxcs = lxcRes.ok
      ? ((await lxcRes.json()).data as ProxmoxGuest[])
      : [];

    const cpuPercent = (status.cpu ?? 0) * 100;
    const memUsed = status.memory?.used ?? 0;
    const memTotal = status.memory?.total ?? 1;
    const memPercent = (memUsed / memTotal) * 100;
    const diskUsed = status.rootfs?.used ?? 0;
    const diskTotal = status.rootfs?.total ?? 0;
    const diskPercent = diskTotal > 0 ? (diskUsed / diskTotal) * 100 : 0;
    const loadavg = Array.isArray(status.loadavg)
      ? status.loadavg[0]
      : undefined;

    const runningVms = vms.filter((vm) => vm.status === "running").length;
    const runningLxc = lxcs.filter((lxc) => lxc.status === "running").length;

    return {
      title: `Proxmox · ${node}`,
      status: "ok",
      fields: [
        {
          label: "CPU",
          value: loadavg != null
            ? `${formatPercent(cpuPercent)} (load ${loadavg})`
            : formatPercent(cpuPercent),
          highlight: cpuPercent > 80,
        },
        {
          label: "RAM",
          value: `${formatPercent(memPercent)} (${formatBytes(memUsed)} / ${formatBytes(memTotal)})`,
          highlight: memPercent > 85,
        },
        ...(diskTotal > 0
          ? [
              {
                label: "Disk",
                value: `${formatPercent(diskPercent)} (${formatBytes(diskUsed)} / ${formatBytes(diskTotal)})`,
                highlight: diskPercent > 85,
              },
            ]
          : []),
        {
          label: "VMs",
          value: `${runningVms}/${vms.length} running`,
          highlight: runningVms > 0,
        },
        {
          label: "LXC",
          value: `${runningLxc}/${lxcs.length} running`,
          highlight: runningLxc > 0,
        },
        {
          label: "Uptime",
          value: formatUptime(status.uptime ?? 0),
        },
      ],
    };
  } catch (error) {
    return {
      title: "Proxmox",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Unreachable",
    };
  }
}

function buildProxmoxToken(
  credentials: WidgetConfigInput["credentials"],
): string | null {
  if (!credentials) return null;

  const tokenId = credentials.token?.trim();
  const tokenSecret = credentials.tokenSecret?.trim();

  if (tokenId && tokenSecret) {
    return `${tokenId}=${tokenSecret}`;
  }

  if (tokenId?.includes("=")) {
    return tokenId;
  }

  return null;
}

async function resolveProxmoxNode(
  base: string,
  headers: Record<string, string>,
  preferredNode: string,
  extraConfig?: Record<string, string>,
): Promise<string> {
  const preferredResponse = await fetchWithTimeout(
    `${base}/api2/json/nodes/${encodeURIComponent(preferredNode)}/status`,
    { headers },
    extraConfig,
  );

  if (preferredResponse.ok) {
    return preferredNode;
  }

  const nodesResponse = await fetchWithTimeout(
    `${base}/api2/json/nodes`,
    { headers },
    extraConfig,
  );

  if (!nodesResponse.ok) {
    throw new Error(await readApiError(preferredResponse));
  }

  const nodesData = await nodesResponse.json();
  const nodes = (nodesData.data ?? []) as Array<{ node?: string }>;
  const discovered = nodes.map((entry) => entry.node).filter(Boolean) as string[];

  if (discovered.length === 0) {
    throw new Error(await readApiError(preferredResponse));
  }

  if (discovered.includes(preferredNode)) {
    return preferredNode;
  }

  return discovered[0]!;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}
