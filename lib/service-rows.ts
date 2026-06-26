export const MAX_SERVICES_PER_ROW = 3;

export interface ServiceLayoutItem {
  id: number;
  categoryId: number;
  sortOrder: number;
  rowOrder: number;
  slotIndex: number;
}

export interface ServiceLayoutUpdate {
  id: number;
  categoryId: number;
  sortOrder: number;
  rowOrder: number;
  slotIndex: number;
}

export function compareServiceLayout(
  a: Pick<ServiceLayoutItem, "rowOrder" | "slotIndex" | "sortOrder">,
  b: Pick<ServiceLayoutItem, "rowOrder" | "slotIndex" | "sortOrder">,
): number {
  if (a.rowOrder !== b.rowOrder) return a.rowOrder - b.rowOrder;
  if (a.slotIndex !== b.slotIndex) return a.slotIndex - b.slotIndex;
  return a.sortOrder - b.sortOrder;
}

export function sortServicesByLayout<T extends ServiceLayoutItem>(
  services: T[],
): T[] {
  return [...services].sort(compareServiceLayout);
}

export function groupServicesIntoRows<T extends ServiceLayoutItem>(
  services: T[],
): T[][] {
  const sorted = sortServicesByLayout(services);
  const rowMap = new Map<number, T[]>();

  for (const service of sorted) {
    const row = rowMap.get(service.rowOrder) ?? [];
    row.push(service);
    rowMap.set(service.rowOrder, row);
  }

  return [...rowMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, row]) => sortServicesByLayout(row));
}

function layoutFromSlotRows<T extends ServiceLayoutItem>(
  rows: Array<Array<T | null>>,
  categoryId: number,
): T[] {
  const result: T[] = [];

  rows.forEach((row, rowOrder) => {
    for (let slotIndex = 0; slotIndex < row.length; slotIndex++) {
      const service = row[slotIndex];
      if (!service) continue;

      result.push({
        ...service,
        categoryId,
        rowOrder,
        slotIndex,
        sortOrder: rowOrder * MAX_SERVICES_PER_ROW + slotIndex,
      });
    }
  });

  return result;
}

function applyLayout<T extends ServiceLayoutItem>(
  services: T[],
  categoryId: number,
): T[] {
  const rows = groupServicesIntoRows(services);
  const next: T[] = [];

  rows.forEach((row, rowOrder) => {
    sortServicesByLayout(row).forEach((service, slotIndex) => {
      next.push({
        ...service,
        categoryId,
        rowOrder,
        slotIndex,
        sortOrder: rowOrder * MAX_SERVICES_PER_ROW + slotIndex,
      });
    });
  });

  return next;
}

function layoutUpdatesFromServices<T extends ServiceLayoutItem>(
  services: T[],
): ServiceLayoutUpdate[] {
  return services.map((service) => ({
    id: service.id,
    categoryId: service.categoryId,
    sortOrder: service.sortOrder,
    rowOrder: service.rowOrder,
    slotIndex: service.slotIndex,
  }));
}

function rowsFromServices<T extends ServiceLayoutItem>(
  services: T[],
): Array<Array<T | null>> {
  const grouped = groupServicesIntoRows(services);
  if (grouped.length === 0) {
    return [[null, null, null]];
  }

  return grouped.map((row) => {
    const slots: Array<T | null> = [null, null, null];
    for (const service of row) {
      if (service.slotIndex >= 0 && service.slotIndex < MAX_SERVICES_PER_ROW) {
        slots[service.slotIndex] = service;
      }
    }
    return slots;
  });
}

function insertWithOverflow<T>(
  rows: Array<Array<T | null>>,
  rowOrder: number,
  slotIndex: number,
  service: T,
): Array<Array<T | null>> {
  const next = rows.map((row) => [...row]);
  while (next.length <= rowOrder) {
    next.push([null, null, null]);
  }

  let carry: T | null = service;
  let currentRow = rowOrder;

  while (carry && currentRow < next.length + 1) {
    if (!next[currentRow]) {
      next[currentRow] = [null, null, null];
    }

    for (let slot = currentRow === rowOrder ? slotIndex : 0; slot < MAX_SERVICES_PER_ROW; slot++) {
      const existing = next[currentRow][slot];
      next[currentRow][slot] = carry;
      carry = existing;
      if (!carry) break;
    }

    currentRow += 1;
  }

  if (carry) {
    next.push([carry, null, null]);
  }

  return next.filter((row) => row.some((cell) => cell != null));
}

