import { describe, expect, it } from 'vitest';

import { RsvpSchema } from '@/lib/schemas/rsvp';

describe('RsvpSchema', () => {
    const base = {
        slug: 'my-card',
        name: 'Alice',
        email: 'alice@example.com',
        attending: 'yes' as const,
    };

    it('accepts minimal required fields', () => {
        const result = RsvpSchema.safeParse(base);
        expect(result.success).toBe(true);
        expect(result.data?.guests).toBe(0);
    });

    it('accepts all optional fields', () => {
        const result = RsvpSchema.safeParse({
            ...base,
            guests: 2,
            message: 'Looking forward to it!',
        });
        expect(result.success).toBe(true);
        expect(result.data?.guests).toBe(2);
    });

    it('rejects empty slug', () => {
        const result = RsvpSchema.safeParse({ ...base, slug: '' });
        expect(result.success).toBe(false);
    });

    it('rejects empty name', () => {
        const result = RsvpSchema.safeParse({ ...base, name: '' });
        expect(result.success).toBe(false);
    });

    it('rejects invalid email', () => {
        const result = RsvpSchema.safeParse({ ...base, email: 'not-an-email' });
        expect(result.success).toBe(false);
    });

    it('rejects invalid attending value', () => {
        const result = RsvpSchema.safeParse({ ...base, attending: 'perhaps' });
        expect(result.success).toBe(false);
    });

    it('accepts all attending enum values', () => {
        for (const attending of ['yes', 'no', 'maybe'] as const) {
            const result = RsvpSchema.safeParse({ ...base, attending });
            expect(result.success).toBe(true);
        }
    });

    it('rejects guests > 20', () => {
        const result = RsvpSchema.safeParse({ ...base, guests: 21 });
        expect(result.success).toBe(false);
    });

    it('rejects guests < 0', () => {
        const result = RsvpSchema.safeParse({ ...base, guests: -1 });
        expect(result.success).toBe(false);
    });

    it('coerces string guests to number', () => {
        const result = RsvpSchema.safeParse({ ...base, guests: '3' });
        expect(result.success).toBe(true);
        expect(result.data?.guests).toBe(3);
    });

    it('rejects message longer than 1000 chars', () => {
        const result = RsvpSchema.safeParse({ ...base, message: 'x'.repeat(1001) });
        expect(result.success).toBe(false);
    });

    it('accepts message of exactly 1000 chars', () => {
        const result = RsvpSchema.safeParse({ ...base, message: 'x'.repeat(1000) });
        expect(result.success).toBe(true);
    });
});
