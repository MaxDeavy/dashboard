import { fetchWithTimeout, type WidgetConfigInput, type WidgetResult } from "./base";

export async function fetchGenericWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const url = config.apiUrl || config.extraConfig?.url;

  if (!url) {
    return {
      title: "Health Check",
      status: "warning",
      fields: [],
      error: "Keine URL konfiguriert",
    };
  }

  try {
    const start = Date.now();
    const response = await fetchWithTimeout(url, { method: "GET" });
    const elapsed = Date.now() - start;

    return {
      title: "Health Check",
      status: response.ok ? "ok" : "error",
      fields: [
        {
          label: "Status",
          value: String(response.status),
          highlight: !response.ok,
        },
        {
          label: "Response-Zeit",
          value: `${elapsed}ms`,
        },
        {
          label: "Erreichbar",
          value: response.ok ? "Ja" : "Nein",
        },
      ],
    };
  } catch (error) {
    return {
      title: "Health Check",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Nicht erreichbar",
    };
  }
}
