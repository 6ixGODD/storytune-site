/**
 * @file tests/infra/quota.test.ts
 * Unit tests for per-card lifetime quota enforcement.
 *
 * `cardRepository` is mocked so no MongoDB connection is needed.
 * `checkQuota` is a pure function; `recordRequest` fires an async DB increment.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── Module mock — must be called before any imports that use these modules ───
vi.mock('@/lib/repositories/card.repository', () => ({
    cardRepository: {
        incrementRequestCount: vi.fn().mockResolvedValue(undefined),
    },
}));

import { CARD_STATUS, DEFAULT_CARD_QUOTA, DEFAULT_CARD_RATE_LIMIT } from '@/lib/constants';
import { Card, CardProps } from '@/lib/entities/card';
import { checkQuota, recordRequest } from '@/lib/infra/quota';
import { cardRepository } from '@/lib/repositories/card.repository';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a Card with the given requestCount and quota.maxRequests. */
function makeCard(requestCount: number, quotaMaxRequests: number = DEFAULT_CARD_QUOTA.maxRequests): Card {
    const now = new Date();
    const props: CardProps = {
        id: 'aaaa000000000000000000aa',
        slug: 'quota-test-card',
        clientName: 'Test Client',
        clientEmail: 'client@test.com',
        cardUrl: '/card/quota-test-card',
        inviteeCount: 0,
        invitees: [],
        status: CARD_STATUS.ACTIVE,
        rateLimit: { ...DEFAULT_CARD_RATE_LIMIT },
        quota: { maxRequests: quotaMaxRequests },
        requestCount,
        createdAt: now,
        updatedAt: now,
    };
    return new Card(props);
}

// ── checkQuota() ──────────────────────────────────────────────────────────────

describe('checkQuota()', () => {
    it('returns true when requestCount is zero', () => {
        expect(checkQuota(makeCard(0, 10))).toBe(true);
    });

    it('returns true when requestCount is one below the limit', () => {
        expect(checkQuota(makeCard(9, 10))).toBe(true);
    });

    it('returns false when requestCount equals the limit', () => {
        expect(checkQuota(makeCard(10, 10))).toBe(false);
    });

    it('returns false when requestCount exceeds the limit', () => {
        expect(checkQuota(makeCard(999, 10))).toBe(false);
    });

    it('respects the default quota constant when constructed via Card.create()', () => {
        const card = Card.create({ slug: 's', clientName: 'N', clientEmail: 'n@e.com' });
        // Fresh card has requestCount = 0 and quota = DEFAULT_CARD_QUOTA
        expect(checkQuota(card)).toBe(true);
    });
});

// ── recordRequest() ───────────────────────────────────────────────────────────

describe('recordRequest()', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('calls cardRepository.incrementRequestCount with the correct slug', async () => {
        recordRequest('my-slug');
        // Drain the microtask queue so the inner promise resolves and the call registers
        await Promise.resolve();
        expect(cardRepository.incrementRequestCount).toHaveBeenCalledOnce();
        expect(cardRepository.incrementRequestCount).toHaveBeenCalledWith('my-slug');
    });

    it('does not throw when incrementRequestCount rejects (fire-and-forget)', async () => {
        vi.mocked(cardRepository.incrementRequestCount).mockRejectedValueOnce(new Error('DB error'));
        expect(() => recordRequest('my-slug')).not.toThrow();
        // Allow the rejection handler to run without bubbling
        await new Promise((r) => setTimeout(r, 0));
    });

    it('can be called multiple times for different slugs', async () => {
        recordRequest('slug-a');
        recordRequest('slug-b');
        await Promise.resolve();
        expect(cardRepository.incrementRequestCount).toHaveBeenCalledTimes(2);
        expect(cardRepository.incrementRequestCount).toHaveBeenCalledWith('slug-a');
        expect(cardRepository.incrementRequestCount).toHaveBeenCalledWith('slug-b');
    });
});
