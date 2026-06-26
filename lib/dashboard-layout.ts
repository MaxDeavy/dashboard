import {
  filterChangedReorderUpdates,
  moveServiceInBoard,
  moveServiceToOwnRowInBoard,
  moveServiceToSlotInBoard,
  type ServiceBoardItem,
  type ServiceReorderUpdate,
} from "@/lib/service-board";

export interface DashboardColumn<T extends ServiceBoardItem> {
  id: number;
  name: string;
  sortOrder: number;
  columnPosition: number;
  enabled: boolean;
  color?: string | null;
  pageId: number;
  services: T[];
  isEmpty?: boolean;
}

export interface CategoryReorderUpdate {
  id: number;
  columnPosition: number;
}

export function getEditableDashboardColumns<T extends ServiceBoardItem>(
  columns: DashboardColumn<T>[],
): DashboardColumn<T>[] {
  return columns.filter((column) => !column.isEmpty && column.id > 0);
}

export function moveDashboardColumn<T extends ServiceBoardItem>(
  columns: DashboardColumn<T>[],
  columnId: number,
  targetIndex: number,
): { columns: DashboardColumn<T>[]; updates: CategoryReorderUpdate[] } {
  const next = getEditableDashboardColumns(columns).map((column) => ({
    ...column,
    services: [...column.services],
  }));

  const fromIndex = next.findIndex((column) => column.id === columnId);
  if (fromIndex < 0) {
    return { columns, updates: [] };
  }

  let insertIndex = Math.min(Math.max(targetIndex, 0), next.length);
  if (fromIndex < targetIndex) {
    insertIndex = Math.max(insertIndex - 1, 0);
  }

  const [moved] = next.splice(fromIndex, 1);
  if (!moved) {
    return { columns, updates: [] };
  }

  next.splice(insertIndex, 0, moved);

  const updates = next.map((column, index) => ({
    id: column.id,
    columnPosition: index,
  }));

  return {
    columns: next.map((column, index) => ({
      ...column,
      columnPosition: index,
    })),
    updates,
  };
}

export function moveDashboardServiceToOwnRow<T extends ServiceBoardItem>(
  columns: DashboardColumn<T>[],
  serviceId: number,
  targetCategoryId: number,
  beforeRowOrder: number,
): { columns: DashboardColumn<T>[]; updates: ServiceReorderUpdate[] } {
  const boardColumns = getEditableDashboardColumns(columns).map((column) => ({
    categoryId: column.id,
    category: {
      id: column.id,
      name: column.name,
      sortOrder: column.sortOrder,
      columnPosition: column.columnPosition,
      enabled: column.enabled,
      color: column.color ?? null,
      pageId: column.pageId ?? 0,
    },
    services: column.services,
  }));

  const { columns: nextBoard, updates } = moveServiceToOwnRowInBoard(
    boardColumns,
    serviceId,
    targetCategoryId,
    beforeRowOrder,
  );

  return {
    columns: nextBoard.map((column) => ({
      id: column.categoryId,
      name: column.category.name,
      sortOrder: column.category.sortOrder,
      columnPosition: column.category.columnPosition,
      enabled: column.category.enabled,
      color: column.category.color ?? null,
      pageId: column.category.pageId,
      services: column.services,
      isEmpty: false,
    })),
    updates,
  };
}

export function moveDashboardServiceToSlot<T extends ServiceBoardItem>(
  columns: DashboardColumn<T>[],
  serviceId: number,
  targetCategoryId: number,
  targetRowOrder: number,
  targetSlotIndex: number,
): { columns: DashboardColumn<T>[]; updates: ServiceReorderUpdate[] } {
  const boardColumns = getEditableDashboardColumns(columns).map((column) => ({
    categoryId: column.id,
    category: {
      id: column.id,
      name: column.name,
      sortOrder: column.sortOrder,
      columnPosition: column.columnPosition,
      enabled: column.enabled,
      color: column.color ?? null,
      pageId: column.pageId ?? 0,
    },
    services: column.services,
  }));

  const { columns: nextBoard, updates } = moveServiceToSlotInBoard(
    boardColumns,
    serviceId,
    targetCategoryId,
    targetRowOrder,
    targetSlotIndex,
  );

  return {
    columns: nextBoard.map((column) => ({
      id: column.categoryId,
      name: column.category.name,
      sortOrder: column.category.sortOrder,
      columnPosition: column.category.columnPosition,
      enabled: column.category.enabled,
      color: column.category.color ?? null,
      pageId: column.category.pageId,
      services: column.services,
      isEmpty: false,
    })),
    updates,
  };
}

export function moveDashboardService<T extends ServiceBoardItem>(
  columns: DashboardColumn<T>[],
  serviceId: number,
  targetCategoryId: number,
  targetIndex: number,
): { columns: DashboardColumn<T>[]; updates: ServiceReorderUpdate[] } {
  const boardColumns = getEditableDashboardColumns(columns).map((column) => ({
    categoryId: column.id,
    category: {
      id: column.id,
      name: column.name,
      sortOrder: column.sortOrder,
      columnPosition: column.columnPosition,
      enabled: column.enabled,
      color: column.color ?? null,
      pageId: column.pageId ?? 0,
    },
    services: column.services,
  }));

  const { columns: nextBoard, updates } = moveServiceInBoard(
    boardColumns,
    serviceId,
    targetCategoryId,
    targetIndex,
  );

  return {
    columns: nextBoard.map((column) => ({
      id: column.categoryId,
      name: column.category.name,
      sortOrder: column.category.sortOrder,
      columnPosition: column.category.columnPosition,
      enabled: column.category.enabled,
      color: column.category.color ?? null,
      pageId: column.category.pageId,
      services: column.services,
      isEmpty: false,
    })),
    updates,
  };
}

export function filterChangedCategoryUpdates(
  updates: CategoryReorderUpdate[],
  original: Map<number, number>,
): CategoryReorderUpdate[] {
  return updates.filter((update) => original.get(update.id) !== update.columnPosition);
}

export function buildServicePositionMap<T extends ServiceBoardItem>(
  columns: DashboardColumn<T>[],
): Map<
  number,
  { categoryId: number; sortOrder: number; rowOrder: number; slotIndex: number }
> {
  const map = new Map<
    number,
    { categoryId: number; sortOrder: number; rowOrder: number; slotIndex: number }
  >();

  for (const column of columns) {
    for (const service of column.services) {
      map.set(service.id, {
        categoryId: service.categoryId,
        sortOrder: service.sortOrder,
        rowOrder: service.rowOrder,
        slotIndex: service.slotIndex,
      });
    }
  }

  return map;
}

export { filterChangedReorderUpdates };
