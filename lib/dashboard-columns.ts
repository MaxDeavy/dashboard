import { MAX_DASHBOARD_COLUMNS } from "@/lib/constants";
import type { Category } from "@/lib/db/schema";

export interface DashboardServiceRow {
  id: number;
  categoryId: number;
  sortOrder: number;
  hasWidget: boolean;
  widgetType: string | null;
  [key: string]: unknown;
}

export interface DashboardColumn<T extends DashboardServiceRow> extends Category {
  services: T[];
  isEmpty?: boolean;
}

export function buildDashboardColumns<T extends DashboardServiceRow>(
  pageId: number,
  allCategories: Category[],
  services: T[],
): DashboardColumn<T>[] {
  const categories = allCategories.filter(
    (category) => category.enabled && category.pageId === pageId,
  );

  const sorted = [...categories].sort(
    (a, b) => a.columnPosition - b.columnPosition,
  );
  const maxPosition = Math.min(
    Math.max(0, ...sorted.map((c) => c.columnPosition)),
    MAX_DASHBOARD_COLUMNS - 1,
  );
  const slotCount = maxPosition + 1;

  return Array.from({ length: slotCount }, (_, position) => {
    const category = sorted.find((c) => c.columnPosition === position);
    if (!category) {
      return {
        id: -(position + 1),
        pageId,
        name: "",
        sortOrder: position,
        columnPosition: position,
        enabled: true,
        color: null,
        services: [] as T[],
        isEmpty: true,
      };
    }

    return {
      ...category,
      services: services
        .filter((service) => service.categoryId === category.id)
        .sort((a, b) => a.sortOrder - b.sortOrder),
      isEmpty: false,
    };
  });
}
