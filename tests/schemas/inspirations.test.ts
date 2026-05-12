import { describe, expect, it } from 'vitest';

import { InspirationsListQuerySchema,InspirationUpdateSchema, InspirationUploadSchema } from '@/lib/schemas/inspirations';

describe('InspirationUploadSchema', () => {
    const base = {
        title: 'Floral Wedding',
        category: 'Wedding',
        coverPath: 'assets/hero.jpg',
    };

    it('accepts minimal required fields', () => {
        const result = InspirationUploadSchema.safeParse(base);
        expect(result.success).toBe(true);
    });

    it('accepts all optional fields', () => {
        const result = InspirationUploadSchema.safeParse({
            ...base,
            slug: 'floral-wedding',
            description: 'A beautiful floral theme',
            tags: ['floral', 'pastel'],
            preview: true,
        });
        expect(result.success).toBe(true);
        expect(result.data?.preview).toBe(true);
    });

    it('rejects empty title', () => {
        const result = InspirationUploadSchema.safeParse({ ...base, title: '' });
        expect(result.success).toBe(false);
    });

    it('rejects empty category', () => {
        const result = InspirationUploadSchema.safeParse({ ...base, category: '' });
        expect(result.success).toBe(false);
    });

    it('rejects empty coverPath', () => {
        const result = InspirationUploadSchema.safeParse({ ...base, coverPath: '' });
        expect(result.success).toBe(false);
    });

    it('rejects invalid slug (uppercase)', () => {
        const result = InspirationUploadSchema.safeParse({ ...base, slug: 'My-Card' });
        expect(result.success).toBe(false);
    });

    it('rejects slug with underscores', () => {
        const result = InspirationUploadSchema.safeParse({ ...base, slug: 'my_card' });
        expect(result.success).toBe(false);
    });

    describe('tags field', () => {
        it('accepts an array of strings', () => {
            const result = InspirationUploadSchema.safeParse({ ...base, tags: ['a', 'b'] });
            expect(result.success).toBe(true);
            expect(result.data?.tags).toEqual(['a', 'b']);
        });

        it('parses a JSON-encoded array string', () => {
            const result = InspirationUploadSchema.safeParse({ ...base, tags: '["floral","pastel"]' });
            expect(result.success).toBe(true);
            expect(result.data?.tags).toEqual(['floral', 'pastel']);
        });

        it('parses a comma-separated string', () => {
            const result = InspirationUploadSchema.safeParse({ ...base, tags: 'floral, pastel, romantic' });
            expect(result.success).toBe(true);
            expect(result.data?.tags).toEqual(['floral', 'pastel', 'romantic']);
        });

        it('omits empty tokens from comma-separated string', () => {
            const result = InspirationUploadSchema.safeParse({ ...base, tags: 'a,,b' });
            expect(result.success).toBe(true);
            expect(result.data?.tags).toEqual(['a', 'b']);
        });
    });

    describe('preview field', () => {
        it('accepts boolean true', () => {
            const result = InspirationUploadSchema.safeParse({ ...base, preview: true });
            expect(result.success).toBe(true);
            expect(result.data?.preview).toBe(true);
        });

        it('accepts boolean false', () => {
            const result = InspirationUploadSchema.safeParse({ ...base, preview: false });
            expect(result.success).toBe(true);
            expect(result.data?.preview).toBe(false);
        });

        it('coerces string "true" to boolean true', () => {
            const result = InspirationUploadSchema.safeParse({ ...base, preview: 'true' });
            expect(result.success).toBe(true);
            expect(result.data?.preview).toBe(true);
        });

        it('coerces string "false" to boolean false', () => {
            const result = InspirationUploadSchema.safeParse({ ...base, preview: 'false' });
            expect(result.success).toBe(true);
            expect(result.data?.preview).toBe(false);
        });
    });
});

describe('InspirationUpdateSchema', () => {
    it('accepts an empty patch (all optional)', () => {
        const result = InspirationUpdateSchema.safeParse({});
        expect(result.success).toBe(true);
    });

    it('accepts title update', () => {
        const result = InspirationUpdateSchema.safeParse({ title: 'New Title' });
        expect(result.success).toBe(true);
    });

    it('rejects blank title', () => {
        const result = InspirationUpdateSchema.safeParse({ title: '' });
        expect(result.success).toBe(false);
    });

    it('rejects blank category', () => {
        const result = InspirationUpdateSchema.safeParse({ category: '' });
        expect(result.success).toBe(false);
    });

    it('rejects blank coverPath', () => {
        const result = InspirationUpdateSchema.safeParse({ coverPath: '' });
        expect(result.success).toBe(false);
    });

    it('accepts tags array', () => {
        const result = InspirationUpdateSchema.safeParse({ tags: ['a', 'b'] });
        expect(result.success).toBe(true);
    });

    it('rejects tags array with empty strings', () => {
        const result = InspirationUpdateSchema.safeParse({ tags: [''] });
        expect(result.success).toBe(false);
    });

    it('accepts preview boolean', () => {
        const result = InspirationUpdateSchema.safeParse({ preview: true });
        expect(result.success).toBe(true);
    });
});

describe('InspirationsListQuerySchema', () => {
    it('returns defaults when nothing is supplied', () => {
        const result = InspirationsListQuerySchema.safeParse({});
        expect(result.success).toBe(true);
        expect(result.data).toMatchObject({ page: 1, pageSize: 20, includeDeleted: false });
    });

    it('passes category through unchanged', () => {
        const result = InspirationsListQuerySchema.safeParse({ category: 'Wedding' });
        expect(result.success).toBe(true);
        expect(result.data?.category).toBe('Wedding');
    });

    it('coerces page and pageSize from strings', () => {
        const result = InspirationsListQuerySchema.safeParse({ page: '3', pageSize: '15' });
        expect(result.success).toBe(true);
        expect(result.data?.page).toBe(3);
        expect(result.data?.pageSize).toBe(15);
    });

    it('rejects page < 1', () => {
        const result = InspirationsListQuerySchema.safeParse({ page: 0 });
        expect(result.success).toBe(false);
    });

    it('rejects pageSize > 100', () => {
        const result = InspirationsListQuerySchema.safeParse({ pageSize: 101 });
        expect(result.success).toBe(false);
    });

    it('coerces includeDeleted from string "true"', () => {
        const result = InspirationsListQuerySchema.safeParse({ includeDeleted: 'true' });
        expect(result.success).toBe(true);
        expect(result.data?.includeDeleted).toBe(true);
    });
});
