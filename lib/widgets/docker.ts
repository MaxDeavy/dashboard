import {
  fetchWithTimeout,
  formatBytes,
  type WidgetConfigInput,
  type WidgetResult,
} from "./base";

interface DockerContainer {
  State: string;
}

interface DockerInfo {
  ContainersPaused?: number;
  Images?: number;
  NCPU?: number;
  MemTotal?: number;
}

export async function fetchDockerWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const base = config.apiUrl.replace(/\/$/, "");

  try {
    const [containersRes, imagesRes, infoRes, versionRes] = await Promise.all([
      fetchWithTimeout(`${base}/containers/json?all=true`),
      fetchWithTimeout(`${base}/images/json`).catch(() => null),
      fetchWithTimeout(`${base}/info`).catch(() => null),
      fetchWithTimeout(`${base}/version`).catch(() => null),
    ]);

    if (!containersRes.ok) {
      throw new Error(`API: ${containersRes.status}`);
    }

    const containers = (await containersRes.json()) as DockerContainer[];
    const running = containers.filter((c) => c.State === "running").length;
    const stopped = containers.length - running;
    const paused = containers.filter((c) => c.State === "paused").length;

    const fields = [
      {
        label: "Total Containers",
        value: String(containers.length),
      },
      {
        label: "Running",
        value: String(running),
        highlight: running > 0,
      },
      {
        label: "Stopped",
        value: String(stopped),
        highlight: stopped > 0,
      },
      {
        label: "Paused",
        value: String(paused),
        highlight: paused > 0,
      },
    ];

    if (imagesRes?.ok) {
      const images = await imagesRes.json();
      fields.push({
        label: "Images",
        value: String(Array.isArray(images) ? images.length : 0),
      });
    }
    if (infoRes?.ok) {
      const info = (await infoRes.json()) as DockerInfo;
      fields.push(
        {
          label: "CPU",
          value: String(info.NCPU ?? "—"),
        },
        {
          label: "RAM",
          value: info.MemTotal ? formatBytes(info.MemTotal) : "—",
        },
      );
      if ((info.Images ?? 0) > 0 && !fields.some((field) => field.label === "Images")) {
        fields.push({
          label: "Images",
          value: String(info.Images ?? 0),
        });
      }
    }
    if (versionRes?.ok) {
      const version = (await versionRes.json()) as { Version?: string };
      fields.push({
        label: "Version",
        value: version.Version ?? "—",
      });
    }

    return {
      title: "Docker",
      status: "ok",
      fields,
    };
  } catch (error) {
    return {
      title: "Docker",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Unreachable",
    };
  }
}
