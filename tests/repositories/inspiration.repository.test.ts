import { Db } from 'mongodb';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { DB_COLLECTIONS, INSPIRATION_STATUS } from '@/lib/constants';
import { clientPromise } from '@/lib/db/client';
import { inspirationRepository } from '@/lib/repositories/inspiration.repository';

import { clearCollections, getTestDb } from './helpers';

let db: Db;

const baseInput = {
    slug: 'floral-wedding',
    title: 'Floral Wedding',
    category: 'Wedding',
    tags: ['floral', 'pastel'],
    coverPath: 'assets/hero.jpg',
    preview: false,
};

beforeEach(async () => {
    db = await getTestDb();
    await clearCollections(db, DB_COLLECTIONS.INSPIRATIONS);
});

afterAll(async () => {
    const client = await clientPromise;
    await client.close();
});

describe('inspirationRepository', () => {
    describe('create()', () => {
        it('inserts a document and returns the entity with correct fields', async () => {
            const insp = await inspirationRepository.create(baseInput);

            expect(insp.slug).toBe('floral-wedding');
            expect(insp.title).toBe('Floral Wedding');
            expect(insp.category).toBe('Wedding');
            expect(insp.tags).toEqual(['floral', 'pastel']);
            expect(insp.coverPath).toBe('assets/hero.jpg');
            expect(insp.preview).toBe(false);
            expect(insp.status).toBe(INSPIRATION_STATUS.ACTIVE);
            expect(insp.inspirationUrl).toBe('/inspiration/floral-wedding');
        });

        it('assigns a valid 24-char hex id', async () => {
            const insp = await inspirationRepository.create(baseInput);
            expect(insp.id).toMatch(/^[0-9a-f]{24}$/);
        });

        it('stores createdAt and updatedAt as recent dates', async () => {
            const before = new Date();
            const insp = await inspirationRepository.create(baseInput);
            const after = new Date();

            expect(insp.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
            expect(insp.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
        });

        it('stores optional description', async () => {
            const insp = await inspirationRepository.create({ ...baseInput, description: 'Nice card' });
            expect(insp.description).toBe('Nice card');
        });
    });

    describe('findBySlug()', () => {
        it('returns the entity for an existing slug', async () => {
            await inspirationRepository.create(baseInput);
            const found = await inspirationRepository.findBySlug('floral-wedding');
            expect(found).not.toBeNull();
            expect(found!.slug).toBe('floral-wedding');
        });

        it('returns null for a non-existent slug', async () => {
            await expect(inspirationRepository.findBySlug('ghost')).resolves.toBeNull();
        });

        it('returns a soft-deleted inspiration (any-status lookup)', async () => {
            await inspirationRepository.create(baseInput);
            await inspirationRepository.softDelete('floral-wedding');
            const found = await inspirationRepository.findBySlug('floral-wedding');
            expect(found!.status).toBe(INSPIRATION_STATUS.DELETED);
        });
    });

    describe('findActiveBySlug()', () => {
        it('finds an active inspiration', async () => {
            await inspirationRepository.create(baseInput);
            const found = await inspirationRepository.findActiveBySlug('floral-wedding');
            expect(found).not.toBeNull();
        });

        it('returns null for a deleted inspiration', async () => {
            await inspirationRepository.create(baseInput);
            await inspirationRepository.softDelete('floral-wedding');
            await expect(inspirationRepository.findActiveBySlug('floral-wedding')).resolves.toBeNull();
        });

        it('returns null for a non-existent slug', async () => {
            await expect(inspirationRepository.findActiveBySlug('ghost')).resolves.toBeNull();
        });
    });

    describe('list()', () => {
        beforeEach(async () => {
            await inspirationRepository.create({ ...baseInput, slug: 'wedding-1', category: 'Wedding' });
            await inspirationRepository.create({ ...baseInput, slug: 'wedding-2', category: 'Wedding' });
            await inspirationRepository.create({ ...baseInput, slug: 'birthday-1', category: 'Birthday' });
            await inspirationRepository.create({ ...baseInput, slug: 'birthday-2', category: 'Birthday' });
            await inspirationRepository.create({ ...baseInput, slug: 'general-1', category: 'General' });
        });

        it('returns all active items with total count', async () => {
            const { items, total } = await inspirationRepository.list({ page: 1, pageSize: 10 });
            expect(total).toBe(5);
            expect(items).toHaveLength(5);
        });

        it('paginates correctly', async () => {
            const { items, total } = await inspirationRepository.list({ page: 1, pageSize: 2 });
            expect(total).toBe(5);
            expect(items).toHaveLength(2);
            const { items: page2 } = await inspirationRepository.list({ page: 2, pageSize: 2 });
            expect(page2).toHaveLength(2);
        });

        it('filters by category', async () => {
            const { items, total } = await inspirationRepository.list({
                page: 1,
                pageSize: 10,
                category: 'Wedding',
            });
            expect(total).toBe(2);
            expect(items.every((i) => i.category === 'Wedding')).toBe(true);
        });

        it('excludes deleted items by default', async () => {
            await inspirationRepository.softDelete('wedding-1');
            const { total } = await inspirationRepository.list({ page: 1, pageSize: 10 });
            expect(total).toBe(4);
        });

        it('includes deleted items when includeDeleted is true', async () => {
            await inspirationRepository.softDelete('wedding-1');
            const { total } = await inspirationRepository.list({ page: 1, pageSize: 10, includeDeleted: true });
            expect(total).toBe(5);
        });

        it('returns items sorted by createdAt descending', async () => {
            const { items } = await inspirationRepository.list({ page: 1, pageSize: 10 });
            const timestamps = items.map((i) => new Date(i.createdAt).getTime());
            expect(timestamps).toEqual([...timestamps].sort((a, b) => b - a));
        });
    });

    describe('findPreview()', () => {
        beforeEach(async () => {
            await inspirationRepository.create({ ...baseInput, slug: 'prev-1', preview: true });
            await inspirationRepository.create({ ...baseInput, slug: 'prev-2', preview: true });
            await inspirationRepository.create({ ...baseInput, slug: 'no-prev', preview: false });
        });

        it('returns only inspirations flagged as preview', async () => {
            const items = await inspirationRepository.findPreview(10);
            expect(items).toHaveLength(2);
            expect(items.every((i) => i.preview)).toBe(true);
        });

        it('respects the limit argument', async () => {
            const items = await inspirationRepository.findPreview(1);
            expect(items).toHaveLength(1);
        });

        it('does not include deleted preview items', async () => {
            await inspirationRepository.softDelete('prev-1');
            const items = await inspirationRepository.findPreview(10);
            expect(items).toHaveLength(1);
            expect(items[0].slug).toBe('prev-2');
        });
    });

    describe('update()', () => {
        beforeEach(async () => {
            await inspirationRepository.create(baseInput);
        });

        it('patches the specified fields and returns updated entity', async () => {
            const updated = await inspirationRepository.update('floral-wedding', {
                title: 'Updated Title',
                category: 'Birthday',
            });
            expect(updated!.title).toBe('Updated Title');
            expect(updated!.category).toBe('Birthday');
        });

        it('updates tags array', async () => {
            const updated = await inspirationRepository.update('floral-wedding', {
                tags: ['modern', 'minimalist'],
            });
            expect(updated!.tags).toEqual(['modern', 'minimalist']);
        });

        it('flips preview flag', async () => {
            const updated = await inspirationRepository.update('floral-wedding', { preview: true });
            expect(updated!.preview).toBe(true);
        });

        it('preserves fields not included in the patch', async () => {
            const updated = await inspirationRepository.update('floral-wedding', { title: 'X' });
            expect(updated!.coverPath).toBe('assets/hero.jpg');
            expect(updated!.category).toBe('Wedding');
        });

        it('returns null for a non-existent slug', async () => {
            await expect(inspirationRepository.update('ghost', { title: 'X' })).resolves.toBeNull();
        });

        it('refreshes updatedAt', async () => {
            const original = await inspirationRepository.findBySlug('floral-wedding');
            const updated = await inspirationRepository.update('floral-wedding', { title: 'Y' });
            expect(updated!.updatedAt.getTime()).toBeGreaterThanOrEqual(original!.updatedAt.getTime());
        });
    });

    describe('softDelete()', () => {
        beforeEach(async () => {
            await inspirationRepository.create(baseInput);
        });

        it('marks as deleted and returns true', async () => {
            await expect(inspirationRepository.softDelete('floral-wedding')).resolves.toBe(true);
            const insp = await inspirationRepository.findBySlug('floral-wedding');
            expect(insp!.status).toBe(INSPIRATION_STATUS.DELETED);
        });

        it('sets deletedAt', async () => {
            const before = new Date();
            await inspirationRepository.softDelete('floral-wedding');
            const insp = await inspirationRepository.findBySlug('floral-wedding');
            expect(insp!.deletedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
        });

        it('returns false for a non-existent slug', async () => {
            await expect(inspirationRepository.softDelete('ghost')).resolves.toBe(false);
        });

        it('returns false when called a second time on an already-deleted item', async () => {
            await inspirationRepository.softDelete('floral-wedding');
            await expect(inspirationRepository.softDelete('floral-wedding')).resolves.toBe(false);
        });
    });

    describe('upsert()', () => {
        it('creates a new inspiration when the slug does not exist', async () => {
            const insp = await inspirationRepository.upsert(baseInput);
            expect(insp.slug).toBe('floral-wedding');
            expect(insp.status).toBe(INSPIRATION_STATUS.ACTIVE);
        });

        it('updates an existing inspiration when the slug already exists', async () => {
            await inspirationRepository.create(baseInput);
            const updated = await inspirationRepository.upsert({ ...baseInput, title: 'Updated via Upsert' });
            expect(updated.title).toBe('Updated via Upsert');
        });

        it('does not create duplicate documents', async () => {
            await inspirationRepository.upsert(baseInput);
            await inspirationRepository.upsert({ ...baseInput, title: 'Changed' });
            const { total } = await inspirationRepository.list({ page: 1, pageSize: 10 });
            expect(total).toBe(1);
        });
    });
});
