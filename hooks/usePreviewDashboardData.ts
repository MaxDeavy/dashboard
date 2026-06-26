"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  buildPreviewDashboardData,
  type PreviewExampleLabels,
} from "@/lib/preview-dashboard-data";

export function usePreviewDashboardData() {
  const locale = useLocale();
  const t = useTranslations("previewExample");

  return useMemo(() => {
    const labels: PreviewExampleLabels = {
      dashboardSubtitle: t("dashboardSubtitle"),
      pages: {
        main: t("pages.main"),
        remote: t("pages.remote"),
      },
      categories: {
        media: t("categories.media"),
        arrStack: t("categories.arrStack"),
        infrastructure: t("categories.infrastructure"),
        network: t("categories.network"),
        smarthome: t("categories.smarthome"),
        remote: t("categories.remote"),
      },
      headerBarTitle: t("headerBarTitle"),
      footerBarTitle: t("footerBarTitle"),
      footer: {
        docs: t("footer.docs"),
        status: t("footer.status"),
        wiki: t("footer.wiki"),
      },
      services: {
        calendar: t("services.calendar"),
        helpdesk: t("services.helpdesk"),
        monitoring: t("services.monitoring"),
      },
      subtitles: {
        smarthome: t("subtitles.smarthome"),
        photos: t("subtitles.photos"),
        video: t("subtitles.video"),
        media: t("subtitles.media"),
        cloud: t("subtitles.cloud"),
        ebooks: t("subtitles.ebooks"),
        musicServer: t("subtitles.musicServer"),
        arrStack: t("subtitles.arrStack"),
        requests: t("subtitles.requests"),
        movies: t("subtitles.movies"),
        series: t("subtitles.series"),
        downloads: t("subtitles.downloads"),
        indexer: t("subtitles.indexer"),
        usenet: t("subtitles.usenet"),
        music: t("subtitles.music"),
        dashboard: t("subtitles.dashboard"),
        virtualization: t("subtitles.virtualization"),
        container: t("subtitles.container"),
        nas: t("subtitles.nas"),
        automation: t("subtitles.automation"),
        local: t("subtitles.local"),
        remote: t("subtitles.remote"),
        monitoring: t("subtitles.monitoring"),
        checks: t("subtitles.checks"),
        devops: t("subtitles.devops"),
        dns: t("subtitles.dns"),
        reverseProxy: t("subtitles.reverseProxy"),
        cdn: t("subtitles.cdn"),
        status: t("subtitles.status"),
        support: t("subtitles.support"),
        planning: t("subtitles.planning"),
        recipes: t("subtitles.recipes"),
        remoteDesktop: t("subtitles.remoteDesktop"),
        files: t("subtitles.files"),
        router: t("subtitles.router"),
      },
    };

    return buildPreviewDashboardData(labels);
  }, [locale, t]);
}