function flattenRows<T>(rows: Array<Array<T | null>>): T[] {
  const result: T[] = [];
  for (const row of rows) {
    for (const service of row) {
      if (service) result.push(service);
    }
  }
  return result;
}

export function moveServiceToSlot<T extends ServiceLayoutItem>(
  services: T[],
  serviceId: number,
  targetCategoryId: number,
  targetRowOrder: number,
  targetSlotIndex: number,
): { services: T[]; updates: ServiceLayoutUpdate[] } {
  const next = services.map((service) => ({ ...service }));
  const moving = next.find((service) => service.id === serviceId);
  if (!moving) {
    return { services, updates: [] };
  }

  const remaining = next.filter((service) => service.id !== serviceId);
  const targetServices = remaining.filter(
    (service) => service.categoryId === targetCategoryId,
  );
  const otherServices = remaining.filter(
    (service) => service.categoryId !== targetCategoryId,
  );

  const rows = rowsFromServices(targetServices);
  const inserted = insertWithOverflow(
    rows,
    targetRowOrder,
    Math.min(Math.max(targetSlotIndex, 0), MAX_SERVICES_PER_ROW - 1),
    { ...moving, categoryId: targetCategoryId },
  );

  const laidOutTarget = layoutFromSlotRows(inserted, targetCategoryId);
  const sourceCategoryId = moving.categoryId;
  let laidOutSource: T[] = [];

  if (sourceCategoryId !== targetCategoryId) {
    const sourceServices = remaining.filter(
      (service) => service.categoryId === sourceCategoryId,
    );
    laidOutSource = applyLayout(sourceServices, sourceCategoryId);
  }

  const merged = [...otherServices, ...laidOutSource, ...laidOutTarget];
  return {
    services: merged,
    updates: layoutUpdatesFromServices(merged),
  };
}

export function moveServiceLinearInCategory<T extends ServiceLayoutItem>(
  services: T[],
  serviceId: number,
  targetCategoryId: number,
  targetIndex: number,
): { services: T[]; updates: ServiceLayoutUpdate[] } {
  const next = services.map((service) => ({ ...service }));
  const moving = next.find((service) => service.id === serviceId);
  if (!moving) {
    return { services, updates: [] };
  }

  const remaining = next.filter((service) => service.id !== serviceId);
  const targetServices = sortServicesByLayout(
    remaining.filter((service) => service.categoryId === targetCategoryId),
  );
  const otherServices = remaining.filter(
    (service) => service.categoryId !== targetCategoryId,
  );

  let insertIndex = Math.min(Math.max(targetIndex, 0), targetServices.length);
  const sourceIndex = targetServices.findIndex((service) => service.id === serviceId);
  if (
    moving.categoryId === targetCategoryId &&
    sourceIndex >= 0 &&
    sourceIndex < targetIndex
  ) {
    insertIndex = Math.max(insertIndex - 1, 0);
  }

  const reordered = [...targetServices];
  reordered.splice(insertIndex, 0, { ...moving, categoryId: targetCategoryId });

  const rows: T[] = [];
  reordered.forEach((service, index) => {
    const rowOrder = Math.floor(index / MAX_SERVICES_PER_ROW);
    const slotIndex = index % MAX_SERVICES_PER_ROW;
    rows.push({
      ...service,
      categoryId: targetCategoryId,
      rowOrder,
      slotIndex,
      sortOrder: rowOrder * MAX_SERVICES_PER_ROW + slotIndex,
    });
  });

  const sourceCategoryId = moving.categoryId;
  let laidOutSource: T[] = [];
  if (sourceCategoryId !== targetCategoryId) {
    const sourceServices = remaining.filter(
      (service) => service.categoryId === sourceCategoryId,
    );
    laidOutSource = applyLayout(sourceServices, sourceCategoryId);
  }

  const merged = [...otherServices, ...laidOutSource, ...rows];
  return {
    services: merged,
    updates: layoutUpdatesFromServices(merged),
  };
}

