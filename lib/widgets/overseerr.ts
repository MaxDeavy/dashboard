import { fetchWithTimeout, type WidgetConfigInput, type WidgetResult } from "./base";

interface OverseerrCounts {
  pending?: number;
  approved?: number;
  processing?: number;
  available?: number;
  declined?: number;
  completed?: number;
}

export async function fetchOverseerrWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const apiKey = config.credentials?.apiKey;
  const base = config.apiUrl.replace(/\/$/, "");

  if (!apiKey) {
    return {
      title: "Overseerr",
      status: "warning",
      fields: [],
      error: "No API key configured",
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

    const counts = (await response.json()) as OverseerrCounts;
    const pending = counts.pending ?? 0;
    const processing = counts.processing ?? 0;
    const approved = counts.approved ?? 0;

    return {
      title: "Overseerr",
      status: "ok",
      fields: [
        {
          label: "Pending",
          value: String(pending),
          highlight: pending > 0,
        },
        {
          label: "In Progress",
          value: String(processing),
          highlight: processing > 0,
        },
        { label: "Approved", value: String(approved) },
        { label: "Completed", value: String(counts.completed ?? 0) },
      ],
    };
  } catch (error) {
    return {
      title: "Overseerr",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Unreachable",
    };
  }
}
