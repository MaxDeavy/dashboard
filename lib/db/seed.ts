import { db, schema, sqlite } from "./index";
import { count } from "drizzle-orm";
import {
  DEFAULT_SERVICE_ICONS,
  LEGACY_EMOJI_ICONS,
} from "@/lib/service-icons";

function tableExists(name: string): boolean {
  const row = sqlite
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
    )
    .get(name);
  return Boolean(row);
}

function ensureSchemaPatches() {
  if (!tableExists("services")) return;

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
}

function ensurePagesTable() {
  if (!tableExists("pages")) {
    sqlite.exec(`
      CREATE TABLE \`pages\` (
        \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        \`name\` text NOT NULL,
        \`sort_order\` integer DEFAULT 0 NOT NULL,
        \`enabled\` integer DEFAULT 1 NOT NULL
      );
    `);
  }

  if (!tableExists("categories")) return;

  const categoryColumns = sqlite
    .prepare("PRAGMA table_info(categories)")
    .all() as Array<{ name: string }>;

  if (!categoryColumns.some((column) => column.name === "page_id")) {
    sqlite.exec(
      "ALTER TABLE `categories` ADD COLUMN `page_id` integer REFERENCES `pages`(`id`) ON UPDATE no action ON DELETE cascade",
    );
  }
}

async function ensurePagesData() {
  if (!tableExists("pages")) return;

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
  ensurePagesTable();
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
  const [settingsCount] = await db.select({ value: count() }).from(schema.settings);

  if (categoryCount.value > 0 || settingsCount.value > 0) {
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
    { key: "lan_enabled", value: "true" },
    { key: "dashboard_requires_auth", value: "false" },
  ];

  await db.insert(schema.settings).values(defaultSettings);
}
