import fs from "fs";
import path from "path";
import {
  getDatabaseUrl,
  getMaxBackgroundUploadBytes,
  getMaxIconUploadBytes,
  getMaxLogoUploadBytes,
} from "@/lib/env";

const ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".svg",
  ".ico",
]);

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
]);

export const BACKGROUND_SETTING_KEY = "background_image";
export const DASHBOARD_LOGO_SETTING_KEY = "dashboard_logo";
export const MAX_BACKGROUND_SIZE_BYTES = getMaxBackgroundUploadBytes();
export const MAX_LOGO_SIZE_BYTES = getMaxLogoUploadBytes();
export const MAX_ICON_SIZE_BYTES = getMaxIconUploadBytes();

export function getUploadsDir(): string {
  const url = getDatabaseUrl();
  const filePath = url.startsWith("file:")
    ? url.replace("file:", "")
    : "data/dashboard.db";
  const dbPath = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath);
  return path.join(path.dirname(dbPath), "uploads");
}

export function ensureUploadsDir() {
  const dir = getUploadsDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function isAllowedImage(file: File): boolean {
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) return false;
  if (!file.type) return true;
  return ALLOWED_IMAGE_TYPES.has(file.type);
}

export function getBackgroundFilePath(filename: string): string {
  const safeName = path.basename(filename);
  if (!safeName.startsWith("background.")) {
    throw new Error("Invalid filename");
  }
  return path.join(getUploadsDir(), safeName);
}

export function findBackgroundFilename(): string | null {
  ensureUploadsDir();
  const files = fs
    .readdirSync(getUploadsDir())
    .filter((file) => file.startsWith("background."));
  return files[0] ?? null;
}

export function removeBackgroundFiles() {
  ensureUploadsDir();
  for (const file of fs.readdirSync(getUploadsDir())) {
    if (file.startsWith("background.")) {
      fs.unlinkSync(path.join(getUploadsDir(), file));
    }
  }
}

export function getBackgroundPublicUrl(filename: string): string {
  return `/api/uploads/background?file=${encodeURIComponent(path.basename(filename))}`;
}

export function getDashboardLogoFilePath(filename: string): string {
  const safeName = path.basename(filename);
  if (!safeName.startsWith("dashboard-logo.")) {
    throw new Error("Invalid filename");
  }
  return path.join(getUploadsDir(), safeName);
}

export function findDashboardLogoFilename(): string | null {
  ensureUploadsDir();
  const files = fs
    .readdirSync(getUploadsDir())
    .filter((file) => file.startsWith("dashboard-logo."));
  return files[0] ?? null;
}

export function removeDashboardLogoFiles() {
  ensureUploadsDir();
  for (const file of fs.readdirSync(getUploadsDir())) {
    if (file.startsWith("dashboard-logo.")) {
      fs.unlinkSync(path.join(getUploadsDir(), file));
    }
  }
}

export function getDashboardLogoPublicUrl(filename: string): string {
  return `/api/uploads/logo?file=${encodeURIComponent(path.basename(filename))}`;
}

export function getServiceIconsDir(): string {
  return path.join(getUploadsDir(), "icons");
}

export function ensureServiceIconsDir() {
  const dir = getServiceIconsDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function getServiceIconFilename(serviceId: number, ext: string): string {
  return `service-${serviceId}${ext}`;
}

export function getServiceIconFilePath(serviceId: number, filename: string): string {
  const safeName = path.basename(filename);
  const expectedPrefix = `service-${serviceId}.`;
  if (!safeName.startsWith(expectedPrefix)) {
    throw new Error("Invalid filename");
  }
  return path.join(getServiceIconsDir(), safeName);
}

export function removeServiceIconFiles(serviceId: number) {
  ensureServiceIconsDir();
  const prefix = `service-${serviceId}.`;
  for (const file of fs.readdirSync(getServiceIconsDir())) {
    if (file.startsWith(prefix)) {
      fs.unlinkSync(path.join(getServiceIconsDir(), file));
    }
  }
}

export function getServiceIconPublicUrl(serviceId: number, filename: string): string {
  return `/api/uploads/icon?serviceId=${serviceId}&file=${encodeURIComponent(path.basename(filename))}`;
}
