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

    const [workflowsRes, executionsRes, failedRes, credentialsRes] = await Promise.all([
      fetchWithTimeout(`${base}/api/v1/workflows`, { headers }, config.extraConfig),
      fetchWithTimeout(
        `${base}/api/v1/executions?status=running&limit=1`,
        { headers },
        config.extraConfig,
      ),
      fetchWithTimeout(
        `${base}/api/v1/executions?status=error&limit=1`,
        { headers },
        config.extraConfig,
      ).catch(() => null),
      fetchWithTimeout(`${base}/api/v1/credentials`, { headers }, config.extraConfig).catch(() => null),
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
    let totalExecutions = 0;
    if (executionsRes.ok) {
      const executions = (await executionsRes.json()) as {
        data?: unknown[];
        count?: number;
      };
      running = executions.data?.length ?? 0;
      totalExecutions = executions.count ?? 0;
    }
    const failedPayload = failedRes?.ok
      ? ((await failedRes.json()) as { count?: number; data?: unknown[] })
      : null;
    const failed = failedPayload?.count ?? failedPayload?.data?.length ?? 0;
    const credentials = credentialsRes?.ok
      ? (((await credentialsRes.json()) as { data?: unknown[] }).data?.length ?? 0)
      : 0;

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
        {
          label: "Total",
          value: String(totalExecutions),
        },
        {
          label: "Alerts",
          value: String(failed),
          highlight: failed > 0,
        },
        {
          label: "Users",
          value: String(credentials),
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
