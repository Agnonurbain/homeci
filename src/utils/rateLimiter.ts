/**
 * HOMECI — Client-side Rate Limiter
 *
 * Prevents spam and abuse by limiting how often certain actions can be performed.
 * Uses localStorage for persistence across page reloads.
 */

// ── Configuration ──────────────────────────────────────────────────────────

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the time window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

// Default limits for common actions
export const DEFAULT_LIMITS: Record<string, RateLimitConfig> = {
  // Visit requests: 5 per hour
  visit_request: { maxRequests: 5, windowMs: 60 * 60 * 1000 },
  // Chat messages: 30 per minute (generous for real-time chat)
  chat_message: { maxRequests: 30, windowMs: 60 * 1000 },
  // Report submissions: 3 per hour
  report_submit: { maxRequests: 3, windowMs: 60 * 60 * 1000 },
  // File uploads: 10 per 10 minutes
  file_upload: { maxRequests: 10, windowMs: 10 * 60 * 1000 },
  // Login attempts: 5 per 15 minutes
  login_attempt: { maxRequests: 5, windowMs: 15 * 60 * 1000 },
  // Password reset: 2 per hour
  password_reset: { maxRequests: 2, windowMs: 60 * 60 * 1000 },
  // Property creation: 3 per hour
  property_create: { maxRequests: 3, windowMs: 60 * 60 * 1000 },
};

// ── Storage helpers ────────────────────────────────────────────────────────

const STORAGE_PREFIX = 'homeci_rate_limit_';

function getTimestamps(key: string): number[] {
  try {
    const stored = localStorage.getItem(STORAGE_PREFIX + key);
    if (!stored) return [];
    const timestamps: number[] = JSON.parse(stored);
    // Filter out timestamps older than the window
    return timestamps;
  } catch {
    return [];
  }
}

function saveTimestamps(key: string, timestamps: number[]): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(timestamps));
  } catch {
    // localStorage might be full or disabled — fail silently
    console.warn('[rateLimiter] Failed to save timestamps');
  }
}

// ── Core limiter ───────────────────────────────────────────────────────────

/**
 * Check if an action is allowed based on rate limits
 */
export function checkRateLimit(
  key: string,
  config?: RateLimitConfig
): RateLimitResult {
  const limitConfig = config || DEFAULT_LIMITS[key];
  if (!limitConfig) {
    // No limit configured — allow
    return { allowed: true, remaining: Infinity, retryAfterMs: 0 };
  }

  const now = Date.now();
  const windowStart = now - limitConfig.windowMs;
  const timestamps = getTimestamps(key);

  // Filter timestamps within the current window
  const recentTimestamps = timestamps.filter(t => t > windowStart);

  if (recentTimestamps.length >= limitConfig.maxRequests) {
    // Rate limit exceeded
    const oldestInWindow = recentTimestamps[0];
    const retryAfterMs = oldestInWindow + limitConfig.windowMs - now;
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, retryAfterMs),
    };
  }

  // Record this request
  recentTimestamps.push(now);
  saveTimestamps(key, recentTimestamps);

  return {
    allowed: true,
    remaining: limitConfig.maxRequests - recentTimestamps.length,
    retryAfterMs: 0,
  };
}

/**
 * Execute a function only if the rate limit allows it.
 * Throws a RateLimitError if the limit is exceeded.
 */
export async function withRateLimit<T>(
  key: string,
  fn: () => Promise<T>,
  config?: RateLimitConfig
): Promise<T> {
  const result = checkRateLimit(key, config);

  if (!result.allowed) {
    const error = new RateLimitError(key, result.retryAfterMs);
    throw error;
  }

  return fn();
}

// ── Custom error ───────────────────────────────────────────────────────────

export class RateLimitError extends Error {
  public readonly action: string;
  public readonly retryAfterMs: number;

  constructor(action: string, retryAfterMs: number) {
    const seconds = Math.ceil(retryAfterMs / 1000);
    super(`Rate limit exceeded for "${action}". Retry after ${seconds}s.`);
    this.name = 'RateLimitError';
    this.action = action;
    this.retryAfterMs = retryAfterMs;
  }
}

// ── Cleanup ────────────────────────────────────────────────────────────────

/**
 * Remove all rate limit data from localStorage
 */
export function clearAllRateLimits(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

/**
 * Remove rate limit data for a specific action
 */
export function clearRateLimit(key: string): void {
  localStorage.removeItem(STORAGE_PREFIX + key);
}
