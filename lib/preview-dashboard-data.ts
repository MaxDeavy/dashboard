import type { ServiceWithWidget } from "@/components/dashboard/ServiceCard";
import type { Category, LinkBarWithLinks, Page } from "@/lib/db/schema";
import { DEFAULT_SERVICE_ICONS } from "@/lib/service-icons";

export interface PreviewDashboardData {
  pages: Page[];
  pageBoards: Array<{
    pageId: number;
    columns: Array<Category & { services: ServiceWithWidget[] }>;
  }>;
  headerBars: LinkBarWithLinks[];
  footerBars: LinkBarWithLinks[];
  settings: Record<string, string>;
  healthMap: Record<number, "up" | "down" | "unknown">;
}

export interface PreviewExampleLabels {
  dashboardSubtitle: string;
  pages: { main: string; remote: string };
  categories: {
    media: string;
    arrStack: string;
    infrastructure: string;
    network: string;
    smarthome: string;
    remote: string;
  };
  headerBarTitle: string;
  footerBarTitle: string;
  footer: { docs: string; status: string; wiki: string };
  services: { calendar: string; helpdesk: string; monitoring: string };
  subtitles: {
    smarthome: string;
    photos: string;
    video: string;
    media: string;
    cloud: string;
    ebooks: string;
    musicServer: string;
    arrStack: string;
    requests: string;
    movies: string;
    series: string;
    downloads: string;
    indexer: string;
    usenet: string;
    music: string;
    dashboard: string;
    virtualization: string;
    container: string;
    nas: string;
    automation: string;
    local: string;
    remote: string;
    monitoring: string;
    checks: string;
    devops: string;
    dns: string;
    reverseProxy: string;
    cdn: string;
    status: string;
    support: string;
    planning: string;
    recipes: string;
    remoteDesktop: string;
    files: string;
    router: string;
  };
}

const PREVIEW_SERVICE_ICONS: Record<string, string> = {
  "Pi-hole": "/assets/pihole.png",
  NPM: "/assets/npm.webp",
  Cloudflare: "/assets/cloudflare.png",
  n8n: "/assets/n8n.png",
  QNAP: "/assets/qnap.webp",
  Kavita: "/assets/kavita.png",
  Navidrome: "/assets/navidrome.png",
  Readarr: "/assets/readarr.png",
  Mealie: "/assets/mealie.webp",
  Jellyseerr: "/assets/jellyseerr.png",
  "Uptime Kuma": "/assets/uptime.png",
  Filebrowser: "/assets/files.png",
  Guacamole: "/assets/guacamole.png",
  "FRITZ!Box": "/assets/fritz.png",
  "Filebrowser A": "/assets/files.png",
  "Guacamole A": "/assets/guacamole.png",
  "FRITZ!Box A": "/assets/fritz.png",
};

function serviceIcon(name: string): string {
  return PREVIEW_SERVICE_ICONS[name] ?? DEFAULT_SERVICE_ICONS[name] ?? "/assets/io.png";
}

function previewService(
  id: number,
  categoryId: number,
  name: string,
  subtitle: string,
  rowOrder: number,
  slotIndex: number,
  options: { hasWidget?: boolean; lanUrl?: string } = {},
): ServiceWithWidget {
  return {
    id,
    categoryId,
    name,
    subtitle,
    url: "#",
    lanUrl: options.lanUrl ?? null,
    cardColor: null,
    linkOpenMode: "same_tab",
    icon: serviceIcon(name),
    sortOrder: rowOrder * 3 + slotIndex,
    rowOrder,
    slotIndex,
    hasWidget: options.hasWidget ?? false,
    widgetType: options.hasWidget ? "preview" : null,
  };
}

const PREVIEW_SETTINGS: Record<string, string> = {
  dashboard_title: "Dashboard",
  theme_preset: "stealth",
  color_mode: "dark",
  accent_color: "#94a3b8",
  service_card_base_color: "#64748b",
  glow_color: "#cbd5e1",
  icon_size: "44",
  icon_frame_style: "rounded",
  layout_max_width: "0",
  layout_side_inset: "20",
  layout_header_follows_width: "true",
  layout_footer_follows_width: "true",
  tile_border_radius: "12",
  tile_scale: "100",
  font_scale: "100",
  tile_spacing: "8",
  column_gap: "20",
  column_padding: "14",
  column_min_width: "0",
  column_max_width: "0",
  search_enabled: "true",
  show_page_switcher: "true",
  lan_enabled: "true",
  dashboard_requires_auth: "false",
};

