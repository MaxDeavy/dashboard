import { fetchWithTimeout, type WidgetConfigInput, type WidgetResult } from "./base";

interface MealieStatistics {
  totalRecipes?: number;
  totalUsers?: number;
  totalCategories?: number;
  totalTags?: number;
  totalTools?: number;
}

export async function fetchMealieWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const token = config.credentials?.token;
  const base = config.apiUrl.replace(/\/$/, "");

  if (!token) {
    return {
      title: "Mealie",
      status: "warning",
      fields: [],
      error: "No API token configured",
    };
  }

  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };

  try {
    const [householdStatsRes, groupStatsRes, shoppingRes, plansRes] = await Promise.all([
      fetchWithTimeout(
        `${base}/api/households/statistics`,
        { headers },
        config.extraConfig,
      ).catch(() => null),
      fetchWithTimeout(
        `${base}/api/groups/statistics`,
        { headers },
        config.extraConfig,
      ).catch(() => null),
      fetchWithTimeout(`${base}/api/households/shopping/lists`, { headers }, config.extraConfig).catch(() => null),
      fetchWithTimeout(`${base}/api/households/mealplans`, { headers }, config.extraConfig).catch(() => null),
    ]);

    let response = householdStatsRes ?? groupStatsRes;

    if (response && response.status === 404) {
      response = groupStatsRes;
    }

    if (!response?.ok) {
      throw new Error(`API: ${response?.status ?? 500}`);
    }

    const stats = (await response.json()) as MealieStatistics;
    const recipes = stats.totalRecipes ?? 0;
    const shoppingPayload = shoppingRes?.ok
      ? ((await shoppingRes.json()) as { items?: unknown[]; total?: number })
      : null;
    const plansPayload = plansRes?.ok
      ? ((await plansRes.json()) as { items?: unknown[]; total?: number })
      : null;
    const shoppingLists =
      shoppingPayload?.total ?? shoppingPayload?.items?.length ?? 0;
    const mealPlans = plansPayload?.total ?? plansPayload?.items?.length ?? 0;

    return {
      title: "Mealie",
      status: "ok",
      fields: [
        {
          label: "Recipes",
          value: String(recipes),
          highlight: recipes > 0,
        },
        { label: "Categories", value: String(stats.totalCategories ?? 0) },
        { label: "Tags", value: String(stats.totalTags ?? 0) },
        { label: "Users", value: String(stats.totalUsers ?? 0) },
        { label: "Total", value: String(stats.totalTools ?? 0) },
        {
          label: "Pending",
          value: String(shoppingLists),
          highlight: shoppingLists > 0,
        },
        {
          label: "Active",
          value: String(mealPlans),
          highlight: mealPlans > 0,
        },
      ],
    };
  } catch (error) {
    return {
      title: "Mealie",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Unreachable",
    };
  }
}
