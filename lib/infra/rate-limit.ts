/**
 * @file lib/infra/rate-limit.ts
 * In-memory fixed-window rate limiter.
 *
 * Tracks request counts per arbitrary string key (typically a card slug) within
 * a rolling fixed time window. No external dependencies — state lives in a
 * module-level `Map` and is naturally reset when the process restarts.
 *
 * @example
 * ```ts
 * import { checkRateLimit } from '@/lib/infra/rate-limit';
 *
 * const allowed = checkRateLimit('my-card-slug', 60_000, 300);
 * if (!allowed) {
 *     return new Response('Too Many Requests', { status: 429 });
 * }
 * ```
 */

interface WindowState {
    count: number;
    windowStart: number;
}

/** Per-key window state. Module-level so it persists across requests in the same process. */
const store = new Map<string, WindowState>();

/**
 * Check (and record) a request against the fixed-window rate limit for `key`.
 *
 * Returns `true` when the request is within the allowed rate; `false` when the
 * limit has been reached for the current window.  Internally increments the
 * counter so consecutive calls accumulate correctly.
 *
 * When the current time falls outside the previous window (`now - windowStart >
 * windowMs`) the counter is reset and a new window begins.
 *
 * @param key         - Unique identifier for the rate-limit bucket (e.g. card slug).
 * @param windowMs    - Window length in milliseconds.
 * @param maxRequests - Maximum number of requests allowed within one window.
 */
export function checkRateLimit(key: string, windowMs: number, maxRequests: number): boolean {
    const now = Date.now();
    const state = store.get(key);

    if (!state || now - state.windowStart > windowMs) {
        store.set(key, { count: 1, windowStart: now });
        return true;
    }

    if (state.count >= maxRequests) {
        return false;
    }

    state.count += 1;
    return true;
}

// ── Stale-entry cleanup ───────────────────────────────────────────────────────
// Remove entries whose window has long expired to prevent unbounded memory growth.
// We use the longest plausible window (1 hour) as the expiry threshold.

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes
const MAX_WINDOW_AGE_MS = 60 * 60 * 1000; // 1 hour

const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, state] of store) {
        if (now - state.windowStart > MAX_WINDOW_AGE_MS) {
            store.delete(key);
        }
    }
}, CLEANUP_INTERVAL_MS);

// Allow the process to exit cleanly even if this timer is active.
cleanupTimer.unref();
