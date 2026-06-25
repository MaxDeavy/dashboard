import { serverFetch, type ServerFetchOptions } from "@/lib/server-fetch";

export interface WidgetField {
  label: string;
  value: string;
  highlight?: boolean;
}

export interface WidgetResult {
  title: string;
  status: "ok" | "error" | "warning";
  fields: WidgetField[];
  error?: string;
}

export interface WidgetCredentials {
  username?: string;
  password?: string;
  apiKey?: string;
  token?: string;
  tokenSecret?: string;
}

export interface WidgetConfigInput {
  widgetType: string;
  apiUrl: string;
  credentials?: WidgetCredentials | null;
  extraConfig?: Record<string, string>;
  credentialsStored?: boolean;
}

const FETCH_TIMEOUT = 5000;

export function credentialString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return credentialString(value[0]);
  return String(value);
}

export function normalizeApiUrl(url: string): string {
  return url
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api2\/json$/i, "");
}

export async function readApiError(response: Response): Promise<string> {
  try {
    const text = await response.text();
    if (!text) {
      return `API: ${response.status}`;
    }

    const data = JSON.parse(text) as {
      message?: string;
      errors?: string | Record<string, string>;
      data?: string;
    };

    if (typeof data.message === "string") {
      return `API: ${response.status} — ${data.message}`;
    }

    if (typeof data.errors === "string") {
      return `API: ${response.status} — ${data.errors}`;
    }

    if (data.errors && typeof data.errors === "object") {
      const first = Object.values(data.errors)[0];
      if (typeof first === "string") {
        return `API: ${response.status} — ${first}`;
      }
    }

    if (typeof data.data === "string" && data.data.length < 120) {
      return `API: ${response.status} — ${data.data}`;
    }
  } catch {
    // ignore parse errors
  }

  return `API: ${response.status}`;
}

export type FetchWithTimeoutOptions = ServerFetchOptions;

export function resolveWidgetTlsOptions(
  options: FetchWithTimeoutOptions,
  extraConfig?: Record<string, string>,
): FetchWithTimeoutOptions {
  if (options.insecureTls === true || extraConfig?.insecureTls === "true") {
    return { ...options, insecureTls: true };
  }

  return options;
}

export async function fetchWithTimeout(
  url: string,
  options: FetchWithTimeoutOptions = {},
  extraConfig?: Record<string, string>,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    return await serverFetch(url, {
      ...resolveWidgetTlsOptions(options, extraConfig),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export function formatBytesPerSec(bytes: number): string {
  if (bytes < 1024) return `${bytes} B/s`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB/s`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB/s`;
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes < 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}
