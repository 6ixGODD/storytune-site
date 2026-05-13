/**
 * @file tests/infra/rate-limit.test.ts
 * Unit tests for the in-memory fixed-window rate limiter.
 *
 * Fake timers are used to control `Date.now()` so window-reset behaviour can be
 * exercised without actually sleeping.  Each test uses a unique key to avoid
 * interference with the module-level store shared across tests in the same file.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { checkRateLimit } from '@/lib/infra/rate-limit';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Unique-enough key generator to keep tests independent from each other. */
let keyCounter = 0;
function uniqueKey(label: string): string {
    return `rl-test-${label}-${++keyCounter}`;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('checkRateLimit()', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('allows the very first request for a brand-new key', () => {
        expect(checkRateLimit(uniqueKey('first'), 60_000, 5)).toBe(true);
    });

    it('allows all requests up to maxRequests within the window', () => {
        const key = uniqueKey('up-to-max');
        const max = 5;

        for (let i = 0; i < max; i++) {
            expect(checkRateLimit(key, 60_000, max)).toBe(true);
        }
    });

    it('blocks the (maxRequests + 1)th request in the same window', () => {
        const key = uniqueKey('block');
        const max = 3;

        for (let i = 0; i < max; i++) {
            checkRateLimit(key, 60_000, max);
        }

        expect(checkRateLimit(key, 60_000, max)).toBe(false);
    });

    it('continues to block further requests while in the same window', () => {
        const key = uniqueKey('block-persist');
        const max = 2;

        for (let i = 0; i < max; i++) {
            checkRateLimit(key, 60_000, max);
        }

        expect(checkRateLimit(key, 60_000, max)).toBe(false);
        expect(checkRateLimit(key, 60_000, max)).toBe(false);
        expect(checkRateLimit(key, 60_000, max)).toBe(false);
    });

    it('resets the counter and allows requests again after the window expires', () => {
        const key = uniqueKey('reset');
        const windowMs = 60_000;
        const max = 3;

        // Exhaust the window
        for (let i = 0; i < max; i++) {
            checkRateLimit(key, windowMs, max);
        }
        expect(checkRateLimit(key, windowMs, max)).toBe(false);

        // Advance past the window boundary
        vi.advanceTimersByTime(windowMs + 1);

        expect(checkRateLimit(key, windowMs, max)).toBe(true);
    });

    it('does not reset when the window has not yet expired', () => {
        const key = uniqueKey('no-early-reset');
        const windowMs = 60_000;
        const max = 2;

        for (let i = 0; i < max; i++) {
            checkRateLimit(key, windowMs, max);
        }
        expect(checkRateLimit(key, windowMs, max)).toBe(false);

        // Advance to just before the window ends
        vi.advanceTimersByTime(windowMs - 1);

        expect(checkRateLimit(key, windowMs, max)).toBe(false);
    });

    it('allows a new full window of requests after reset', () => {
        const key = uniqueKey('full-window-after-reset');
        const windowMs = 60_000;
        const max = 3;

        // Exhaust first window
        for (let i = 0; i < max; i++) {
            checkRateLimit(key, windowMs, max);
        }
        vi.advanceTimersByTime(windowMs + 1);

        // Should be able to make max requests in the new window
        for (let i = 0; i < max; i++) {
            expect(checkRateLimit(key, windowMs, max)).toBe(true);
        }
        expect(checkRateLimit(key, windowMs, max)).toBe(false);
    });

    it('tracks different keys independently — exhausting one does not affect the other', () => {
        const keyA = uniqueKey('indep-a');
        const keyB = uniqueKey('indep-b');
        const max = 3;

        // Exhaust keyA
        for (let i = 0; i < max; i++) {
            checkRateLimit(keyA, 60_000, max);
        }
        expect(checkRateLimit(keyA, 60_000, max)).toBe(false);

        // keyB is still untouched
        expect(checkRateLimit(keyB, 60_000, max)).toBe(true);
    });

    it('works correctly with a maxRequests of 1', () => {
        const key = uniqueKey('max-one');

        expect(checkRateLimit(key, 60_000, 1)).toBe(true);
        expect(checkRateLimit(key, 60_000, 1)).toBe(false);
    });
});
