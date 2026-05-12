import { Db } from 'mongodb';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { CARD_STATUS, DB_COLLECTIONS } from '@/lib/constants';
import { clientPromise } from '@/lib/db/client';
import { cardRepository } from '@/lib/repositories/card.repository';

import { clearCollections, getTestDb } from './helpers';

let db: Db;

const baseInput = {
    slug: 'test-card',
    clientName: 'Jane Doe',
    clientEmail: 'jane@example.com',
    invitees: [{ email: 'a@b.com' }, { email: 'c@d.com' }],
};

beforeEach(async () => {
    db = await getTestDb();
    await clearCollections(db, DB_COLLECTIONS.CARDS);
});

afterAll(async () => {
    const client = await clientPromise;
    await client.close();
});

describe('cardRepository', () => {
    describe('create()', () => {
        it('inserts a card and returns the entity with correct fields', async () => {
            const card = await cardRepository.create(baseInput);

            expect(card.slug).toBe('test-card');
            expect(card.clientName).toBe('Jane Doe');
            expect(card.clientEmail).toBe('jane@example.com');
            expect(card.cardUrl).toBe('/card/test-card');
            expect(card.status).toBe(CARD_STATUS.ACTIVE);
            expect(card.inviteeCount).toBe(2);
            expect(card.invitees).toHaveLength(2);
        });

        it('stores a non-empty MongoDB ObjectId as the entity id', async () => {
            const card = await cardRepository.create(baseInput);
            expect(card.id).toMatch(/^[0-9a-f]{24}$/);
        });

        it('sets createdAt and updatedAt to recent dates', async () => {
            const before = new Date();
            const card = await cardRepository.create(baseInput);
            const after = new Date();

            expect(card.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
            expect(card.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
            expect(card.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
        });

        it('stores optional fields when supplied', async () => {
            const card = await cardRepository.create({
                ...baseInput,
                title: 'My Wedding',
                eventType: 'wedding',
                notes: 'RSVP by March',
            });
            expect(card.title).toBe('My Wedding');
            expect(card.eventType).toBe('wedding');
            expect(card.notes).toBe('RSVP by March');
        });
    });

    describe('findBySlug()', () => {
        it('finds a card by slug', async () => {
            await cardRepository.create(baseInput);
            const found = await cardRepository.findBySlug('test-card');
            expect(found).not.toBeNull();
            expect(found!.slug).toBe('test-card');
        });

        it('returns null for a non-existent slug', async () => {
            await expect(cardRepository.findBySlug('ghost')).resolves.toBeNull();
        });

        it('finds a soft-deleted card (any-status lookup)', async () => {
            await cardRepository.create(baseInput);
            await cardRepository.softDelete('test-card');
            const found = await cardRepository.findBySlug('test-card');
            expect(found!.status).toBe(CARD_STATUS.DELETED);
        });
    });

    describe('findActiveBySlug()', () => {
        it('finds an active card', async () => {
            await cardRepository.create(baseInput);
            const found = await cardRepository.findActiveBySlug('test-card');
            expect(found).not.toBeNull();
        });

        it('returns null for a deleted card', async () => {
            await cardRepository.create(baseInput);
            await cardRepository.softDelete('test-card');
            await expect(cardRepository.findActiveBySlug('test-card')).resolves.toBeNull();
        });

        it('returns null for a non-existent slug', async () => {
            await expect(cardRepository.findActiveBySlug('ghost')).resolves.toBeNull();
        });
    });

    describe('list()', () => {
        beforeEach(async () => {
            for (let i = 1; i <= 5; i++) {
                await cardRepository.create({ ...baseInput, slug: `card-${i}` });
            }
        });

        it('returns paginated items and total count', async () => {
            const { items, total } = await cardRepository.list({ page: 1, pageSize: 3 });
            expect(total).toBe(5);
            expect(items).toHaveLength(3);
        });

        it('respects page offset', async () => {
            const { items } = await cardRepository.list({ page: 2, pageSize: 3 });
            expect(items).toHaveLength(2);
        });

        it('excludes deleted cards by default', async () => {
            await cardRepository.softDelete('card-1');
            const { items, total } = await cardRepository.list({ page: 1, pageSize: 10 });
            expect(total).toBe(4);
            expect(items.find((c) => c.slug === 'card-1')).toBeUndefined();
        });

        it('includes deleted cards when includeDeleted is true', async () => {
            await cardRepository.softDelete('card-1');
            const { items, total } = await cardRepository.list({ page: 1, pageSize: 10, includeDeleted: true });
            expect(total).toBe(5);
            expect(items.find((c) => c.slug === 'card-1')).toBeDefined();
        });

        it('returns items sorted by createdAt descending', async () => {
            const { items } = await cardRepository.list({ page: 1, pageSize: 5 });
            const timestamps = items.map((c) => new Date(c.createdAt).getTime());
            const sorted = [...timestamps].sort((a, b) => b - a);
            expect(timestamps).toEqual(sorted);
        });
    });

    describe('update()', () => {
        beforeEach(async () => {
            await cardRepository.create(baseInput);
        });

        it('updates specified fields and returns the updated entity', async () => {
            const updated = await cardRepository.update('test-card', {
                clientName: 'Updated Name',
                title: 'New Title',
            });
            expect(updated).not.toBeNull();
            expect(updated!.clientName).toBe('Updated Name');
            expect(updated!.title).toBe('New Title');
        });

        it('recomputes inviteeCount when invitees are updated', async () => {
            const updated = await cardRepository.update('test-card', {
                invitees: [{ email: 'x@y.com' }],
            });
            expect(updated!.inviteeCount).toBe(1);
        });

        it('preserves fields not included in the patch', async () => {
            const updated = await cardRepository.update('test-card', { clientName: 'Changed' });
            expect(updated!.clientEmail).toBe('jane@example.com');
            expect(updated!.slug).toBe('test-card');
        });

        it('returns null for a non-existent slug', async () => {
            await expect(cardRepository.update('ghost', { clientName: 'X' })).resolves.toBeNull();
        });

        it('refreshes updatedAt', async () => {
            const original = await cardRepository.findBySlug('test-card');
            const updated = await cardRepository.update('test-card', { clientName: 'Y' });
            expect(updated!.updatedAt.getTime()).toBeGreaterThanOrEqual(original!.updatedAt.getTime());
        });
    });

    describe('softDelete()', () => {
        beforeEach(async () => {
            await cardRepository.create(baseInput);
        });

        it('marks the card as deleted and returns true', async () => {
            await expect(cardRepository.softDelete('test-card')).resolves.toBe(true);
            const card = await cardRepository.findBySlug('test-card');
            expect(card!.status).toBe(CARD_STATUS.DELETED);
        });

        it('sets deletedAt on the document', async () => {
            const before = new Date();
            await cardRepository.softDelete('test-card');
            const card = await cardRepository.findBySlug('test-card');
            expect(card!.deletedAt).toBeDefined();
            expect(card!.deletedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
        });

        it('returns false for a non-existent slug', async () => {
            await expect(cardRepository.softDelete('ghost')).resolves.toBe(false);
        });

        it('returns false when called a second time on an already-deleted card', async () => {
            await cardRepository.softDelete('test-card');
            await expect(cardRepository.softDelete('test-card')).resolves.toBe(false);
        });
    });

    describe('upsert()', () => {
        it('creates a new card when the slug does not exist', async () => {
            const card = await cardRepository.upsert(baseInput);
            expect(card.slug).toBe('test-card');
            expect(card.status).toBe(CARD_STATUS.ACTIVE);
        });

        it('updates an existing card when the slug already exists', async () => {
            await cardRepository.create(baseInput);
            const updated = await cardRepository.upsert({
                ...baseInput,
                clientName: 'Updated via Upsert',
            });
            expect(updated.clientName).toBe('Updated via Upsert');
        });

        it('does not create duplicate documents on repeated upsert', async () => {
            await cardRepository.upsert(baseInput);
            await cardRepository.upsert({ ...baseInput, clientName: 'Changed' });
            const { total } = await cardRepository.list({ page: 1, pageSize: 10 });
            expect(total).toBe(1);
        });
    });
});
