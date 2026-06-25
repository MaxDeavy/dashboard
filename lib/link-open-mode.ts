export type LinkOpenMode = "same_tab" | "new_tab";

export const DEFAULT_LINK_OPEN_MODE: LinkOpenMode = "same_tab";

export const LINK_OPEN_MODE_OPTIONS: Array<{
  value: LinkOpenMode;
  label: string;
}> = [
  { value: "same_tab", label: "Gleicher Tab" },
  { value: "new_tab", label: "Neuer Tab" },
];

export function parseLinkOpenMode(
  value: string | undefined | null,
): LinkOpenMode {
  if (value === "new_tab") return "new_tab";
  return DEFAULT_LINK_OPEN_MODE;
}

export function getLinkOpenModeLabel(mode: LinkOpenMode): string {
  return (
    LINK_OPEN_MODE_OPTIONS.find((option) => option.value === mode)?.label ??
    "Gleicher Tab"
  );
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
