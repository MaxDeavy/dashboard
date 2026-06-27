import type { NextRequest } from "next/server";
import { getCookieSecure } from "@/lib/env";

function readExplicitOrigin(): string | undefined {
  const value =
    process.env.APP_URL?.trim() || process.env.PUBLIC_URL?.trim();
  return value?.replace(/\/$/, "") || undefined;
}

function isLocalBindHost(host: string): boolean {
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  return (
    hostname === "0.0.0.0" ||
    hostname === "127.0.0.1" ||
    hostname === "localhost" ||
    hostname === "[::1]"
  );
}

function resolveProtocol(
  request: Request | NextRequest,
  forwardedProto: string | null,
): string {
  if (forwardedProto === "https" || forwardedProto === "http") {
    return forwardedProto;
  }

  if ("nextUrl" in request) {
    const protocol = request.nextUrl.protocol.replace(":", "");
    if (protocol === "https" || protocol === "http") {
      return protocol;
    }
  }

  const urlProtocol = new URL(request.url).protocol.replace(":", "");
  return urlProtocol === "https" ? "https" : "http";
}

function resolveHost(request: Request | NextRequest): string | null {
  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  if (forwardedHost && !isLocalBindHost(forwardedHost)) {
    return forwardedHost;
  }

  const hostHeader = request.headers.get("host")?.trim();
  if (hostHeader && !isLocalBindHost(hostHeader)) {
    return hostHeader;
  }

  if ("nextUrl" in request) {
    const nextHost = request.nextUrl.host;
    if (nextHost && !isLocalBindHost(nextHost)) {
      return nextHost;
    }
  }

  const urlHost = new URL(request.url).host;
  if (urlHost && !isLocalBindHost(urlHost)) {
    return urlHost;
  }

  return hostHeader || forwardedHost || null;
}

/** Öffentliche Origin für Redirects (Proxy/Docker-sicher). */
export function getRequestOrigin(request: Request | NextRequest): string {
  const explicit = readExplicitOrigin();
  if (explicit) return explicit;

  const host = resolveHost(request);
  const protocol = resolveProtocol(
    request,
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? null,
  );

  if (host) {
    return `${protocol}://${host}`;
  }

  return "http://localhost";
}

export function buildRequestUrl(
  request: Request | NextRequest,
  path: string,
): URL {
  return new URL(path, `${getRequestOrigin(request)}/`);
}

export function isSecureRequest(request: Request | NextRequest): boolean {
  if (getCookieSecure()) return true;

  const forwarded = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  if (forwarded === "https") return true;

  return getRequestOrigin(request).startsWith("https://");
}
