import type { Category } from "@/lib/db/schema";

export const UNSORTED_CATEGORY_ID = -1;

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

export function isUnsortedService(service: ServiceBoardItem): boolean {
  return service.sortOrder < 0;
}

export function createUnsortedCategory(pageId: number): Category {
  return {
    id: UNSORTED_CATEGORY_ID,
    pageId,
    name: "Unsortiert",
    sortOrder: -1,
    columnPosition: -1,
    enabled: true,
    color: null,
  };
}

export function buildServiceBoard<T extends ServiceBoardItem>(
  services: T[],
  categories: Category[],
  pageId: number,
): ServiceBoardColumn<T>[] {
  const pageCategories = categories.filter(
    (category) => category.pageId === pageId,
  );
  const pageCategoryIds = new Set(pageCategories.map((category) => category.id));

  const unsorted = services
    .filter(
      (service) =>
        isUnsortedService(service) && pageCategoryIds.has(service.categoryId),
    )
    .sort((a, b) => b.id - a.id);

  const sortedCategories = [...pageCategories].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  const categoryColumns = sortedCategories.map((category) => ({
    categoryId: category.id,
    category,
    services: services
      .filter(
        (service) =>
          service.categoryId === category.id && !isUnsortedService(service),
      )
      .sort((a, b) => a.sortOrder - b.sortOrder),
  }));

  return [
    {
      categoryId: UNSORTED_CATEGORY_ID,
      category: createUnsortedCategory(pageId),
      services: unsorted,
    },
    ...categoryColumns,
  ];
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
    categoryId:
      targetCategoryId === UNSORTED_CATEGORY_ID
        ? moved.categoryId
        : targetCategoryId,
    sortOrder:
      targetCategoryId === UNSORTED_CATEGORY_ID ? -1 : insertIndex,
  };

  targetColumn.services.splice(insertIndex, 0, updatedService);

  const updates: ServiceReorderUpdate[] = [];
  for (const column of next) {
    column.services.forEach((service, index) => {
      if (column.categoryId === UNSORTED_CATEGORY_ID) {
        updates.push({
          id: service.id,
          categoryId: service.categoryId,
          sortOrder: -1,
        });
      } else {
        updates.push({
          id: service.id,
          categoryId: column.categoryId,
          sortOrder: index,
        });
      }
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
