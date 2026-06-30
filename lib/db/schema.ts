import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const pages = sqliteTable("pages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
});

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  pageId: integer("page_id")
    .notNull()
    .references(() => pages.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  columnPosition: integer("column_position").notNull().default(0),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  color: text("color"),
});

export const services = sqliteTable("services", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  subtitle: text("subtitle"),
  url: text("url").notNull(),
  lanUrl: text("lan_url"),
  cardColor: text("card_color"),
  linkOpenMode: text("link_open_mode").default("same_tab"),
  icon: text("icon"),
  sortOrder: integer("sort_order").notNull().default(0),
  rowOrder: integer("row_order").notNull().default(0),
  slotIndex: integer("slot_index").notNull().default(0),
  healthCheckUrl: text("health_check_url"),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  insecureTls: integer("insecure_tls", { mode: "boolean" }).notNull().default(false),
});

export const linkBars = sqliteTable("link_bars", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  zone: text("zone").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  title: text("title"),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
});

export const navLinks = sqliteTable("nav_links", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  barId: integer("bar_id")
    .notNull()
    .references(() => linkBars.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  url: text("url").notNull(),
  icon: text("icon"),
  sortOrder: integer("sort_order").notNull().default(0),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  linkOpenMode: text("link_open_mode").default("same_tab"),
});

export const widgetConfigs = sqliteTable("widget_configs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  serviceId: integer("service_id")
    .notNull()
    .references(() => services.id, { onDelete: "cascade" }),
  widgetType: text("widget_type").notNull(),
  apiUrl: text("api_url").notNull(),
  credentials: text("credentials"),
  extraConfig: text("extra_config"),
  hiddenFields: text("hidden_fields"),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  page: one(pages, {
    fields: [categories.pageId],
    references: [pages.id],
  }),
  services: many(services),
}));

export const pagesRelations = relations(pages, ({ many }) => ({
  categories: many(categories),
}));

export const linkBarsRelations = relations(linkBars, ({ many }) => ({
  links: many(navLinks),
}));

export const navLinksRelations = relations(navLinks, ({ one }) => ({
  bar: one(linkBars, {
    fields: [navLinks.barId],
    references: [linkBars.id],
  }),
}));

export const servicesRelations = relations(services, ({ one }) => ({
  category: one(categories, {
    fields: [services.categoryId],
    references: [categories.id],
  }),
  widgetConfig: one(widgetConfigs, {
    fields: [services.id],
    references: [widgetConfigs.serviceId],
  }),
}));

export const widgetConfigsRelations = relations(widgetConfigs, ({ one }) => ({
  service: one(services, {
    fields: [widgetConfigs.serviceId],
    references: [services.id],
  }),
}));

export type Page = typeof pages.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Service = typeof services.$inferSelect;
export type LinkBar = typeof linkBars.$inferSelect;
export type NavLink = typeof navLinks.$inferSelect;
export type WidgetConfig = typeof widgetConfigs.$inferSelect;
export type Setting = typeof settings.$inferSelect;

export type LinkZone = "header" | "footer";

export interface LinkBarWithLinks extends LinkBar {
  links: NavLink[];
}
