import {
  fetchWithTimeout,
  normalizeApiUrl,
  type WidgetConfigInput,
  type WidgetResult,
} from "./base";

export async function fetchN8nWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const apiKey = config.credentials?.apiKey;
  const base = normalizeApiUrl(config.apiUrl);

  if (!apiKey) {
    return {
      title: "n8n",
      status: "warning",
      fields: [],
      error: "API key required",
    };
  }

  try {
    const headers = { "X-N8N-API-KEY": apiKey };

    const [workflowsRes, executionsRes] = await Promise.all([
      fetchWithTimeout(`${base}/api/v1/workflows`, { headers }, config.extraConfig),
      fetchWithTimeout(
        `${base}/api/v1/executions?status=running&limit=1`,
        { headers },
        config.extraConfig,
      ),
    ]);

    if (!workflowsRes.ok) {
      throw new Error(`Workflows: ${workflowsRes.status}`);
    }

    const workflows = (await workflowsRes.json()) as {
      data?: Array<{ active?: boolean }>;
    };
    const workflowList = workflows.data ?? [];
    const active = workflowList.filter((wf) => wf.active).length;

    let running = 0;
    if (executionsRes.ok) {
      const executions = (await executionsRes.json()) as {
        data?: unknown[];
      };
      running = executions.data?.length ?? 0;
    }

    return {
      title: "n8n",
      status: "ok",
      fields: [
        {
          label: "Workflows",
          value: String(workflowList.length),
        },
        {
          label: "Active",
          value: String(active),
          highlight: active > 0,
        },
        {
          label: "Running",
          value: String(running),
          highlight: running > 0,
        },
      ],
    };
  } catch (error) {
    return {
      title: "n8n",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Unreachable",
    };
  }
}