export function getNextAvailableSlot<T extends ServiceLayoutItem>(
  row: T[],
): number | null {
  if (row.length >= MAX_SERVICES_PER_ROW) return null;

  const usedSlots = new Set(row.map((service) => service.slotIndex));
  for (let slotIndex = 0; slotIndex < MAX_SERVICES_PER_ROW; slotIndex++) {
    if (!usedSlots.has(slotIndex)) return slotIndex;
  }

  return null;
}

function normalizeCategoryLayout<T extends ServiceLayoutItem>(
  rows: T[][],
  categoryId: number,
): T[] {
  const result: T[] = [];

  rows.forEach((row, rowOrder) => {
    const sorted = sortServicesByLayout(row);
    sorted.forEach((service) => {
      const slotIndex = sorted.length === 1 ? 0 : service.slotIndex;
      result.push({
        ...service,
        categoryId,
        rowOrder,
        slotIndex,
        sortOrder: rowOrder * MAX_SERVICES_PER_ROW + slotIndex,
      });
    });
  });

  return result;
}

export function moveServiceToOwnRowAt<T extends ServiceLayoutItem>(
  services: T[],
  serviceId: number,
  targetCategoryId: number,
  beforeRowOrder: number,
): { services: T[]; updates: ServiceLayoutUpdate[] } {
  const next = services.map((service) => ({ ...service }));
  const moving = next.find((service) => service.id === serviceId);
  if (!moving) {
    return { services, updates: [] };
  }

  const remaining = next.filter((service) => service.id !== serviceId);
  const sourceCategoryId = moving.categoryId;
  const targetServices = remaining.filter(
    (service) => service.categoryId === targetCategoryId,
  );
  const otherServices = remaining.filter(
    (service) => service.categoryId !== targetCategoryId,
  );

  const rows = groupServicesIntoRows(targetServices);
  const insertAt = Math.min(Math.max(beforeRowOrder, 0), rows.length);
  rows.splice(insertAt, 0, [
    { ...moving, categoryId: targetCategoryId, rowOrder: insertAt, slotIndex: 0 },
  ]);

  const laidOutTarget = normalizeCategoryLayout(rows, targetCategoryId);

  let laidOutSource: T[] = [];
  if (sourceCategoryId !== targetCategoryId) {
    const sourceServices = remaining.filter(
      (service) => service.categoryId === sourceCategoryId,
    );
    laidOutSource = normalizeCategoryLayout(
      groupServicesIntoRows(sourceServices),
      sourceCategoryId,
    );
  }

  const merged = [...otherServices, ...laidOutSource, ...laidOutTarget];
  return {
    services: merged,
    updates: layoutUpdatesFromServices(merged),
  };
}

export function getNextServiceLayout<T extends ServiceLayoutItem>(
  services: T[],
  categoryId: number,
): Pick<ServiceLayoutItem, "rowOrder" | "slotIndex" | "sortOrder"> {
  const inCategory = services.filter(
    (service) => service.categoryId === categoryId,
  );

  if (inCategory.length === 0) {
    return { rowOrder: 0, slotIndex: 0, sortOrder: 0 };
  }

  const maxRowOrder = Math.max(...inCategory.map((service) => service.rowOrder));
  const nextRowOrder = maxRowOrder + 1;

  return {
    rowOrder: nextRowOrder,
    slotIndex: 0,
    sortOrder: nextRowOrder * MAX_SERVICES_PER_ROW,
  };
}

export function filterChangedLayoutUpdates(
  updates: ServiceLayoutUpdate[],
  original: Map<
    number,
    { categoryId: number; sortOrder: number; rowOrder: number; slotIndex: number }
  >,
): ServiceLayoutUpdate[] {
  return updates.filter((update) => {
    const before = original.get(update.id);
    if (!before) return true;
    return (
      before.categoryId !== update.categoryId ||
      before.sortOrder !== update.sortOrder ||
      before.rowOrder !== update.rowOrder ||
      before.slotIndex !== update.slotIndex
    );
  });
}
