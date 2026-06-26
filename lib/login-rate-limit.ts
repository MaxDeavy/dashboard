const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 5 * 60 * 1000;

interface AttemptState {
  failures: number;
  windowStartedAt: number;
  lockedUntil: number;
}

const attemptsByIp = new Map<string, AttemptState>();

function getState(ip: string): AttemptState {
  const existing = attemptsByIp.get(ip);
  if (existing) return existing;

  const created: AttemptState = {
    failures: 0,
    windowStartedAt: Date.now(),
    lockedUntil: 0,
  };
  attemptsByIp.set(ip, created);
  return created;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function checkLoginRateLimit(ip: string): {
  allowed: boolean;
  retryAfterSec?: number;
} {
  const now = Date.now();
  const state = getState(ip);

  if (state.lockedUntil > now) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((state.lockedUntil - now) / 1000),
    };
  }

  if (now - state.windowStartedAt > WINDOW_MS) {
    state.failures = 0;
    state.windowStartedAt = now;
    state.lockedUntil = 0;
  }

  return { allowed: true };
}

export function recordLoginFailure(ip: string): void {
  const now = Date.now();
  const state = getState(ip);

  if (now - state.windowStartedAt > WINDOW_MS) {
    state.failures = 0;
    state.windowStartedAt = now;
  }

  state.failures += 1;

  if (state.failures >= MAX_ATTEMPTS) {
    state.lockedUntil = now + LOCKOUT_MS;
    state.failures = 0;
    state.windowStartedAt = now;
  }
}

export function clearLoginAttempts(ip: string): void {
  attemptsByIp.delete(ip);
}
