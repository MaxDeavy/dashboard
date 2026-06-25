import { fetchWithTimeout, type WidgetConfigInput, type WidgetResult } from "./base";

interface JellyseerrCounts {
  pending?: number;
  approved?: number;
  processing?: number;
  available?: number;
  declined?: number;
  completed?: number;
}

export async function fetchJellyseerrWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const apiKey = config.credentials?.apiKey;
  const base = config.apiUrl.replace(/\/$/, "");

  if (!apiKey) {
    return {
      title: "Jellyseerr",
      status: "warning",
      fields: [],
      error: "Kein API-Key konfiguriert",
    };
  }

  try {
    const headers = { "X-Api-Key": apiKey };
    const response = await fetchWithTimeout(`${base}/api/v1/request/count`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`API: ${response.status}`);
    }

    const counts = (await response.json()) as JellyseerrCounts;
    const pending = counts.pending ?? 0;
    const processing = counts.processing ?? 0;
    const approved = counts.approved ?? 0;

    return {
      title: "Jellyseerr",
      status: "ok",
      fields: [
        {
          label: "Ausstehend",
          value: String(pending),
          highlight: pending > 0,
        },
        {
          label: "In Bearbeitung",
          value: String(processing),
          highlight: processing > 0,
        },
        {
          label: "Genehmigt",
          value: String(approved),
        },
        {
          label: "Abgeschlossen",
          value: String(counts.completed ?? 0),
        },
      ],
    };
  } catch (error) {
    return {
      title: "Jellyseerr",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Nicht erreichbar",
    };
  }
}
