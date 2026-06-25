import type { Category } from "@/lib/db/schema";

export interface ServiceBoardItem {
  id: number;
  categoryId: number;
  sortOrder: number;
}

export interface ServiceBoardColumn<T extends ServiceBoardItem> {
  categoryId: number;
  category: Category;
  services: T[];
}

export interface ServiceReorderUpdate {
  id: number;
  categoryId: number;
  sortOrder: number;
}

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
    services: services
      .filter((service) => service.categoryId === category.id)
      .sort((a, b) => a.sortOrder - b.sortOrder),
  }));
}

export function moveServiceInBoard<T extends ServiceBoardItem>(
  columns: ServiceBoardColumn<T>[],
  serviceId: number,
  targetCategoryId: number,
  targetIndex: number,
): { columns: ServiceBoardColumn<T>[]; updates: ServiceReorderUpdate[] } {
  const next = columns.map((column) => ({
    ...column,
    services: [...column.services],
  }));

  let moved: T | null = null;
  let sourceCategoryId: number | null = null;
  let sourceIndex = -1;

  for (const column of next) {
    const index = column.services.findIndex((service) => service.id === serviceId);
    if (index >= 0) {
      sourceCategoryId = column.categoryId;
      sourceIndex = index;
      moved = column.services.splice(index, 1)[0] ?? null;
      break;
    }
  }

  if (!moved) {
    return { columns, updates: [] };
  }

  const targetColumn = next.find(
    (column) => column.categoryId === targetCategoryId,
  );
  if (!targetColumn) {
    return { columns, updates: [] };
  }

  let insertIndex = Math.min(
    Math.max(targetIndex, 0),
    targetColumn.services.length,
  );

  if (sourceCategoryId === targetCategoryId && sourceIndex < targetIndex) {
    insertIndex = Math.max(insertIndex - 1, 0);
  }

  const updatedService = {
    ...moved,
    categoryId: targetCategoryId,
    sortOrder: insertIndex,
  };

  targetColumn.services.splice(insertIndex, 0, updatedService);

  const updates: ServiceReorderUpdate[] = [];
  for (const column of next) {
    column.services.forEach((service, index) => {
      updates.push({
        id: service.id,
        categoryId: column.categoryId,
        sortOrder: index,
      });
    });
  }

  return { columns: next, updates };
}

export function filterChangedReorderUpdates(
  updates: ServiceReorderUpdate[],
  original: Map<number, { categoryId: number; sortOrder: number }>,
): ServiceReorderUpdate[] {
  return updates.filter((update) => {
    const before = original.get(update.id);
    if (!before) return true;
    return (
      before.categoryId !== update.categoryId ||
      before.sortOrder !== update.sortOrder
    );
  });
}
