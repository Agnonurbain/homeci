import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  checkRateLimit,
  withRateLimit,
  RateLimitError,
  clearAllRateLimits,
  clearRateLimit,
  DEFAULT_LIMITS,
  type RateLimitConfig,
} from '../rateLimiter';

describe('rateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-12T12:00:00Z'));
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('checkRateLimit', () => {
    it('allows requests when under the limit', () => {
      const config: RateLimitConfig = { maxRequests: 3, windowMs: 60000 };
      const result1 = checkRateLimit('test', config);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(2);

      const result2 = checkRateLimit('test', config);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(1);

      const result3 = checkRateLimit('test', config);
      expect(result3.allowed).toBe(true);
      expect(result3.remaining).toBe(0);
    });

    it('blocks requests when limit is exceeded', () => {
      const config: RateLimitConfig = { maxRequests: 2, windowMs: 60000 };
      checkRateLimit('test', config);
      checkRateLimit('test', config);

      const result = checkRateLimit('test', config);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfterMs).toBeGreaterThan(0);
    });

    it('resets after the window expires', () => {
      const config: RateLimitConfig = { maxRequests: 2, windowMs: 60000 };
      checkRateLimit('test', config);
      checkRateLimit('test', config);

      // Advance time past the window
      vi.advanceTimersByTime(61000);

      const result = checkRateLimit('test', config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
    });

    it('returns infinity when no config is found', () => {
      const result = checkRateLimit('unknown_action');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(Infinity);
    });

    it('tracks different actions independently', () => {
      const config: RateLimitConfig = { maxRequests: 1, windowMs: 60000 };
      checkRateLimit('action_a', config);

      // action_a is limited, but action_b should still be allowed
      const resultA = checkRateLimit('action_a', config);
      expect(resultA.allowed).toBe(false);

      const resultB = checkRateLimit('action_b', config);
      expect(resultB.allowed).toBe(true);
    });
  });

  describe('withRateLimit', () => {
    it('executes the function when allowed', async () => {
      const config: RateLimitConfig = { maxRequests: 1, windowMs: 60000 };
      const fn = vi.fn(async () => 'success');

      const result = await withRateLimit('test', fn, config);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('throws RateLimitError when limit exceeded', async () => {
      const config: RateLimitConfig = { maxRequests: 1, windowMs: 60000 };
      const fn = vi.fn(async () => 'success');

      await withRateLimit('test', fn, config);

      await expect(withRateLimit('test', fn, config))
        .rejects.toThrow(RateLimitError);
      expect(fn).toHaveBeenCalledTimes(1); // Should not have been called again
    });

    it('RateLimitError contains action and retryAfterMs', async () => {
      const config: RateLimitConfig = { maxRequests: 1, windowMs: 60000 };
      const fn = vi.fn(async () => 'success');

      await withRateLimit('test', fn, config);

      try {
        await withRateLimit('test', fn, config);
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
        expect((error as RateLimitError).action).toBe('test');
        expect((error as RateLimitError).retryAfterMs).toBeGreaterThan(0);
      }
    });
  });

  describe('clearAllRateLimits', () => {
    it('removes all rate limit data', () => {
      const config: RateLimitConfig = { maxRequests: 10, windowMs: 60000 };
      checkRateLimit('test_a', config);
      checkRateLimit('test_b', config);

      // Verify data exists
      expect(localStorage.getItem('homeci_rate_limit_test_a')).toBeTruthy();
      expect(localStorage.getItem('homeci_rate_limit_test_b')).toBeTruthy();

      clearAllRateLimits();

      expect(localStorage.getItem('homeci_rate_limit_test_a')).toBeNull();
      expect(localStorage.getItem('homeci_rate_limit_test_b')).toBeNull();
    });

    it('does not remove non-rate-limit data', () => {
      localStorage.setItem('other_data', 'value');
      clearAllRateLimits();
      expect(localStorage.getItem('other_data')).toBe('value');
    });
  });

  describe('clearRateLimit', () => {
    it('removes rate limit for specific action', () => {
      const config: RateLimitConfig = { maxRequests: 1, windowMs: 60000 };
      checkRateLimit('test', config);
      expect(checkRateLimit('test', config).allowed).toBe(false);

      clearRateLimit('test');

      // Should be allowed again
      expect(checkRateLimit('test', config).allowed).toBe(true);
    });
  });

  describe('DEFAULT_LIMITS', () => {
    it('has reasonable defaults for common actions', () => {
      expect(DEFAULT_LIMITS.visit_request).toBeDefined();
      expect(DEFAULT_LIMITS.visit_request.maxRequests).toBe(5);

      expect(DEFAULT_LIMITS.chat_message).toBeDefined();
      expect(DEFAULT_LIMITS.chat_message.maxRequests).toBe(30);

      expect(DEFAULT_LIMITS.report_submit).toBeDefined();
      expect(DEFAULT_LIMITS.report_submit.maxRequests).toBe(3);

      expect(DEFAULT_LIMITS.login_attempt).toBeDefined();
      expect(DEFAULT_LIMITS.login_attempt.maxRequests).toBe(5);

      expect(DEFAULT_LIMITS.password_reset).toBeDefined();
      expect(DEFAULT_LIMITS.password_reset.maxRequests).toBe(2);
    });
  });
});
