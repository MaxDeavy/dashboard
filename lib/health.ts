import { fetchWithTimeout } from "@/lib/widgets/base";

export type HealthStatus = "up" | "down" | "unknown";

export interface HealthResult {
  serviceId: number;
  status: HealthStatus;
  responseTime?: number;
  error?: string;
}

const healthCache = new Map<
  number,
  { result: HealthResult; expiresAt: number }
>();

const HEALTH_CACHE_TTL_MS = 60_000;

export function invalidateHealthCache() {
  healthCache.clear();
}

export async function checkServiceHealth(
  serviceId: number,
  url: string,
  insecureTls = false,
): Promise<HealthResult> {
  const cached = healthCache.get(serviceId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result;
  }

  try {
    const start = Date.now();
    const response = await fetchWithTimeout(url, {
      method: "GET",
      redirect: "follow",
      insecureTls,
    });
    const responseTime = Date.now() - start;

    const result: HealthResult = {
      serviceId,
      status: response.ok || response.status < 500 ? "up" : "down",
      responseTime,
    };

    healthCache.set(serviceId, {
      result,
      expiresAt: Date.now() + HEALTH_CACHE_TTL_MS,
    });

    return result;
  } catch (error) {
    const result: HealthResult = {
      serviceId,
      status: "down",
      error: error instanceof Error ? error.message : "Nicht erreichbar",
    };

    healthCache.set(serviceId, {
      result,
      expiresAt: Date.now() + HEALTH_CACHE_TTL_MS,
    });

    return result;
  }
}

export async function checkAllServicesHealth(
  services: Array<{
    id: number;
    healthCheckUrl: string | null;
    insecureTls?: boolean;
  }>,
): Promise<HealthResult[]> {
  return Promise.all(
    services.map((service) => {
      if (!service.healthCheckUrl) {
        return Promise.resolve({
          serviceId: service.id,
          status: "unknown" as const,
        });
      }

      return checkServiceHealth(
        service.id,
        service.healthCheckUrl,
        service.insecureTls ?? false,
      );
    }),
  );
}
