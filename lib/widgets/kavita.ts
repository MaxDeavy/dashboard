import {
  fetchWithTimeout,
  formatBytes,
  formatMultilineList,
  type WidgetConfigInput,
  type WidgetResult,
} from "./base";

interface KavitaServerStats {
  seriesCount?: number;
  series_count?: number;
  totalFiles?: number;
  total_files?: number;
  totalSize?: number;
  total_size?: number;
  totalWords?: number;
  total_words?: number;
}

interface KavitaLibrary {
  name?: string;
  type?: string;
}

export async function fetchKavitaWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const apiKey = config.credentials?.apiKey;
  const base = config.apiUrl.replace(/\/$/, "");

  if (!apiKey) {
    return {
      title: "Kavita",
      status: "warning",
      fields: [],
      error: "No API key configured",
    };
  }

  try {
    const headers = {
      Accept: "application/json",
      "x-api-key": apiKey,
    };

    const [statsRes, librariesRes, serverInfoRes] = await Promise.all([
      fetchWithTimeout(
        `${base}/api/Stats/server/stats`,
        { headers },
        config.extraConfig,
      ),
      fetchWithTimeout(
        `${base}/api/Library/libraries`,
        { headers },
        config.extraConfig,
      ),
      fetchWithTimeout(
        `${base}/api/Server/server-info-slim`,
        { headers },
        config.extraConfig,
      ).catch(() => null),
    ]);

    if (!statsRes.ok) {
      throw new Error(`API: ${statsRes.status}`);
    }

    const stats = (await statsRes.json()) as KavitaServerStats;
    const libraries: KavitaLibrary[] = librariesRes.ok
      ? await librariesRes.json()
      : [];

    const series = stats.series_count ?? stats.seriesCount ?? 0;
    const files = stats.total_files ?? stats.totalFiles ?? 0;
    const size = stats.total_size ?? stats.totalSize ?? 0;
    const words = stats.total_words ?? stats.totalWords ?? 0;

    const libraryTypes = [
      ...new Set(
        libraries
          .map((lib) => lib.type)
          .filter((type): type is string => Boolean(type)),
      ),
    ];
    const serverInfo = serverInfoRes?.ok
      ? ((await serverInfoRes.json()) as {
          kavitaVersion?: string;
          kavita_version?: string;
        })
      : {};
    const version =
      serverInfo.kavitaVersion ?? serverInfo.kavita_version ?? "—";

    return {
      title: "Kavita",
      status: "ok",
      fields: [
        {
          label: "Series",
          value: String(series),
          highlight: series > 0,
        },
        {
          label: "Files",
          value: String(files),
        },
        {
          label: "Storage",
          value: formatBytes(size),
        },
        {
          label: "Libraries",
          value:
            libraries.length > 0
              ? formatMultilineList([
                  String(libraries.length),
                  ...libraryTypes,
                ])
              : "—",
        },
        ...(words > 0
          ? [
              {
                label: "Words",
                value:
                  words >= 1_000_000
                    ? `${(words / 1_000_000).toFixed(1)}M`
                    : words >= 1_000
                      ? `${(words / 1_000).toFixed(1)}k`
                      : String(words),
              },
            ]
          : []),
        {
          label: "Type",
          value: libraryTypes.length > 0 ? formatMultilineList(libraryTypes) : "—",
        },
        {
          label: "Total",
          value: String(series + files),
        },
        {
          label: "Version",
          value: version,
        },
      ],
    };
  } catch (error) {
    return {
      title: "Kavita",
      status: "error",
      fields: [],
      error: error instanceof Error ? error.message : "Unreachable",
    };
  }
}
