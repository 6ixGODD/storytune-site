import { beforeEach, describe, expect, it } from 'vitest';

import { INSPIRATION_STATUS } from '@/lib/constants';
import { Inspiration } from '@/lib/entities/inspiration';

const base = {
    slug: 'test-inspiration',
    title: 'Floral Wedding',
    category: 'Wedding',
    coverPath: 'assets/hero.jpg',
};

describe('Inspiration entity', () => {
    describe('Inspiration.create()', () => {
        it('creates an active inspiration with required fields', () => {
            const insp = Inspiration.create(base);

            expect(insp.slug).toBe('test-inspiration');
            expect(insp.title).toBe('Floral Wedding');
            expect(insp.category).toBe('Wedding');
            expect(insp.coverPath).toBe('assets/hero.jpg');
            expect(insp.status).toBe(INSPIRATION_STATUS.ACTIVE);
            expect(insp.inspirationUrl).toBe('/inspiration/test-inspiration');
            expect(insp.tags).toEqual([]);
            expect(insp.preview).toBe(false);
        });

        it('generates a unique 24-char hex id', () => {
            const insp = Inspiration.create(base);
            expect(insp.id).toMatch(/^[0-9a-f]{24}$/);
        });

        it('generates unique ids for different instances', () => {
            const a = Inspiration.create(base);
            const b = Inspiration.create({ ...base, slug: 'b' });
            expect(a.id).not.toBe(b.id);
        });

        it('sets createdAt and updatedAt to the same recent time', () => {
            const before = new Date();
            const insp = Inspiration.create(base);
            const after = new Date();

            expect(insp.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
            expect(insp.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
            expect(insp.createdAt.getTime()).toBe(insp.updatedAt.getTime());
        });

        it('stores optional tags array', () => {
            const insp = Inspiration.create({ ...base, tags: ['floral', 'pastel'] });
            expect(insp.tags).toEqual(['floral', 'pastel']);
        });

        it('accepts preview: true', () => {
            const insp = Inspiration.create({ ...base, preview: true });
            expect(insp.preview).toBe(true);
        });

        it('stores optional description', () => {
            const insp = Inspiration.create({ ...base, description: 'Nice card' });
            expect(insp.description).toBe('Nice card');
        });

        it('does not set deletedAt', () => {
            const insp = Inspiration.create(base);
            expect(insp.deletedAt).toBeUndefined();
        });
    });

    describe('isActive()', () => {
        it('returns true for a newly created inspiration', () => {
            expect(Inspiration.create(base).isActive()).toBe(true);
        });

        it('returns false for a soft-deleted inspiration', () => {
            expect(Inspiration.create(base).softDelete().isActive()).toBe(false);
        });
    });

    describe('coverUrl()', () => {
        it('returns the full relative URL to the cover asset', () => {
            const insp = Inspiration.create({ ...base, coverPath: 'assets/hero.jpg' });
            expect(insp.coverUrl()).toBe('/inspiration/test-inspiration/assets/hero.jpg');
        });

        it('works with nested paths', () => {
            const insp = Inspiration.create({ ...base, slug: 'my-card', coverPath: 'images/cover.webp' });
            expect(insp.coverUrl()).toBe('/inspiration/my-card/images/cover.webp');
        });
    });

    describe('softDelete()', () => {
        let insp: Inspiration;

        beforeEach(() => {
            insp = Inspiration.create(base);
        });

        it('returns a new instance (immutability)', () => {
            expect(insp.softDelete()).not.toBe(insp);
        });

        it('does not mutate the original', () => {
            insp.softDelete();
            expect(insp.status).toBe(INSPIRATION_STATUS.ACTIVE);
            expect(insp.deletedAt).toBeUndefined();
        });

        it('sets status to DELETED', () => {
            expect(insp.softDelete().status).toBe(INSPIRATION_STATUS.DELETED);
        });

        it('stamps deletedAt with a recent date', () => {
            const before = new Date();
            const deleted = insp.softDelete();
            const after = new Date();
            expect(deleted.deletedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
            expect(deleted.deletedAt!.getTime()).toBeLessThanOrEqual(after.getTime());
        });

        it('refreshes updatedAt', () => {
            const deleted = insp.softDelete();
            expect(deleted.updatedAt.getTime()).toBeGreaterThanOrEqual(insp.updatedAt.getTime());
        });

        it('preserves all other fields', () => {
            const deleted = insp.softDelete();
            expect(deleted.id).toBe(insp.id);
            expect(deleted.slug).toBe(insp.slug);
            expect(deleted.title).toBe(insp.title);
        });
    });

    describe('withUpdates()', () => {
        let insp: Inspiration;

        beforeEach(() => {
            insp = Inspiration.create({ ...base, tags: ['original'], preview: false });
        });

        it('returns a new instance (immutability)', () => {
            expect(insp.withUpdates({ title: 'New' })).not.toBe(insp);
        });

        it('does not mutate the original', () => {
            insp.withUpdates({ title: 'New' });
            expect(insp.title).toBe('Floral Wedding');
        });

        it('applies title patch', () => {
            expect(insp.withUpdates({ title: 'Updated Title' }).title).toBe('Updated Title');
        });

        it('applies category patch', () => {
            expect(insp.withUpdates({ category: 'Birthday' }).category).toBe('Birthday');
        });

        it('applies tags patch', () => {
            const updated = insp.withUpdates({ tags: ['a', 'b', 'c'] });
            expect(updated.tags).toEqual(['a', 'b', 'c']);
        });

        it('applies preview patch', () => {
            expect(insp.withUpdates({ preview: true }).preview).toBe(true);
        });

        it('applies coverPath patch', () => {
            expect(insp.withUpdates({ coverPath: 'assets/new.png' }).coverPath).toBe('assets/new.png');
        });

        it('refreshes updatedAt', () => {
            const updated = insp.withUpdates({ title: 'X' });
            expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(insp.updatedAt.getTime());
        });

        it('preserves unchanged fields', () => {
            const updated = insp.withUpdates({ title: 'X' });
            expect(updated.id).toBe(insp.id);
            expect(updated.slug).toBe(insp.slug);
            expect(updated.status).toBe(insp.status);
            expect(updated.inspirationUrl).toBe(insp.inspirationUrl);
        });
    });
});
