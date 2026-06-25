export interface NavLinkBoardItem {
  id: number;
  barId: number;
  sortOrder: number;
}

export interface NavLinkReorderUpdate {
  id: number;
  barId: number;
  sortOrder: number;
}

export function moveNavLinkInBar<T extends NavLinkBoardItem>(
  links: T[],
  linkId: number,
  targetIndex: number,
): { links: T[]; updates: NavLinkReorderUpdate[] } {
  const next = [...links];
  const fromIndex = next.findIndex((link) => link.id === linkId);
  if (fromIndex < 0) {
    return { links, updates: [] };
  }

  let insertIndex = Math.min(Math.max(targetIndex, 0), next.length);
  if (fromIndex < targetIndex) {
    insertIndex = Math.max(insertIndex - 1, 0);
  }

  const [moved] = next.splice(fromIndex, 1);
  if (!moved) {
    return { links, updates: [] };
  }

  next.splice(insertIndex, 0, moved);

  const updates = next.map((link, index) => ({
    id: link.id,
    barId: moved.barId,
    sortOrder: index,
  }));

  return {
    links: next.map((link, index) => ({ ...link, sortOrder: index })),
    updates,
  };
}

export function filterChangedNavLinkUpdates(
  updates: NavLinkReorderUpdate[],
  original: Map<number, number>,
): NavLinkReorderUpdate[] {
  return updates.filter((update) => original.get(update.id) !== update.sortOrder);
}
