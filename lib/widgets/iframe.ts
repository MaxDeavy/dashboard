import type { WidgetConfigInput, WidgetResult } from "./base";

function titleFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "Iframe";
  }
}

export async function fetchIframeWidget(
  config: WidgetConfigInput,
): Promise<WidgetResult> {
  const pageUrl = config.apiUrl?.trim() || "";

  if (!pageUrl) {
    return {
      title: "Iframe",
      status: "warning",
      displayMode: "iframe",
      fields: [],
      error: "No page URL configured",
    };
  }

  return {
    title: titleFromUrl(pageUrl),
    status: "ok",
    displayMode: "iframe",
    iframeUrl: pageUrl,
    fields: [],
  };
}
