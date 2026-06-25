import { AsyncLocalStorage } from "node:async_hooks";
import { Agent, request as undiciRequest } from "undici";
import { shouldSkipTlsVerification } from "@/lib/tls-settings";

export interface ServerFetchOptions extends RequestInit {
  insecureTls?: boolean;
}

const widgetTlsContext = new AsyncLocalStorage<{ insecureTls: boolean }>();

let insecureDispatcher: Agent | undefined;

export function withWidgetFetchContext<T>(
  extraConfig: Record<string, string> | undefined,
  fn: () => Promise<T>,
): Promise<T> {
  return widgetTlsContext.run(
    { insecureTls: extraConfig?.insecureTls === "true" },
    fn,
  );
}

function getInsecureDispatcher(): Agent {
  if (!insecureDispatcher) {
    insecureDispatcher = new Agent({
      connect: {
        rejectUnauthorized: false,
      },
    });
  }

  return insecureDispatcher;
}

function isURLSearchParams(body: unknown): body is URLSearchParams {
  return (
    body instanceof URLSearchParams ||
    Object.prototype.toString.call(body) === "[object URLSearchParams]"
  );
}

function isFormData(body: unknown): body is FormData {
  return (
    typeof FormData !== "undefined" &&
    (body instanceof FormData ||
      Object.prototype.toString.call(body) === "[object FormData]")
  );
}

/** undici akzeptiert nur string/Buffer — niemals URLSearchParams/FormData direkt. */
export function normalizeRequestBody(
  body: RequestInit["body"],
): string | undefined {
  if (body == null) return undefined;
  if (typeof body === "string") return body;
  if (isURLSearchParams(body)) return body.toString();
  if (isFormData(body)) return body.toString();
  if (body instanceof ArrayBuffer) {
    return Buffer.from(body).toString("utf8");
  }
  if (ArrayBuffer.isView(body)) {
    return Buffer.from(body.buffer, body.byteOffset, body.byteLength).toString(
      "utf8",
    );
  }
  if (typeof body === "object" && "toString" in body) {
    const serialized = String(body);
    if (serialized !== "[object Object]") {
      return serialized;
    }
  }
  return String(body);
}

function normalizeOutgoingHeaders(
  headers: RequestInit["headers"],
): Record<string, string> {
  const normalized: Record<string, string> = {};

  if (!headers) return normalized;

  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      normalized[key] = value;
    });
    return normalized;
  }

  if (Array.isArray(headers)) {
    for (const [key, value] of headers) {
      normalized[key] = value;
    }
    return normalized;
  }

  for (const [key, value] of Object.entries(headers)) {
    if (value == null) continue;
    normalized[key] = Array.isArray(value) ? value.join(", ") : String(value);
  }

  return normalized;
}

function flattenIncomingHeaders(
  headers: Record<string, string | string[] | undefined>,
): Record<string, string> {
  const normalized: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    if (value == null) continue;
    normalized[key] = Array.isArray(value) ? value.join(", ") : value;
  }

  return normalized;
}

export async function serverFetch(
  url: string,
  options: ServerFetchOptions = {},
): Promise<Response> {
  const { insecureTls, ...init } = options;
  const widgetContext = widgetTlsContext.getStore()?.insecureTls;
  const skipTls = shouldSkipTlsVerification(insecureTls, widgetContext);
  const dispatcher = skipTls ? getInsecureDispatcher() : undefined;
  const method = (init.method ?? "GET").toUpperCase();
  const headers = normalizeOutgoingHeaders(init.headers);
  const hasBody = init.body != null && method !== "GET" && method !== "HEAD";
  const body = hasBody ? normalizeRequestBody(init.body) : undefined;

  const response = await undiciRequest(url, {
    method,
    headers,
    body,
    signal: init.signal as AbortSignal | undefined,
    dispatcher,
  });

  const status = response.statusCode;
  const responseHeaders = flattenIncomingHeaders(response.headers);

  // Fetch-Spec: 204/205 dürfen keinen Body im Response-Konstruktor haben
  if (status === 204 || status === 205) {
    await response.body.dump();
    return new Response(null, { status, headers: responseHeaders });
  }

  const data = await response.body.arrayBuffer();

  return new Response(data, {
    status,
    headers: responseHeaders,
  });
}
