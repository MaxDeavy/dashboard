import { asc, and, eq, gte } from "drizzle-orm";
import { buildDashboardColumns } from "@/lib/dashboard-columns";
import type { LinkBarWithLinks } from "./schema";
import { db, schema } from "./index";

export async function getSettings() {
  const rows = await db.select().from(schema.settings);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function getSetting(key: string, fallback = "") {
  const [row] = await db
    .select()
    .from(schema.settings)
    .where(eq(schema.settings.key, key));
  return row?.value ?? fallback;
}

export async function setSetting(key: string, value: string) {
  await db
    .insert(schema.settings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: schema.settings.key,
      set: { value },
    });
}

export async function getPages() {
  return db
    .select()
    .from(schema.pages)
    .orderBy(asc(schema.pages.sortOrder));
}

export async function getLinkBarsWithLinks(): Promise<{
  headers: LinkBarWithLinks[];
  footers: LinkBarWithLinks[];
}> {
  const [bars, links] = await Promise.all([
    db.select().from(schema.linkBars).orderBy(asc(schema.linkBars.sortOrder)),
    db.select().from(schema.navLinks).orderBy(asc(schema.navLinks.sortOrder)),
  ]);

  const linksByBar = new Map<number, typeof links>();
  for (const link of links) {
    const list = linksByBar.get(link.barId) ?? [];
    list.push(link);
    linksByBar.set(link.barId, list);
  }

  const withLinks = (zone: "header" | "footer"): LinkBarWithLinks[] =>
    bars
      .filter((b) => b.zone === zone)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((bar) => ({
        ...bar,
        links: linksByBar.get(bar.id) ?? [],
      }));

  return {
    headers: withLinks("header"),
    footers: withLinks("footer"),
  };
}

export async function getCategories() {
  return db
    .select()
    .from(schema.categories)
    .orderBy(asc(schema.categories.sortOrder));
}

export async function getServices() {
  return db
    .select()
    .from(schema.services)
    .where(
      and(eq(schema.services.enabled, true), gte(schema.services.sortOrder, 0)),
    )
    .orderBy(
      asc(schema.services.rowOrder),
      asc(schema.services.slotIndex),
      asc(schema.services.sortOrder),
    );
}

export async function getAllServices() {
  return db
    .select()
    .from(schema.services)
    .orderBy(
      asc(schema.services.rowOrder),
      asc(schema.services.slotIndex),
      asc(schema.services.sortOrder),
    );
}

export async function getServiceById(id: number) {
  const [service] = await db
    .select()
    .from(schema.services)
    .where(eq(schema.services.id, id));
  return service;
}

export async function getWidgetConfigByServiceId(serviceId: number) {
  const [config] = await db
    .select()
    .from(schema.widgetConfigs)
    .where(eq(schema.widgetConfigs.serviceId, serviceId));
  return config;
}

export async function getDashboardData() {
  const [allPages, allCategories, services, linkBarsData, settings, widgetConfigs] =
    await Promise.all([
      getPages(),
      getCategories(),
      getServices(),
      getLinkBarsWithLinks(),
      getSettings(),
      db.select().from(schema.widgetConfigs),
    ]);

  const pages = allPages.filter((page) => page.enabled);

  const widgetByServiceId = Object.fromEntries(
    widgetConfigs.map((w) => [w.serviceId, w]),
  );

  const servicesWithWidgets = services.map((service) => ({
    ...service,
    hasWidget: !!widgetByServiceId[service.id],
    widgetType: widgetByServiceId[service.id]?.widgetType ?? null,
  }));

  const pageBoards = pages.map((page) => ({
    pageId: page.id,
    columns: buildDashboardColumns(
      page.id,
      allCategories,
      servicesWithWidgets,
    ),
  }));

  return {
    pages,
    pageBoards,
    headerBars: linkBarsData.headers.filter((bar) => bar.enabled),
    footerBars: linkBarsData.footers.filter((bar) => bar.enabled),
    settings,
  };
}
