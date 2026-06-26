import type { Category } from "@/lib/db/schema";
import {
  filterChangedLayoutUpdates,
  moveServiceLinearInCategory,
  moveServiceToOwnRowAt,
  moveServiceToSlot,
  sortServicesByLayout,
  type ServiceLayoutItem,
  type ServiceLayoutUpdate,
} from "@/lib/service-rows";

export interface ServiceBoardItem extends ServiceLayoutItem {}

export interface ServiceBoardColumn<T extends ServiceBoardItem> {
  categoryId: number;
  category: Category;
  services: T[];
}

export type ServiceReorderUpdate = ServiceLayoutUpdate;

export function buildServiceBoard<T extends ServiceBoardItem>(
  services: T[],
  categories: Category[],
  pageId: number,
): ServiceBoardColumn<T>[] {
  const pageCategories = categories
    .filter((category) => category.pageId === pageId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return pageCategories.map((category) => ({
    categoryId: category.id,
    category,
    services: sortServicesByLayout(
      services.filter((service) => service.categoryId === category.id),
    ),
  }));
}

function rebuildBoardColumns<T extends ServiceBoardItem>(
  columns: ServiceBoardColumn<T>[],
  mergedServices: T[],
): ServiceBoardColumn<T>[] {
  return columns.map((column) => ({
    ...column,
    services: sortServicesByLayout(
      mergedServices.filter((service) => service.categoryId === column.categoryId),
    ),
  }));
}

function flattenBoardServices<T extends ServiceBoardItem>(
  columns: ServiceBoardColumn<T>[],
): T[] {
  return columns.flatMap((column) => column.services);
}

export function moveServiceToSlotInBoard<T extends ServiceBoardItem>(
  columns: ServiceBoardColumn<T>[],
  serviceId: number,
  targetCategoryId: number,
  targetRowOrder: number,
  targetSlotIndex: number,
): { columns: ServiceBoardColumn<T>[]; updates: ServiceReorderUpdate[] } {
  const { services: merged, updates } = moveServiceToSlot(
    flattenBoardServices(columns),
    serviceId,
    targetCategoryId,
    targetRowOrder,
    targetSlotIndex,
  );

  return {
    columns: rebuildBoardColumns(columns, merged),
    updates,
  };
}

export function moveServiceToOwnRowInBoard<T extends ServiceBoardItem>(
  columns: ServiceBoardColumn<T>[],
  serviceId: number,
  targetCategoryId: number,
  beforeRowOrder: number,
): { columns: ServiceBoardColumn<T>[]; updates: ServiceReorderUpdate[] } {
  const { services: merged, updates } = moveServiceToOwnRowAt(
    flattenBoardServices(columns),
    serviceId,
    targetCategoryId,
    beforeRowOrder,
  );

  return {
    columns: rebuildBoardColumns(columns, merged),
    updates,
  };
}

export function moveServiceInBoard<T extends ServiceBoardItem>(
  columns: ServiceBoardColumn<T>[],
  serviceId: number,
  targetCategoryId: number,
  targetIndex: number,
): { columns: ServiceBoardColumn<T>[]; updates: ServiceReorderUpdate[] } {
  const { services: merged, updates } = moveServiceLinearInCategory(
    flattenBoardServices(columns),
    serviceId,
    targetCategoryId,
    targetIndex,
  );

  return {
    columns: rebuildBoardColumns(columns, merged),
    updates,
  };
}

export function filterChangedReorderUpdates(
  updates: ServiceReorderUpdate[],
  original: Map<
    number,
    { categoryId: number; sortOrder: number; rowOrder: number; slotIndex: number }
  >,
): ServiceReorderUpdate[] {
  return filterChangedLayoutUpdates(updates, original);
}
