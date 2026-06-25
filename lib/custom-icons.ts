import fs from "fs";
import path from "path";
import { isExternalIconUrl } from "@/lib/icon-url";
import { serverFetch } from "@/lib/server-fetch";
import { MAX_ICON_SIZE_BYTES, getUploadsDir } from "@/lib/uploads";

const ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".svg",
  ".ico",
]);

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
  "image/x-icon": ".ico",
  "image/vnd.microsoft.icon": ".ico",
};

const LABELS_FILE = "labels.json";

export interface CustomIconEntry {
  filename: string;
  label: string;
  url: string;
}

export interface ImportIconOptions {
  /** Base name for the saved file (e.g. service name). */
  name?: string;
  /** Display label in lists; defaults to name or filename. */
  label?: string;
}

export function getCustomIconsDir(): string {
  return path.join(getUploadsDir(), "custom-icons");
}

export function ensureCustomIconsDir(): string {
  const dir = getCustomIconsDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function getCustomIconPublicUrl(filename: string): string {
  return `/api/uploads/custom-icon?file=${encodeURIComponent(path.basename(filename))}`;
}

export function sanitizeIconBasename(name: string): string {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "icon";
}

function extensionFromMime(contentType: string | null | undefined): string | null {
  if (!contentType) return null;
  return MIME_TO_EXT[contentType.split(";")[0]?.trim().toLowerCase()] ?? null;
}

export function deriveFilenameFromUrl(
  url: string,
  contentType?: string | null,
): string {
  const parsed = new URL(url);
  const base = path.basename(parsed.pathname);
  let ext = path.extname(base).toLowerCase();
  let nameBase = base ? path.basename(base, ext) : "";

  if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
    ext = extensionFromMime(contentType) ?? ".png";
  }

  if (!nameBase || nameBase === "." || nameBase === "/") {
    nameBase = "icon";
  }

  return `${sanitizeIconBasename(nameBase)}${ext}`;
}

export function filenameFromName(name: string, ext: string): string {
  const safeExt = ALLOWED_EXTENSIONS.has(ext.toLowerCase()) ? ext.toLowerCase() : ".png";
  return `${sanitizeIconBasename(name)}${safeExt}`;
}

export function labelFromFilename(filename: string): string {
  return path.basename(filename, path.extname(filename));
}

function getLabelsFilePath(): string {
  return path.join(getCustomIconsDir(), LABELS_FILE);
}

function readIconLabels(): Record<string, string> {
  const labelsPath = getLabelsFilePath();
  if (!fs.existsSync(labelsPath)) return {};

  try {
    const data = JSON.parse(fs.readFileSync(labelsPath, "utf8")) as Record<
      string,
      string
    >;
    return typeof data === "object" && data !== null ? data : {};
  } catch {
    return {};
  }
}

function writeIconLabels(labels: Record<string, string>) {
  ensureCustomIconsDir();
  fs.writeFileSync(getLabelsFilePath(), JSON.stringify(labels, null, 2), "utf8");
}

export function getCustomIconLabel(filename: string): string {
  const safeName = path.basename(filename);
  const labels = readIconLabels();
  return labels[safeName] ?? labelFromFilename(safeName);
}

export function setCustomIconLabel(filename: string, label: string): string {
  const safeName = path.basename(filename);
  if (!ALLOWED_EXTENSIONS.has(path.extname(safeName).toLowerCase())) {
    throw new Error("Invalid filename");
  }

  const trimmed = label.trim();
  if (!trimmed) {
    throw new Error("Label required");
  }

  const filePath = path.join(getCustomIconsDir(), safeName);
  if (!fs.existsSync(filePath)) {
    throw new Error("File not found");
  }

  const labels = readIconLabels();
  labels[safeName] = trimmed;
  writeIconLabels(labels);
  return trimmed;
}

/** @deprecated Use setCustomIconLabel — kept for /api/icons/rename compatibility */
export const renameCustomIcon = setCustomIconLabel;

export function getCustomIconFilePath(filename: string): string {
  const safeName = path.basename(filename);
  if (!ALLOWED_EXTENSIONS.has(path.extname(safeName).toLowerCase())) {
    throw new Error("Invalid filename");
  }
  return path.join(getCustomIconsDir(), safeName);
}