export function buildPreviewDashboardData(
  labels: PreviewExampleLabels,
): PreviewDashboardData {
  const s = labels.subtitles;

  const pages: Page[] = [
    { id: 1, name: labels.pages.main, sortOrder: 0, enabled: true },
    { id: 2, name: labels.pages.remote, sortOrder: 1, enabled: true },
  ];

  const categories: Category[] = [
    {
      id: 101,
      pageId: 1,
      name: labels.categories.media,
      sortOrder: 0,
      columnPosition: 0,
      enabled: true,
      color: "#fb923c",
    },
    {
      id: 102,
      pageId: 1,
      name: labels.categories.arrStack,
      sortOrder: 1,
      columnPosition: 1,
      enabled: true,
      color: "#f97316",
    },
    {
      id: 103,
      pageId: 1,
      name: labels.categories.infrastructure,
      sortOrder: 2,
      columnPosition: 2,
      enabled: true,
      color: "#ea580c",
    },
    {
      id: 104,
      pageId: 1,
      name: labels.categories.network,
      sortOrder: 3,
      columnPosition: 3,
      enabled: true,
      color: "#fdba74",
    },
    {
      id: 201,
      pageId: 2,
      name: labels.categories.smarthome,
      sortOrder: 0,
      columnPosition: 0,
      enabled: true,
      color: "#f59e0b",
    },
    {
      id: 202,
      pageId: 2,
      name: labels.categories.remote,
      sortOrder: 1,
      columnPosition: 1,
      enabled: true,
      color: "#fb923c",
    },
  ];

  const servicesByCategory: Record<number, ServiceWithWidget[]> = {
    101: [
      previewService(1, 101, "Homeassistant", s.smarthome, 0, 0, { hasWidget: true }),
      previewService(2, 101, "Immich", s.photos, 1, 0),
      previewService(3, 101, "Jellyfin", s.video, 2, 0, { hasWidget: true }),
      previewService(4, 101, "Plex", s.media, 3, 0),
      previewService(5, 101, "Nextcloud", s.cloud, 4, 0),
      previewService(41, 101, "Kavita", s.ebooks, 5, 0),
      previewService(42, 101, "Navidrome", s.musicServer, 6, 0),
    ],
    102: [
      previewService(9, 102, "Jellyseerr", s.requests, 0, 0, { hasWidget: true }),
      previewService(10, 102, "Radarr", s.movies, 1, 0, { hasWidget: true }),
      previewService(11, 102, "Sonarr", s.series, 2, 0, { hasWidget: true }),
      previewService(12, 102, "qBittorrent", s.downloads, 3, 0, { hasWidget: true }),
      previewService(13, 102, "Prowlarr", s.indexer, 4, 0, { hasWidget: true }),
      previewService(14, 102, "SabNZB", s.usenet, 5, 0, { hasWidget: true }),
      previewService(15, 102, "Lidarr", s.music, 6, 0, { hasWidget: true }),
      previewService(16, 102, "Homarr", s.dashboard, 7, 0),
    ],
    103: [
      previewService(17, 103, "Proxmox", s.virtualization, 0, 0, { hasWidget: true }),
      previewService(18, 103, "Portainer", s.container, 1, 0, { hasWidget: true }),
      previewService(44, 103, "QNAP", s.nas, 2, 0),
      previewService(45, 103, "n8n", s.automation, 3, 0),
      previewService(19, 103, "Filebrowser", s.local, 4, 0, {
        lanUrl: "http://192.168.1.10",
      }),
      previewService(20, 103, "Guacamole", s.local, 4, 1, {
        lanUrl: "http://192.168.1.11",
      }),
      previewService(21, 103, "FRITZ!Box", s.local, 4, 2, {
        lanUrl: "http://192.168.1.1",
      }),
      previewService(22, 103, "Filebrowser", s.remote, 5, 0, {
        lanUrl: "http://192.168.2.10",
      }),
      previewService(23, 103, "Guacamole", s.remote, 5, 1, {
        lanUrl: "http://192.168.2.11",
      }),
      previewService(24, 103, "FRITZ!Box", s.remote, 5, 2, {
        lanUrl: "http://192.168.2.1",
      }),
      previewService(50, 103, "Uptime Kuma", s.monitoring, 6, 0),
      previewService(51, 103, "Checkmk", s.checks, 6, 1),
    ],
    104: [
      previewService(25, 104, "GitLab", s.devops, 0, 0),
      previewService(46, 104, "Pi-hole", s.dns, 1, 0),
      previewService(47, 104, "NPM", s.reverseProxy, 2, 0),
      previewService(48, 104, "Cloudflare", s.cdn, 3, 0),
      previewService(26, 104, labels.services.monitoring, s.status, 4, 0),
      previewService(30, 104, "Checkmk", s.monitoring, 5, 0),
      previewService(27, 104, labels.services.helpdesk, s.support, 6, 0),
      previewService(28, 104, labels.services.calendar, s.planning, 7, 0),
    ],
    201: [
      previewService(33, 201, "Homeassistant", s.automation, 0, 0, { hasWidget: true }),
      previewService(49, 201, "Mealie", s.recipes, 1, 0),
      previewService(34, 201, "Nextcloud", s.cloud, 2, 0),
      previewService(35, 201, "Immich", s.photos, 3, 0),
    ],
    202: [
      previewService(37, 202, "Guacamole", s.remoteDesktop, 0, 0, {
        lanUrl: "http://192.168.10.20",
      }),
      previewService(38, 202, "Filebrowser", s.files, 1, 0, {
        lanUrl: "http://192.168.10.21",
      }),
      previewService(39, 202, "FRITZ!Box", s.router, 2, 0, {
        lanUrl: "http://192.168.10.1",
      }),
      previewService(40, 202, "Portainer", s.container, 3, 0, { hasWidget: true }),
    ],
  };

  const columnsForPage = (pageId: number) =>
    categories
      .filter((category) => category.pageId === pageId)
      .sort((a, b) => a.columnPosition - b.columnPosition)
      .map((category) => ({
        ...category,
        services: servicesByCategory[category.id] ?? [],
      }));

  const headerBar: LinkBarWithLinks = {
    id: 1,
    zone: "header",
    sortOrder: 0,
    title: labels.headerBarTitle,
    enabled: true,
    links: [
      {
        id: 2,
        barId: 1,
        label: "Cloudflare",
        url: "#",
        icon: null,
        sortOrder: 0,
        enabled: true,
        linkOpenMode: "same_tab",
      },
      {
        id: 3,
        barId: 1,
        label: "Pi-hole",
        url: "#",
        icon: null,
        sortOrder: 1,
        enabled: true,
        linkOpenMode: "same_tab",
      },
      {
        id: 4,
        barId: 1,
        label: "NPM",
        url: "#",
        icon: null,
        sortOrder: 2,
        enabled: true,
        linkOpenMode: "same_tab",
      },
      {
        id: 8,
        barId: 1,
        label: "n8n",
        url: "#",
        icon: null,
        sortOrder: 3,
        enabled: true,
        linkOpenMode: "same_tab",
      },
    ],
  };

  const footerBar: LinkBarWithLinks = {
    id: 2,
    zone: "footer",
    sortOrder: 0,
    title: labels.footerBarTitle,
    enabled: true,
    links: [
      {
        id: 5,
        barId: 2,
        label: labels.footer.docs,
        url: "#",
        icon: null,
        sortOrder: 0,
        enabled: true,
        linkOpenMode: "same_tab",
      },
      {
        id: 6,
        barId: 2,
        label: labels.footer.status,
        url: "#",
        icon: null,
        sortOrder: 1,
        enabled: true,
        linkOpenMode: "same_tab",
      },
      {
        id: 7,
        barId: 2,
        label: labels.footer.wiki,
        url: "#",
        icon: null,
        sortOrder: 2,
        enabled: true,
        linkOpenMode: "same_tab",
      },
    ],
  };

  const allServices = Object.values(servicesByCategory).flat();

  return {
    pages,
    pageBoards: pages.map((page) => ({
      pageId: page.id,
      columns: columnsForPage(page.id),
    })),
    headerBars: [headerBar],
    footerBars: [footerBar],
    settings: {
      ...PREVIEW_SETTINGS,
      dashboard_subtitle: labels.dashboardSubtitle,
    },
    healthMap: Object.fromEntries(
      allServices.map((service) => [
        service.id,
        service.id === 15 ? "down" : "up",
      ]),
    ) as Record<number, "up" | "down" | "unknown">,
  };
}
