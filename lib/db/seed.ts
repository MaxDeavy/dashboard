import { db, schema, sqlite } from "./index";
import { count } from "drizzle-orm";
import {
  DEFAULT_SERVICE_ICONS,
  LEGACY_EMOJI_ICONS,
} from "@/lib/service-icons";

function ensureSchemaPatches() {
  const columns = sqlite
    .prepare("PRAGMA table_info(services)")
    .all() as Array<{ name: string }>;

  if (!columns.some((column) => column.name === "card_color")) {
    sqlite.exec("ALTER TABLE `services` ADD COLUMN `card_color` text");
  }

  if (!columns.some((column) => column.name === "link_open_mode")) {
    sqlite.exec(
      "ALTER TABLE `services` ADD COLUMN `link_open_mode` text DEFAULT 'same_tab'",
    );
  }

  if (!columns.some((column) => column.name === "insecure_tls")) {
    sqlite.exec(
      "ALTER TABLE `services` ADD COLUMN `insecure_tls` integer DEFAULT 0 NOT NULL",
    );
  }

  if (!columns.some((column) => column.name === "row_order")) {
    sqlite.exec(
      "ALTER TABLE `services` ADD COLUMN `row_order` integer DEFAULT 0 NOT NULL",
    );
    sqlite.exec(
      "ALTER TABLE `services` ADD COLUMN `slot_index` integer DEFAULT 0 NOT NULL",
    );
    sqlite.exec(
      "UPDATE `services` SET `row_order` = `sort_order`, `slot_index` = 0",
    );
  }

  const navLinkColumns = sqlite
    .prepare("PRAGMA table_info(nav_links)")
    .all() as Array<{ name: string }>;

  if (!navLinkColumns.some((column) => column.name === "enabled")) {
    sqlite.exec(
      "ALTER TABLE `nav_links` ADD COLUMN `enabled` integer DEFAULT 1 NOT NULL",
    );
  }

  if (!navLinkColumns.some((column) => column.name === "link_open_mode")) {
    sqlite.exec(
      "ALTER TABLE `nav_links` ADD COLUMN `link_open_mode` text DEFAULT 'same_tab'",
    );
  }

  const linkBarColumns = sqlite
    .prepare("PRAGMA table_info(link_bars)")
    .all() as Array<{ name: string }>;

  if (!linkBarColumns.some((column) => column.name === "enabled")) {
    sqlite.exec(
      "ALTER TABLE `link_bars` ADD COLUMN `enabled` integer DEFAULT 1 NOT NULL",
    );
  }

  const categoryColumns = sqlite
    .prepare("PRAGMA table_info(categories)")
    .all() as Array<{ name: string }>;

  if (!categoryColumns.some((column) => column.name === "enabled")) {
    sqlite.exec(
      "ALTER TABLE `categories` ADD COLUMN `enabled` integer DEFAULT 1 NOT NULL",
    );
  }

  if (!categoryColumns.some((column) => column.name === "color")) {
    sqlite.exec("ALTER TABLE `categories` ADD COLUMN `color` text");
  }

  if (!categoryColumns.some((column) => column.name === "page_id")) {
    sqlite.exec("ALTER TABLE `categories` ADD COLUMN `page_id` integer");
  }
}

async function ensurePagesData() {
  const pageCount = await db.select({ value: count() }).from(schema.pages);

  if (pageCount[0]?.value === 0) {
    const [defaultPage] = await db
      .insert(schema.pages)
      .values({ name: "Hauptseite", sortOrder: 0, enabled: true })
      .returning();

    sqlite.exec(
      `UPDATE categories SET page_id = ${defaultPage.id} WHERE page_id IS NULL`,
    );
  }
}

function ensureServiceIcons() {
  const services = sqlite
    .prepare("SELECT id, name, icon FROM services")
    .all() as Array<{ id: number; name: string; icon: string | null }>;

  const update = sqlite.prepare(
    "UPDATE services SET icon = ? WHERE id = ?",
  );

  for (const service of services) {
    const defaultIcon = DEFAULT_SERVICE_ICONS[service.name];
    if (!defaultIcon) continue;

    const shouldUpdate =
      !service.icon ||
      LEGACY_EMOJI_ICONS.has(service.icon) ||
      service.icon === "🔗" ||
      service.icon.includes("/assets/maxcloud.png");

    if (shouldUpdate) {
      update.run(defaultIcon, service.id);
    }
  }
}

