import { fetchWithTimeout, type WidgetConfigInput, type WidgetResult } from "./base";

export async function fetchHomeAssistantWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const token = config.credentials?.token;
  const base = config.apiUrl.replace(/\/$/, "");
  const entityId = config.extraConfig?.entityId;

  if (!token) {
    return {
      title: "Home Assistant",
      status: "warning",
      fields: [],
      error: "No access token configured",
    };
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  try {
    if (entityId) {
      const response = await fetchWithTimeout(
        `${base}/api/states/${encodeURIComponent(entityId)}`,
        { headers },
      );

      if (!response.ok) {
        throw new Error(`Entity API: ${response.status}`);
      }

      const state = await response.json();
      return {
        title: "Home Assistant",
        status: "ok",
        fields: [
          {
            label: "Entity",
            value: entityId,
          },
          {
            label: "Status",
            value: String(state.state ?? "unknown"),
            highlight: true,
          },
          {
            label: "Name",
            value: String(state.attributes?.friendly_name ?? entityId),
          },
          {
            label: "Last Changed",
            value: state.last_changed
              ? new Date(state.last_changed).toLocaleString("de-DE")
              : "—",
          },
        ],
      };
    }

    const configRes = await fetchWithTimeout(`${base}/api/config`, { headers });
    if (!configRes.ok) {
      throw new Error(`Config API: ${configRes.status}`);
    }

    const haConfig = await configRes.json();

    return {
      title: "Home Assistant",
      status: "ok",
      fields: [
        {
          label: "Location",
          value: String(haConfig.location_name ?? "—"),
        },
        {
          label: "Version",
          value: String(haConfig.version ?? "—"),
        },
        {
          label: "Timezone",
          value: String(haConfig.time_zone ?? "—"),
        },
        {
          label: "Note",
          value: "Entity-ID optional",
        },
      ],
    };
  } catch (error) {
    return {
      title: "Home Assistant",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Unreachable",
    };
  }
}
