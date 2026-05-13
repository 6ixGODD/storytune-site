/**
 * @file lib/infra/quota.ts
 * Per-card lifetime request quota enforcement.
 *
 * Quota checking is split from the rate limiter because the quota counter must
 * survive process restarts — it is persisted in MongoDB via `requestCount` on
 * the card document.  To avoid a synchronous DB write on every request the
 * increment is fired asynchronously (fire-and-forget), while the quota check
 * uses the value already loaded from DB during the card lookup.
 *
 * @example
 * ```ts
 * import { checkQuota, recordRequest } from '@/lib/infra/quota';
 *
 * const card = await cardRepository.findActiveBySlug(slug);
 * if (!checkQuota(card)) {
 *     return new Response('Quota Exceeded', { status: 429 });
 * }
 * recordRequest(card.slug); // fire-and-forget DB increment
 * ```
 */
import { Card } from '@/lib/entities/card';
import { createLogger } from '@/lib/logger';
import { cardRepository } from '@/lib/repositories/card.repository';

const logger = createLogger('infra.quota');

/**
 * Check whether the card still has quota remaining.
 *
 * Uses the `requestCount` value already present on the loaded `card` entity —
 * no additional DB round-trip is needed.  The check is intentionally slightly
 * optimistic: under concurrent load a handful of requests may slip through
 * above the limit because increments are asynchronous. For an abuse-prevention
 * backstop this trade-off is acceptable.
 *
 * @param card - The fully loaded `Card` entity (must include `requestCount` and `quota`).
 * @returns `true` when the card is within quota; `false` when the limit is reached.
 */
export function checkQuota(card: Card): boolean {
    return card.requestCount < card.quota.maxRequests;
}

/**
 * Asynchronously increment the persisted request counter for a card.
 *
 * This is intentionally fire-and-forget — do **not** `await` it on the hot
 * request path. Errors are logged but not propagated to the caller.
 *
 * @param slug - Unique card slug.
 */
export function recordRequest(slug: string): void {
    cardRepository.incrementRequestCount(slug).catch((err) => {
        logger.error({ slug, err }, 'failed to increment request count');
    });
}
