import {
  fetchWithTimeout,
  type WidgetConfigInput,
  type WidgetResult,
} from "./base";

interface DockerContainer {
  State: string;
}

export async function fetchDockerWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const base = config.apiUrl.replace(/\/$/, "");

  try {
    const [containersRes, imagesRes] = await Promise.all([
      fetchWithTimeout(`${base}/containers/json?all=true`),
      fetchWithTimeout(`${base}/images/json`).catch(() => null),
    ]);

    if (!containersRes.ok) {
      throw new Error(`API: ${containersRes.status}`);
    }

    const containers = (await containersRes.json()) as DockerContainer[];
    const running = containers.filter((c) => c.State === "running").length;
    const stopped = containers.length - running;

    const fields = [
      {
        label: "Container gesamt",
        value: String(containers.length),
      },
      {
        label: "Laufend",
        value: String(running),
        highlight: running > 0,
      },
      {
        label: "Gestoppt",
        value: String(stopped),
        highlight: stopped > 0,
      },
    ];

    if (imagesRes?.ok) {
      const images = await imagesRes.json();
      fields.push({
        label: "Images",
        value: String(Array.isArray(images) ? images.length : 0),
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
      error: error instanceof Error ? error.message : "Nicht erreichbar",
    };
  }
}
