export type LinkOpenMode = "same_tab" | "new_tab";

export const DEFAULT_LINK_OPEN_MODE: LinkOpenMode = "same_tab";

export const LINK_OPEN_MODE_VALUES: LinkOpenMode[] = ["same_tab", "new_tab"];

const LINK_OPEN_MODE_I18N_KEYS = {
  same_tab: "sameTab",
  new_tab: "newTab",
} as const;

export function parseLinkOpenMode(
  value: string | undefined | null,
): LinkOpenMode {
  if (value === "new_tab") return "new_tab";
  return DEFAULT_LINK_OPEN_MODE;
}

export function getLinkOpenModeLabel(
  mode: LinkOpenMode,
  t?: (key: "sameTab" | "newTab") => string,
): string {
  const key = LINK_OPEN_MODE_I18N_KEYS[mode];
  if (t) return t(key);
  return mode;
}

export function getLinkAnchorProps(mode: LinkOpenMode): {
  target?: string;
  rel?: string;
} {
  if (mode === "new_tab") {
    return { target: "_blank", rel: "noopener noreferrer" };
  }
  return {};
}
