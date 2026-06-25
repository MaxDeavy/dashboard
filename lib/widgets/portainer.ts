import { fetchWithTimeout, normalizeApiUrl, type WidgetConfigInput, type WidgetResult } from "./base";

interface PortainerEndpoint {
  Id: number;
  Name: string;
  Type: number;
}

interface DockerContainer {
  State: string;
}

export async function fetchPortainerWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const token = config.credentials?.apiKey;
  const base = normalizeApiUrl(config.apiUrl);

  if (!token) {
    return {
      title: "Portainer",
      status: "warning",
      fields: [],
      error: "No API token configured",
    };
  }

  try {
    const headers = { "X-API-Key": token };
    let endpointId = config.extraConfig?.endpointId;

    if (!endpointId) {
      const endpointsRes = await fetchWithTimeout(
        `${base}/api/endpoints`,
        { headers },
        config.extraConfig,
      );
      if (!endpointsRes.ok) {
        throw new Error(`Endpoints: ${endpointsRes.status}`);
      }
      const endpoints = (await endpointsRes.json()) as PortainerEndpoint[];
      const local =
        endpoints.find((e) => e.Type === 1) ?? endpoints[0];
      endpointId = String(local?.Id ?? "");
    }

    if (!endpointId) {
      throw new Error("Kein Endpoint gefunden");
    }

    const containersRes = await fetchWithTimeout(
      `${base}/api/endpoints/${endpointId}/docker/containers/json?all=1`,
      { headers },
      config.extraConfig,
    );

    if (!containersRes.ok) {
      throw new Error(`Container: ${containersRes.status}`);
    }

    const containers = (await containersRes.json()) as DockerContainer[];
    const running = containers.filter((c) => c.State === "running").length;
    const stopped = containers.length - running;

    return {
      title: "Portainer",
      status: "ok",
      fields: [
        {
          label: "Endpoint",
          value: endpointId,
        },
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
      ],
    };
  } catch (error) {
    return {
      title: "Portainer",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Unreachable",
    };
  }
}
