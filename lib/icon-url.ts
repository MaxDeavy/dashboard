export function isExternalIconUrl(icon: string | null | undefined): boolean {
  if (!icon) return false;
  const value = icon.trim();
  return value.startsWith("http://") || value.startsWith("https://");
}

export function isCustomSharedIcon(icon: string | null | undefined): boolean {
  return Boolean(icon?.includes("/api/uploads/custom-icon"));
}