export async function runMigrations() {
  const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
  const path = await import("path");
  migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  ensureSchemaPatches();
  await ensurePagesData();
  ensureServiceIcons();
  normalizeUnsortedServices();
}

function normalizeUnsortedServices() {
  const unsorted = sqlite
    .prepare("SELECT id, category_id FROM services WHERE sort_order < 0")
    .all() as Array<{ id: number; category_id: number }>;

  if (unsorted.length === 0) return;

  const maxOrderStmt = sqlite.prepare(
    "SELECT COALESCE(MAX(sort_order), -1) AS max_order FROM services WHERE category_id = ? AND sort_order >= 0",
  );
  const updateStmt = sqlite.prepare(
    "UPDATE services SET sort_order = ? WHERE id = ?",
  );

  for (const service of unsorted) {
    const row = maxOrderStmt.get(service.category_id) as { max_order: number };
    updateStmt.run(row.max_order + 1, service.id);
  }
}

export async function seedDatabase() {
  await runMigrations();

  const [categoryCount] = await db.select({ value: count() }).from(schema.categories);
  if (categoryCount.value > 0) {
    return;
  }

  const defaultSettings = [
    { key: "dashboard_title", value: "Dashboard" },
    { key: "dashboard_subtitle", value: "Homelab" },
    { key: "theme_preset", value: "stealth" },
    { key: "color_mode", value: "dark" },
    { key: "accent_color", value: "#94a3b8" },
    { key: "service_card_base_color", value: "#64748b" },
    { key: "glow_color", value: "#cbd5e1" },
    { key: "icon_size", value: "44" },
    { key: "icon_frame_style", value: "rounded" },
    { key: "layout_max_width", value: "0" },
    { key: "layout_side_inset", value: "20" },
    { key: "layout_header_follows_width", value: "true" },
    { key: "layout_footer_follows_width", value: "true" },
    { key: "tile_border_radius", value: "12" },
    { key: "tile_scale", value: "100" },
    { key: "font_scale", value: "100" },
    { key: "tile_spacing", value: "8" },
    { key: "column_gap", value: "20" },
    { key: "column_padding", value: "14" },
    { key: "column_min_width", value: "0" },
    { key: "column_max_width", value: "0" },
    { key: "search_enabled", value: "true" },
    { key: "show_page_switcher", value: "true" },
    { key: "page_keyboard_shortcuts", value: "true" },
    { key: "lan_enabled", value: "true" },
  ];

  await db.insert(schema.settings).values(defaultSettings);

  const [defaultPage] = await db
    .insert(schema.pages)
    .values({ name: "Hauptseite", sortOrder: 0, enabled: true })
    .returning();

  const [headerBar] = await db
    .insert(schema.linkBars)
    .values({ zone: "header", sortOrder: 0, title: "Hauptleiste" })
    .returning();

  const navLinkData = [
    { barId: headerBar.id, label: "Home", url: "#", sortOrder: 0 },
    { barId: headerBar.id, label: "LAN", url: "#", sortOrder: 1 },
    { barId: headerBar.id, label: "NAS", url: "#", sortOrder: 2 },
    { barId: headerBar.id, label: "Docs", url: "#", sortOrder: 3 },
    { barId: headerBar.id, label: "Automation", url: "#", sortOrder: 4 },
    { barId: headerBar.id, label: "Proxy", url: "#", sortOrder: 5 },
    { barId: headerBar.id, label: "DNS", url: "#", sortOrder: 6 },
    { barId: headerBar.id, label: "CDN", url: "#", sortOrder: 7 },
    { barId: headerBar.id, label: "Books", url: "#", sortOrder: 8 },
  ];

  await db.insert(schema.navLinks).values(navLinkData);

  const categoryData = [
    { pageId: defaultPage.id, name: "Media", sortOrder: 0, columnPosition: 0 },
    { pageId: defaultPage.id, name: "ARR-Stack", sortOrder: 1, columnPosition: 1 },
    { pageId: defaultPage.id, name: "Infrastruktur", sortOrder: 2, columnPosition: 2 },
    { pageId: defaultPage.id, name: "Links", sortOrder: 3, columnPosition: 3 },
  ];

  const insertedCategories = await db
    .insert(schema.categories)
    .values(categoryData)
    .returning();

  const categoryMap = Object.fromEntries(
    insertedCategories.map((c) => [c.columnPosition, c.id]),
  );

  const servicesData = [
    // Column 0 - Media
    { categoryId: categoryMap[0], name: "Homeassistant", subtitle: "Smarthome", url: "http://homeassistant.local", icon: "/assets/ha.png", sortOrder: 0 },
    { categoryId: categoryMap[0], name: "Immich", subtitle: "Photos", url: "http://immich.local", icon: "/assets/immich.webp", sortOrder: 1 },
    { categoryId: categoryMap[0], name: "Nextcloud", subtitle: "Cloud", url: "http://nextcloud.local", icon: "/assets/nextcloud.png", sortOrder: 2 },
    { categoryId: categoryMap[0], name: "Trilium", subtitle: "Notes", url: "http://trilium.local", icon: "/assets/trilium.webp", sortOrder: 3 },
    { categoryId: categoryMap[0], name: "Jellyfin", subtitle: "Video", url: "http://jellyfin.local", icon: "/assets/jelly.webp", sortOrder: 4 },
    { categoryId: categoryMap[0], name: "Finamp", subtitle: "Music", url: "http://finamp.local", icon: "/assets/finamp.webp", sortOrder: 5 },
    { categoryId: categoryMap[0], name: "Mealie", subtitle: "Recipes", url: "http://mealie.local", icon: "/assets/mealie.webp", sortOrder: 6 },
    { categoryId: categoryMap[0], name: "Plex", subtitle: "Media", url: "http://plex.local", icon: "/assets/plex.png", sortOrder: 7 },
    // Column 1 - ARR
    { categoryId: categoryMap[1], name: "Requests", subtitle: "ARR-Stack", url: "http://requests.local", icon: "/assets/jellyseerr.png", sortOrder: 0 },
    { categoryId: categoryMap[1], name: "Radarr", subtitle: "ARR-Stack", url: "http://radarr.local", icon: "/assets/radarr.png", sortOrder: 1 },
    { categoryId: categoryMap[1], name: "Sonarr", subtitle: "ARR-Stack", url: "http://sonarr.local", icon: "/assets/sonarr.png", sortOrder: 2 },
    { categoryId: categoryMap[1], name: "Lidarr", subtitle: "ARR-Stack", url: "http://lidarr.local", icon: "/assets/lidarr.png", sortOrder: 3 },
    { categoryId: categoryMap[1], name: "SabNZB", subtitle: "ARR-Stack", url: "http://sabnzbd.local", icon: "/assets/sab.png", sortOrder: 4 },
    { categoryId: categoryMap[1], name: "qBittorrent", subtitle: "ARR-Stack", url: "http://qbittorrent.local", icon: "/assets/qbit.png", sortOrder: 5 },
    { categoryId: categoryMap[1], name: "Prowlarr", subtitle: "ARR-Stack", url: "http://prowlarr.local", icon: "/assets/prowlarr.png", sortOrder: 6 },
    { categoryId: categoryMap[1], name: "Homarr", subtitle: "ARR-Stack", url: "http://homarr.local", icon: "/assets/homar.png", sortOrder: 7 },
    // Column 2 - Infrastructure
    { categoryId: categoryMap[2], name: "Proxmox", subtitle: "Virtualisierung", url: "https://proxmox.local", icon: "/assets/proxmox.png", sortOrder: 0 },
    { categoryId: categoryMap[2], name: "Portainer", subtitle: "Container", url: "http://portainer.local", icon: "/assets/portainer.png", sortOrder: 1 },
    { categoryId: categoryMap[2], name: "Filebrowser A", subtitle: "Standort A", url: "http://filebrowser-a.local", icon: "/assets/files.png", sortOrder: 2 },
    { categoryId: categoryMap[2], name: "Guacamole A", subtitle: "Standort A", url: "http://guacamole-a.local", icon: "/assets/guacamole.png", sortOrder: 3 },
    { categoryId: categoryMap[2], name: "FRITZ!Box A", subtitle: "Standort A", url: "http://fritzbox-a.local", icon: "/assets/fritz.png", sortOrder: 4 },
    { categoryId: categoryMap[2], name: "Filebrowser B", subtitle: "Standort B", url: "http://filebrowser-b.local", icon: "/assets/files.png", sortOrder: 5 },
    { categoryId: categoryMap[2], name: "Guacamole B", subtitle: "Standort B", url: "http://guacamole-b.local", icon: "/assets/guacamole.png", sortOrder: 6 },
    { categoryId: categoryMap[2], name: "FRITZ!Box B", subtitle: "Standort B", url: "http://fritzbox-b.local", icon: "/assets/fritz.png", sortOrder: 7 },
    // Column 3 - Links (generic examples)
    { categoryId: categoryMap[3], name: "Intranet", subtitle: "Beispiel", url: "https://intranet.example.com", icon: "/assets/io.png", sortOrder: 0 },
    { categoryId: categoryMap[3], name: "Portal", subtitle: "Beispiel", url: "https://portal.example.com", icon: "/assets/gitlab.png", sortOrder: 1 },
    { categoryId: categoryMap[3], name: "Helpdesk", subtitle: "Beispiel", url: "https://helpdesk.example.com", icon: "/assets/helpdesk.png", sortOrder: 2 },
    { categoryId: categoryMap[3], name: "Kalender", subtitle: "Beispiel", url: "https://calendar.example.com", icon: "/assets/ontime.jpg", sortOrder: 3 },
    { categoryId: categoryMap[3], name: "Wiki", subtitle: "Beispiel", url: "https://wiki.example.com", icon: "/assets/io.png", sortOrder: 4 },
    { categoryId: categoryMap[3], name: "Monitoring", subtitle: "Beispiel", url: "https://monitoring.example.com", icon: "/assets/uptime.png", sortOrder: 5 },
    { categoryId: categoryMap[3], name: "Checkmk", subtitle: "Beispiel", url: "https://checkmk.example.com", icon: "/assets/checkmk.webp", sortOrder: 6 },
    { categoryId: categoryMap[3], name: "GitLab", subtitle: "Beispiel", url: "https://gitlab.example.com", icon: "/assets/gitlab.png", sortOrder: 7 },
  ];

  const insertedServices = await db
    .insert(schema.services)
    .values(servicesData)
    .returning();

  const serviceByName = Object.fromEntries(
    insertedServices.map((s) => [s.name, s.id]),
  );

  const widgetData = [
    {
      serviceId: serviceByName["qBittorrent"],
      widgetType: "qbittorrent",
      apiUrl: "http://qbittorrent.local",
      credentials: null,
      extraConfig: JSON.stringify({}),
    },
    {
      serviceId: serviceByName["Proxmox"],
      widgetType: "proxmox",
      apiUrl: "https://proxmox.local:8006",
      credentials: null,
      extraConfig: JSON.stringify({ node: "pve" }),
    },
    {
      serviceId: serviceByName["Sonarr"],
      widgetType: "sonarr",
      apiUrl: "http://sonarr.local",
      credentials: null,
      extraConfig: JSON.stringify({}),
    },
    {
      serviceId: serviceByName["Radarr"],
      widgetType: "radarr",
      apiUrl: "http://radarr.local",
      credentials: null,
      extraConfig: JSON.stringify({}),
    },
    {
      serviceId: serviceByName["Lidarr"],
      widgetType: "lidarr",
      apiUrl: "http://lidarr.local",
      credentials: null,
      extraConfig: JSON.stringify({}),
    },
    {
      serviceId: serviceByName["Prowlarr"],
      widgetType: "prowlarr",
      apiUrl: "http://prowlarr.local",
      credentials: null,
      extraConfig: JSON.stringify({}),
    },
    {
      serviceId: serviceByName["SabNZB"],
      widgetType: "sabnzbd",
      apiUrl: "http://sabnzbd.local",
      credentials: null,
      extraConfig: JSON.stringify({}),
    },
    {
      serviceId: serviceByName["Requests"],
      widgetType: "jellyseerr",
      apiUrl: "http://jellyseerr.local:5055",
      credentials: null,
      extraConfig: JSON.stringify({}),
    },
    {
      serviceId: serviceByName["Portainer"],
      widgetType: "portainer",
      apiUrl: "http://portainer.local",
      credentials: null,
      extraConfig: JSON.stringify({}),
    },
    {
      serviceId: serviceByName["Jellyfin"],
      widgetType: "jellyfin",
      apiUrl: "http://jellyfin.local",
      credentials: null,
      extraConfig: JSON.stringify({}),
    },
    {
      serviceId: serviceByName["Homeassistant"],
      widgetType: "homeassistant",
      apiUrl: "http://homeassistant.local:8123",
      credentials: null,
      extraConfig: JSON.stringify({ entityId: "sun.sun" }),
    },
  ];

  await db.insert(schema.widgetConfigs).values(widgetData);
}
