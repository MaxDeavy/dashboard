import {
  fetchWithTimeout,
  truncate,
  type WidgetConfigInput,
  type WidgetResult,
} from "./base";

interface HaState {
  entity_id?: string;
  state?: string;
  last_changed?: string;
  last_updated?: string;
  attributes?: Record<string, unknown>;
}

function formatEntityState(state: HaState): string {
  const value = String(state.state ?? "unknown");
  const unit = state.attributes?.unit_of_measurement;
  if (typeof unit === "string" && unit) {
    return `${value} ${unit}`;
  }
  return value;
}

function countByDomain(states: HaState[], domain: string): number {
  return states.filter((entry) => entry.entity_id?.startsWith(`${domain}.`))
    .length;
}

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
        config.extraConfig,
      );

      if (!response.ok) {
        throw new Error(`Entity API: ${response.status}`);
      }

      const state = (await response.json()) as HaState;
      const friendlyName = String(
        state.attributes?.friendly_name ?? entityId,
      );
      const deviceClass = state.attributes?.device_class;
      const unavailable = state.state === "unavailable";

      return {
        title: truncate(friendlyName, 28),
        status: "ok",
        fields: [
          {
            label: "Status",
            value: formatEntityState(state),
            highlight: !unavailable && state.state !== "off",
          },
          {
            label: "Entity",
            value: truncate(entityId, 32),
          },
          ...(typeof deviceClass === "string"
            ? [{ label: "Type", value: deviceClass }]
            : []),
          {
            label: "Last Changed",
            value: state.last_changed
              ? new Date(state.last_changed).toLocaleString("de-DE")
              : "—",
          },
        ],
      };
    }

    const [configRes, statesRes] = await Promise.all([
      fetchWithTimeout(`${base}/api/config`, { headers }, config.extraConfig),
      fetchWithTimeout(`${base}/api/states`, { headers }, config.extraConfig),
    ]);

    if (!configRes.ok) {
      throw new Error(`Config API: ${configRes.status}`);
    }

    const haConfig = await configRes.json();
    const states: HaState[] = statesRes.ok ? await statesRes.json() : [];
    const unavailable = states.filter(
      (entry) => entry.state === "unavailable",
    ).length;

    return {
      title: String(haConfig.location_name ?? "Home Assistant"),
      status: "ok",
      fields: [
        {
          label: "Entities",
          value: String(states.length),
          highlight: states.length > 0,
        },
        {
          label: "Automations",
          value: String(countByDomain(states, "automation")),
        },
        {
          label: "Sensors",
          value: String(countByDomain(states, "sensor")),
        },
        {
          label: "Version",
          value: String(haConfig.version ?? "—"),
        },
        ...(unavailable > 0
          ? [
              {
                label: "Unavailable",
                value: String(unavailable),
                highlight: true,
              },
            ]
          : []),
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
