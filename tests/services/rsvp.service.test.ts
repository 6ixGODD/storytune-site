/**
 * @file tests/services/rsvp.service.test.ts
 * Integration-style unit tests for `rsvpService.submit`.
 *
 * All external dependencies (repository, mail, rate limiter, quota) are mocked
 * so the tests focus exclusively on the orchestration logic inside the service:
 *   - Card lookup and 404 handling
 *   - Rate-limit enforcement (429)
 *   - Quota enforcement (429)
 *   - Successful submission path (email sent, request recorded)
 *   - Correct data forwarded to `sendRsvpNotification`
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('@/lib/repositories/card.repository', () => ({
    cardRepository: {
        findActiveBySlug: vi.fn(),
    },
}));

vi.mock('@/lib/infra/mail', () => ({
    sendRsvpNotification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/infra/rate-limit', () => ({
    checkRateLimit: vi.fn().mockReturnValue(true),
}));

vi.mock('@/lib/infra/quota', () => ({
    checkQuota: vi.fn().mockReturnValue(true),
    recordRequest: vi.fn(),
}));

import { CARD_STATUS, DEFAULT_CARD_QUOTA, DEFAULT_CARD_RATE_LIMIT } from '@/lib/constants';
import { Card, CardProps } from '@/lib/entities/card';
import { sendRsvpNotification } from '@/lib/infra/mail';
import { checkQuota, recordRequest } from '@/lib/infra/quota';
import { checkRateLimit } from '@/lib/infra/rate-limit';
import { cardRepository } from '@/lib/repositories/card.repository';
import { RsvpInput, rsvpService } from '@/lib/services/rsvp.service';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeActiveCard(overrides: Partial<CardProps> = {}): Card {
    const now = new Date();
    return new Card({
        id: 'bbbb000000000000000000bb',
        slug: 'alice-wedding',
        clientName: 'Alice',
        clientEmail: 'alice@example.com',
        cardUrl: '/card/alice-wedding',
        title: 'Alice & Bob Wedding',
        eventType: 'Wedding',
        notes: undefined,
        inviteeCount: 0,
        invitees: [],
        status: CARD_STATUS.ACTIVE,
        rateLimit: { ...DEFAULT_CARD_RATE_LIMIT },
        quota: { ...DEFAULT_CARD_QUOTA },
        requestCount: 0,
        createdAt: now,
        updatedAt: now,
        ...overrides,
    });
}

const VALID_INPUT: RsvpInput = {
    slug: 'alice-wedding',
    name: 'Charlie',
    email: 'charlie@guest.com',
    attending: 'yes',
    guests: 0,
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('rsvpService.submit()', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default: card exists, rate limit and quota pass
        vi.mocked(cardRepository.findActiveBySlug).mockResolvedValue(makeActiveCard());
        vi.mocked(checkRateLimit).mockReturnValue(true);
        vi.mocked(checkQuota).mockReturnValue(true);
        vi.mocked(sendRsvpNotification).mockResolvedValue(undefined);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    // ── Card lookup ───────────────────────────────────────────────────────────

    it('returns 404 when no card is found for the given slug', async () => {
        vi.mocked(cardRepository.findActiveBySlug).mockResolvedValue(null);

        const result = await rsvpService.submit(VALID_INPUT);

        expect(result).toEqual({ success: false, error: 'Invitation not found', status: 404 });
    });

    it('calls findActiveBySlug with the correct slug', async () => {
        await rsvpService.submit(VALID_INPUT);

        expect(cardRepository.findActiveBySlug).toHaveBeenCalledWith('alice-wedding');
    });

    // ── Rate limiting ─────────────────────────────────────────────────────────

    it('returns 429 when the rate limit is exceeded', async () => {
        vi.mocked(checkRateLimit).mockReturnValue(false);

        const result = await rsvpService.submit(VALID_INPUT);

        expect(result).toEqual({ success: false, error: 'Too many requests', status: 429 });
    });

    it('calls checkRateLimit with the card slug and its rateLimit config', async () => {
        const card = makeActiveCard({ rateLimit: { windowMs: 30_000, maxRequests: 100 } });
        vi.mocked(cardRepository.findActiveBySlug).mockResolvedValue(card);

        await rsvpService.submit(VALID_INPUT);

        expect(checkRateLimit).toHaveBeenCalledWith('alice-wedding', 30_000, 100);
    });

    it('does not send an email when rate-limited', async () => {
        vi.mocked(checkRateLimit).mockReturnValue(false);

        await rsvpService.submit(VALID_INPUT);

        expect(sendRsvpNotification).not.toHaveBeenCalled();
    });

    it('does not record a request when rate-limited', async () => {
        vi.mocked(checkRateLimit).mockReturnValue(false);

        await rsvpService.submit(VALID_INPUT);

        expect(recordRequest).not.toHaveBeenCalled();
    });

    // ── Quota enforcement ─────────────────────────────────────────────────────

    it('returns 429 when the lifetime quota is exceeded', async () => {
        vi.mocked(checkQuota).mockReturnValue(false);

        const result = await rsvpService.submit(VALID_INPUT);

        expect(result).toEqual({ success: false, error: 'Too many requests', status: 429 });
    });

    it('calls checkQuota with the loaded card entity', async () => {
        const card = makeActiveCard();
        vi.mocked(cardRepository.findActiveBySlug).mockResolvedValue(card);

        await rsvpService.submit(VALID_INPUT);

        expect(checkQuota).toHaveBeenCalledWith(card);
    });

    it('does not send an email when quota is exceeded', async () => {
        vi.mocked(checkQuota).mockReturnValue(false);

        await rsvpService.submit(VALID_INPUT);

        expect(sendRsvpNotification).not.toHaveBeenCalled();
    });

    it('does not record a request when quota is exceeded', async () => {
        vi.mocked(checkQuota).mockReturnValue(false);

        await rsvpService.submit(VALID_INPUT);

        expect(recordRequest).not.toHaveBeenCalled();
    });

    // ── Successful submission ─────────────────────────────────────────────────

    it('returns { success: true } on a fully valid submission', async () => {
        const result = await rsvpService.submit(VALID_INPUT);

        expect(result).toEqual({ success: true });
    });

    it('calls sendRsvpNotification on the success path', async () => {
        await rsvpService.submit(VALID_INPUT);

        expect(sendRsvpNotification).toHaveBeenCalledOnce();
    });

    it('forwards the correct data to sendRsvpNotification', async () => {
        const card = makeActiveCard();
        vi.mocked(cardRepository.findActiveBySlug).mockResolvedValue(card);

        await rsvpService.submit({ ...VALID_INPUT, message: 'Looking forward to it!' });

        expect(sendRsvpNotification).toHaveBeenCalledWith({
            clientName: 'Alice',
            clientEmail: 'alice@example.com',
            cardTitle: 'Alice & Bob Wedding',
            cardUrl: '/card/alice-wedding',
            guestName: 'Charlie',
            guestEmail: 'charlie@guest.com',
            attending: 'yes',
            guests: 0,
            message: 'Looking forward to it!',
        });
    });

    it('calls recordRequest with the card slug on success', async () => {
        await rsvpService.submit(VALID_INPUT);

        expect(recordRequest).toHaveBeenCalledWith('alice-wedding');
    });

    it('calls recordRequest before awaiting sendRsvpNotification (fire-and-forget ordering)', async () => {
        // recordRequest is synchronous (fire-and-forget); verify it is called during submission
        const callOrder: string[] = [];
        vi.mocked(recordRequest).mockImplementation(() => {
            callOrder.push('recordRequest');
        });
        vi.mocked(sendRsvpNotification).mockImplementation(async () => {
            callOrder.push('sendRsvpNotification');
        });

        await rsvpService.submit(VALID_INPUT);

        expect(callOrder).toEqual(['recordRequest', 'sendRsvpNotification']);
    });

    // ── Attending variants ────────────────────────────────────────────────────

    it('succeeds with attending=no', async () => {
        const result = await rsvpService.submit({ ...VALID_INPUT, attending: 'no' });
        expect(result).toEqual({ success: true });
    });

    it('succeeds with attending=maybe', async () => {
        const result = await rsvpService.submit({ ...VALID_INPUT, attending: 'maybe' });
        expect(result).toEqual({ success: true });
    });

    // ── Error propagation ─────────────────────────────────────────────────────

    it('propagates errors thrown by sendRsvpNotification', async () => {
        vi.mocked(sendRsvpNotification).mockRejectedValueOnce(new Error('Resend API down'));

        await expect(rsvpService.submit(VALID_INPUT)).rejects.toThrow('Resend API down');
    });

    it('does not call sendRsvpNotification when card is not found', async () => {
        vi.mocked(cardRepository.findActiveBySlug).mockResolvedValue(null);

        await rsvpService.submit(VALID_INPUT);

        expect(sendRsvpNotification).not.toHaveBeenCalled();
    });
});
