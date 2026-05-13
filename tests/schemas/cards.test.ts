import { describe, expect, it } from 'vitest';

import { CardsListQuerySchema, CardUpdateSchema, CardUploadSchema, InviteeSchema } from '@/lib/schemas/cards';

describe('InviteeSchema', () => {
    it('accepts email only', () => {
        const result = InviteeSchema.safeParse({ email: 'guest@example.com' });
        expect(result.success).toBe(true);
    });

    it('accepts email with optional name', () => {
        const result = InviteeSchema.safeParse({ name: 'Alice', email: 'alice@example.com' });
        expect(result.success).toBe(true);
        expect(result.data).toEqual({ name: 'Alice', email: 'alice@example.com' });
    });

    it('rejects invalid email', () => {
        const result = InviteeSchema.safeParse({ email: 'not-an-email' });
        expect(result.success).toBe(false);
    });

    it('rejects missing email', () => {
        const result = InviteeSchema.safeParse({ name: 'Bob' });
        expect(result.success).toBe(false);
    });
});

describe('CardUploadSchema', () => {
    const base = { clientName: 'Jane Doe', clientEmail: 'jane@example.com' };

    it('accepts minimal required fields', () => {
        const result = CardUploadSchema.safeParse(base);
        expect(result.success).toBe(true);
    });

    it('accepts all optional fields', () => {
        const result = CardUploadSchema.safeParse({
            ...base,
            slug: 'my-card',
            title: 'My Wedding',
            eventType: 'wedding',
            notes: 'A note',
            invitees: [{ email: 'g@example.com' }],
        });
        expect(result.success).toBe(true);
    });

    it('rejects invalid slug (uppercase)', () => {
        const result = CardUploadSchema.safeParse({ ...base, slug: 'My-Card' });
        expect(result.success).toBe(false);
    });

    it('rejects invalid slug (special chars)', () => {
        const result = CardUploadSchema.safeParse({ ...base, slug: 'my_card!' });
        expect(result.success).toBe(false);
    });

    it('accepts slug with hyphens and digits', () => {
        const result = CardUploadSchema.safeParse({ ...base, slug: 'my-card-2024' });
        expect(result.success).toBe(true);
    });

    it('rejects invalid client email', () => {
        const result = CardUploadSchema.safeParse({ clientName: 'Jane', clientEmail: 'bad' });
        expect(result.success).toBe(false);
    });

    it('parses JSON-string invitees', () => {
        const result = CardUploadSchema.safeParse({
            ...base,
            invitees: JSON.stringify([{ email: 'a@b.com' }]),
        });
        expect(result.success).toBe(true);
        expect(result.data?.invitees).toEqual([{ email: 'a@b.com' }]);
    });

    it('handles malformed JSON invitees string as empty array', () => {
        const result = CardUploadSchema.safeParse({ ...base, invitees: 'not-json' });
        expect(result.success).toBe(true);
        expect(result.data?.invitees).toEqual([]);
    });
});

describe('CardUpdateSchema', () => {
    it('accepts an empty patch (all optional)', () => {
        const result = CardUpdateSchema.safeParse({});
        expect(result.success).toBe(true);
    });

    it('accepts partial clientName update', () => {
        const result = CardUpdateSchema.safeParse({ clientName: 'New Name' });
        expect(result.success).toBe(true);
    });

    it('rejects blank clientName', () => {
        const result = CardUpdateSchema.safeParse({ clientName: '' });
        expect(result.success).toBe(false);
    });

    it('rejects invalid clientEmail', () => {
        const result = CardUpdateSchema.safeParse({ clientEmail: 'not-valid' });
        expect(result.success).toBe(false);
    });

    it('accepts invitees array', () => {
        const result = CardUpdateSchema.safeParse({ invitees: [{ email: 'x@y.com' }] });
        expect(result.success).toBe(true);
    });

    it('accepts valid rateLimit patch', () => {
        const result = CardUpdateSchema.safeParse({ rateLimit: { windowMs: 60_000, maxRequests: 100 } });
        expect(result.success).toBe(true);
        expect(result.data?.rateLimit).toEqual({ windowMs: 60_000, maxRequests: 100 });
    });

    it('rejects rateLimit with windowMs below 1000', () => {
        const result = CardUpdateSchema.safeParse({ rateLimit: { windowMs: 500, maxRequests: 100 } });
        expect(result.success).toBe(false);
    });

    it('rejects rateLimit with maxRequests below 1', () => {
        const result = CardUpdateSchema.safeParse({ rateLimit: { windowMs: 60_000, maxRequests: 0 } });
        expect(result.success).toBe(false);
    });

    it('accepts valid quota patch', () => {
        const result = CardUpdateSchema.safeParse({ quota: { maxRequests: 500_000 } });
        expect(result.success).toBe(true);
        expect(result.data?.quota).toEqual({ maxRequests: 500_000 });
    });

    it('rejects quota with maxRequests below 1', () => {
        const result = CardUpdateSchema.safeParse({ quota: { maxRequests: 0 } });
        expect(result.success).toBe(false);
    });
});

describe('CardsListQuerySchema', () => {
    it('returns defaults when nothing is supplied', () => {
        const result = CardsListQuerySchema.safeParse({});
        expect(result.success).toBe(true);
        expect(result.data).toMatchObject({ page: 1, pageSize: 20, includeDeleted: false });
    });

    it('coerces string numbers', () => {
        const result = CardsListQuerySchema.safeParse({ page: '2', pageSize: '10' });
        expect(result.success).toBe(true);
        expect(result.data?.page).toBe(2);
        expect(result.data?.pageSize).toBe(10);
    });

    it('rejects page < 1', () => {
        const result = CardsListQuerySchema.safeParse({ page: 0 });
        expect(result.success).toBe(false);
    });

    it('rejects pageSize > 100', () => {
        const result = CardsListQuerySchema.safeParse({ pageSize: 101 });
        expect(result.success).toBe(false);
    });

    it('coerces includeDeleted from string "true"', () => {
        const result = CardsListQuerySchema.safeParse({ includeDeleted: 'true' });
        expect(result.success).toBe(true);
        expect(result.data?.includeDeleted).toBe(true);
    });
});
