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
      error: "Kein API-Token konfiguriert",
    };
  }

  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };

  try {
    let response = await fetchWithTimeout(
      `${base}/api/households/statistics`,
      { headers },
      config.extraConfig,
    );

    if (response.status === 404) {
      response = await fetchWithTimeout(
        `${base}/api/groups/statistics`,
        { headers },
        config.extraConfig,
      );
    }

    if (!response.ok) {
      throw new Error(`API: ${response.status}`);
    }

    const stats = (await response.json()) as MealieStatistics;
    const recipes = stats.totalRecipes ?? 0;

    return {
      title: "Mealie",
      status: "ok",
      fields: [
        {
          label: "Rezepte",
          value: String(recipes),
          highlight: recipes > 0,
        },
        { label: "Kategorien", value: String(stats.totalCategories ?? 0) },
        { label: "Tags", value: String(stats.totalTags ?? 0) },
        { label: "Nutzer", value: String(stats.totalUsers ?? 0) },
      ],
    };
  } catch (error) {
    return {
      title: "Mealie",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Nicht erreichbar",
    };
  }
}
