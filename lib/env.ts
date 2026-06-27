const DEV_SESSION_SECRET =
  "dev-only-set-SESSION_SECRET-in-env-32chars-min";

function isBuildTime(): boolean {
  return (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.npm_lifecycle_event === "build"
  );
}

export function isAppBuildTime(): boolean {
  return isBuildTime();
}

function readOptional(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function readString(name: string, fallback: string): string {
  return readOptional(name) ?? fallback;
}

function readRequiredInProduction(name: string, devFallback: string): string {
  const value = readOptional(name);
  if (value) return value;
  if (process.env.NODE_ENV === "production" && !isBuildTime()) {
    throw new Error(
      `Umgebungsvariable ${name} muss in Production gesetzt sein.`,
    );
  }
  return devFallback;
}

function readBool(name: string, fallback: boolean): boolean {
  const value = readOptional(name)?.toLowerCase();
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function readInt(name: string, fallback: number): number {
  const raw = readOptional(name);
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Client + Server: Präfix für localStorage-Keys */
export function getAppStoragePrefix(): string {
  return (
    process.env.NEXT_PUBLIC_APP_STORAGE_PREFIX?.trim() ||
    readString("APP_STORAGE_PREFIX", "homelab-dashboard")
  );
}

export function getAdminPassword(): string {
  return readRequiredInProduction("ADMIN_PASSWORD", "admin");
}

export function getSessionSecret(): string {
  return readRequiredInProduction("SESSION_SECRET", DEV_SESSION_SECRET);
}

export function getCredentialsEncryptionSecret(): string {
  return readOptional("CREDENTIALS_ENCRYPTION_SECRET") ?? getSessionSecret();
}

export function getCredentialsEncryptionSalt(): string {
  return readString("CREDENTIALS_ENCRYPTION_SALT", "homelab-dashboard-salt");
}

export function getSessionCookieName(): string {
  return readString("SESSION_COOKIE_NAME", "homelab-dashboard-session");
}

export function getSessionMaxAgeSeconds(): number {
  return readInt("SESSION_MAX_AGE_DAYS", 7) * 24 * 60 * 60;
}

export function getCookieSecure(): boolean {
  return readBool("COOKIE_SECURE", false);
}

export function getDatabaseUrl(): string {
  return readString("DATABASE_URL", "file:./data/dashboard.db");
}

export function getPort(): number {
  return readInt("PORT", 3000);
}

export function getHostname(): string {
  return readString("HOSTNAME", "0.0.0.0");
}

export function getMaxBackgroundUploadBytes(): number {
  return readInt("MAX_BACKGROUND_UPLOAD_MB", 5) * 1024 * 1024;
}

export function getMaxLogoUploadBytes(): number {
  return readInt("MAX_LOGO_UPLOAD_MB", 1) * 1024 * 1024;
}

export function getMaxIconUploadBytes(): number {
  return readInt("MAX_ICON_UPLOAD_MB", 1) * 1024 * 1024;
}