function resolveFilename(
  options: ImportIconOptions | undefined,
  url: string,
  contentType?: string | null,
): string {
  const fromUrl = deriveFilenameFromUrl(url, contentType);
  const ext = path.extname(fromUrl) || ".png";
  const baseName = options?.name?.trim() || options?.label?.trim();
  if (baseName) {
    return filenameFromName(baseName, ext);
  }
  return fromUrl;
}

function isValidImageBuffer(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;

  // PNG
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return true;
  }

  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }

  // GIF
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return true;
  }

  // ICO
  if (
    buffer[0] === 0x00 &&
    buffer[1] === 0x00 &&
    buffer[2] === 0x01 &&
    buffer[3] === 0x00
  ) {
    return true;
  }

  // WebP (RIFF....WEBP)
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return true;
  }

  // SVG (text-based)
  const head = buffer.subarray(0, Math.min(buffer.length, 256)).toString("utf8").trimStart();
  return head.startsWith("<") && (head.includes("<svg") || head.startsWith("<?xml"));

}

function saveCustomIconFile(
  buffer: Buffer,
  filename: string,
  label?: string,
): CustomIconEntry {
  if (!isValidImageBuffer(buffer)) {
    throw new Error("Invalid image data");
  }

  const safeName = path.basename(filename);
  if (!ALLOWED_EXTENSIONS.has(path.extname(safeName).toLowerCase())) {
    throw new Error("Invalid filename");
  }

  const dir = ensureCustomIconsDir();
  fs.writeFileSync(path.join(dir, safeName), buffer);

  const displayLabel = label?.trim() || getCustomIconLabel(safeName);
  if (label?.trim()) {
    setCustomIconLabel(safeName, label.trim());
  }

  return {
    filename: safeName,
    label: displayLabel,
    url: getCustomIconPublicUrl(safeName),
  };
}

export async function importIconFromUrl(
  url: string,
  options?: ImportIconOptions,
): Promise<CustomIconEntry> {
  const trimmed = url.trim();
  if (!isExternalIconUrl(trimmed)) {
    throw new Error("Not an external URL");
  }

  const response = await serverFetch(trimmed, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`);
  }

  const contentType = response.headers.get("content-type");
  const buffer = Buffer.from(await response.arrayBuffer());

  if (buffer.length > MAX_ICON_SIZE_BYTES) {
    throw new Error("Icon too large");
  }

  const filename = resolveFilename(options, trimmed, contentType);
  const label = options?.label?.trim() || options?.name?.trim();

  return saveCustomIconFile(buffer, filename, label);
}

export function importIconFromBuffer(
  buffer: Buffer,
  name: string,
  ext: string,
  label?: string,
): CustomIconEntry {
  if (buffer.length > MAX_ICON_SIZE_BYTES) {
    throw new Error("Icon too large");
  }

  const filename = filenameFromName(name, ext);
  return saveCustomIconFile(buffer, filename, label ?? name);
}

export function listCustomIcons(): CustomIconEntry[] {
  const dir = ensureCustomIconsDir();
  if (!fs.existsSync(dir)) return [];

  const labels = readIconLabels();

  return fs
    .readdirSync(dir)
    .filter((file) => ALLOWED_EXTENSIONS.has(path.extname(file).toLowerCase()))
    .map((filename) => ({
      filename,
      label: labels[filename] ?? labelFromFilename(filename),
      url: getCustomIconPublicUrl(filename),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function deleteCustomIcon(filename: string): void {
  const safeName = path.basename(filename);
  if (!ALLOWED_EXTENSIONS.has(path.extname(safeName).toLowerCase())) {
    throw new Error("Invalid filename");
  }

  const filePath = path.join(getCustomIconsDir(), safeName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  const labels = readIconLabels();
  if (labels[safeName]) {
    delete labels[safeName];
    writeIconLabels(labels);
  }
}

export async function resolveIconForStorage(
  icon: string | null | undefined,
  serviceName?: string | null,
): Promise<string | null> {
  if (!icon?.trim()) return null;
  const trimmed = icon.trim();
  if (isExternalIconUrl(trimmed)) {
    const imported = await importIconFromUrl(trimmed, {
      name: serviceName ?? undefined,
      label: serviceName ?? undefined,
    });
    return imported.url;
  }
  return trimmed;
}
