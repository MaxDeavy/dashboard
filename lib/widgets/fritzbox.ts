import {
  fetchWithTimeout,
  formatBytes,
  formatBytesPerSec,
  normalizeApiUrl,
  type WidgetConfigInput,
  type WidgetResult,
} from "./base";
import { parseSoapResponse } from "./xml-utils";

const FRITZ_CONNECTION_STATUS: Record<string, string> = {
  Connected: "Connected",
  ConnectedUnconfigured: "Connected",
  Unconfigured: "Not configured",
  Disconnected: "Disconnected",
  Disconnecting: "Disconnecting…",
  Connecting: "Connecting…",
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

    const [statusInfo, addonInfos, linkProps, externalIp, totalReceived, totalSent] =
      await Promise.all([
        fritzSoapRequest(
          apiBase,
          "WANIPConnection",
          "GetStatusInfo",
          config.extraConfig,
        ),
        fritzSoapRequest(
          apiBase,
          "WANCommonInterfaceConfig",
          "GetAddonInfos",
          config.extraConfig,
        ),
        fritzSoapRequest(
          apiBase,
          "WANCommonInterfaceConfig",
          "GetCommonLinkProperties",
          config.extraConfig,
        ).catch((): Record<string, string> => ({})),
        fritzSoapRequest(
          apiBase,
          "WANIPConnection",
          "GetExternalIPAddress",
          config.extraConfig,
        ).catch((): Record<string, string> => ({})),
        fritzSoapRequest(
          apiBase,
          "WANCommonInterfaceConfig",
          "GetTotalBytesReceived",
          config.extraConfig,
        ).catch((): Record<string, string> => ({})),
        fritzSoapRequest(
          apiBase,
          "WANCommonInterfaceConfig",
          "GetTotalBytesSent",
          config.extraConfig,
        ).catch((): Record<string, string> => ({})),
      ]);

    const connectionStatus =
      FRITZ_CONNECTION_STATUS[statusInfo.NewConnectionStatus ?? ""] ??
      statusInfo.NewConnectionStatus ??
      "Unknown";
    const uptime = Number(statusInfo.NewUptime ?? 0);
    const downRate = Number(addonInfos.NewByteReceiveRate ?? 0);
    const upRate = Number(addonInfos.NewByteSendRate ?? 0);
    const isConnected = statusInfo.NewConnectionStatus === "Connected";
    const externalAddress = externalIp.NewExternalIPAddress;
    const received = Number(totalReceived.NewTotalBytesReceived ?? 0);
    const sent = Number(totalSent.NewTotalBytesSent ?? 0);
    const downstreamMax = Number(linkProps.NewLayer1DownstreamMaxBitRate ?? 0);
    const upstreamMax = Number(linkProps.NewLayer1UpstreamMaxBitRate ?? 0);
    const connectionType = linkProps.NewWANAccessType ?? "—";

    return {
      title: "FRITZ!Box",
      status: "ok",
      fields: [
        {
          label: "Status",
          value: connectionStatus,
          highlight: isConnected,
        },
        ...(externalAddress
          ? [
              {
                label: "External IP",
                value: externalAddress,
              },
            ]
          : []),
        {
          label: "Uptime",
          value: formatUptime(uptime),
        },
        {
          label: "Download",
          value: formatBytesPerSec(downRate),
          highlight: downRate > 0,
        },
        {
          label: "Upload",
          value: formatBytesPerSec(upRate),
          highlight: upRate > 0,
        },
        ...(received > 0
          ? [
              {
                label: "Total Download",
                value: formatBytes(received),
              },
            ]
          : []),
        ...(sent > 0
          ? [
              {
                label: "Total Upload",
                value: formatBytes(sent),
              },
            ]
          : []),
        {
          label: "Type",
          value: connectionType,
        },
        {
          label: "Max Download",
          value:
            downstreamMax > 0
              ? `${formatBytesPerSec(Math.floor(downstreamMax / 8))} max`
              : "—",
        },
        {
          label: "Max Upload",
          value:
            upstreamMax > 0
              ? `${formatBytesPerSec(Math.floor(upstreamMax / 8))} max`
              : "—",
        },
      ],
    };
  } catch (error) {
    return {
      title: "FRITZ!Box",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Unreachable",
    };
  }
}
