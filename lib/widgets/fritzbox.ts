import {
  fetchWithTimeout,
  formatBytesPerSec,
  normalizeApiUrl,
  type WidgetConfigInput,
  type WidgetResult,
} from "./base";
import { parseSoapResponse } from "./xml-utils";

const FRITZ_CONNECTION_STATUS: Record<string, string> = {
  Connected: "Verbunden",
  ConnectedUnconfigured: "Verbunden",
  Unconfigured: "Nicht konfiguriert",
  Disconnected: "Getrennt",
  Disconnecting: "Trennt…",
  Connecting: "Verbindet…",
};

function getFritzApiBase(apiUrl: string): string {
  const parsed = new URL(apiUrl);
  const port = parsed.protocol === "https:" ? 49443 : 49000;
  return `${parsed.protocol}//${parsed.hostname}:${port}`;
}

async function fritzSoapRequest(
  apiBase: string,
  service: "WANIPConnection" | "WANCommonInterfaceConfig",
  action: string,
  extraConfig?: Record<string, string>,
): Promise<Record<string, string>> {
  const servicePath =
    service === "WANIPConnection" ? "WANIPConn1" : "WANCommonIFC1";

  const body =
    '<?xml version="1.0" encoding="utf-8"?>' +
    '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">' +
    "<s:Body>" +
    `<u:${action} xmlns:u="urn:schemas-upnp-org:service:${service}:1" />` +
    "</s:Body>" +
    "</s:Envelope>";

  const response = await fetchWithTimeout(
    `${apiBase}/igdupnp/control/${servicePath}`,
    {
      method: "POST",
      headers: {
        "Content-Type": 'text/xml; charset="utf-8"',
        SOAPAction: `urn:schemas-upnp-org:service:${service}:1#${action}`,
      },
      body,
    },
    extraConfig,
  );

  if (!response.ok) {
    throw new Error(`${action}: ${response.status}`);
  }

  return parseSoapResponse(await response.text());
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

export async function fetchFritzboxWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const base = normalizeApiUrl(config.apiUrl);

  try {
    const apiBase = getFritzApiBase(base);

    const [statusInfo, addonInfos] = await Promise.all([
      fritzSoapRequest(apiBase, "WANIPConnection", "GetStatusInfo", config.extraConfig),
      fritzSoapRequest(
        apiBase,
        "WANCommonInterfaceConfig",
        "GetAddonInfos",
        config.extraConfig,
      ),
    ]);

    const connectionStatus =
      FRITZ_CONNECTION_STATUS[statusInfo.NewConnectionStatus ?? ""] ??
      statusInfo.NewConnectionStatus ??
      "Unbekannt";
    const uptime = Number(statusInfo.NewUptime ?? 0);
    const downRate = Number(addonInfos.NewByteReceiveRate ?? 0);
    const upRate = Number(addonInfos.NewByteSendRate ?? 0);
    const isConnected = statusInfo.NewConnectionStatus === "Connected";

    return {
      title: "FRITZ!Box",
      status: isConnected ? "ok" : "warning",
      fields: [
        {
          label: "Status",
          value: connectionStatus,
          highlight: isConnected,
        },
        {
          label: "Uptime",
          value: formatUptime(uptime),
        },
        {
          label: "Download",
          value: formatBytesPerSec(downRate),
        },
        {
          label: "Upload",
          value: formatBytesPerSec(upRate),
        },
      ],
    };
  } catch (error) {
    return {
      title: "FRITZ!Box",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Nicht erreichbar",
    };
  }
}
