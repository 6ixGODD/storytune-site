import { beforeEach, describe, expect, it } from 'vitest';

import { CARD_STATUS } from '@/lib/constants';
import { Card } from '@/lib/entities/card';

describe('Card entity', () => {
    describe('Card.create()', () => {
        it('creates an active card with required fields', () => {
            const card = Card.create({
                slug: 'test-card',
                clientName: 'Jane Doe',
                clientEmail: 'jane@example.com',
            });

            expect(card.slug).toBe('test-card');
            expect(card.clientName).toBe('Jane Doe');
            expect(card.clientEmail).toBe('jane@example.com');
            expect(card.status).toBe(CARD_STATUS.ACTIVE);
            expect(card.cardUrl).toBe('/card/test-card');
            expect(card.invitees).toEqual([]);
            expect(card.inviteeCount).toBe(0);
        });

        it('generates a non-empty hex id', () => {
            const card = Card.create({ slug: 's', clientName: 'N', clientEmail: 'n@e.com' });
            expect(card.id).toMatch(/^[0-9a-f]{24}$/);
        });

        it('generates unique ids for different instances', () => {
            const a = Card.create({ slug: 'a', clientName: 'A', clientEmail: 'a@e.com' });
            const b = Card.create({ slug: 'b', clientName: 'B', clientEmail: 'b@e.com' });
            expect(a.id).not.toBe(b.id);
        });

        it('sets createdAt and updatedAt to the same time', () => {
            const before = new Date();
            const card = Card.create({ slug: 's', clientName: 'N', clientEmail: 'n@e.com' });
            const after = new Date();

            expect(card.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
            expect(card.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
            expect(card.createdAt.getTime()).toBe(card.updatedAt.getTime());
        });

        it('computes inviteeCount from supplied invitees', () => {
            const card = Card.create({
                slug: 's',
                clientName: 'N',
                clientEmail: 'n@e.com',
                invitees: [{ email: 'a@b.com' }, { email: 'c@d.com' }],
            });
            expect(card.inviteeCount).toBe(2);
            expect(card.invitees).toHaveLength(2);
        });

        it('stores optional fields', () => {
            const card = Card.create({
                slug: 's',
                clientName: 'N',
                clientEmail: 'n@e.com',
                title: 'My Wedding',
                eventType: 'wedding',
                notes: 'Some note',
            });
            expect(card.title).toBe('My Wedding');
            expect(card.eventType).toBe('wedding');
            expect(card.notes).toBe('Some note');
        });

        it('does not set deletedAt', () => {
            const card = Card.create({ slug: 's', clientName: 'N', clientEmail: 'n@e.com' });
            expect(card.deletedAt).toBeUndefined();
        });
    });

    describe('isActive()', () => {
        it('returns true for a newly created card', () => {
            const card = Card.create({ slug: 's', clientName: 'N', clientEmail: 'n@e.com' });
            expect(card.isActive()).toBe(true);
        });

        it('returns false for a soft-deleted card', () => {
            const card = Card.create({ slug: 's', clientName: 'N', clientEmail: 'n@e.com' });
            expect(card.softDelete().isActive()).toBe(false);
        });
    });

    describe('softDelete()', () => {
        let card: Card;

        beforeEach(() => {
            card = Card.create({ slug: 's', clientName: 'N', clientEmail: 'n@e.com' });
        });

        it('returns a new instance (immutability)', () => {
            const deleted = card.softDelete();
            expect(deleted).not.toBe(card);
        });

        it('does not mutate the original', () => {
            card.softDelete();
            expect(card.status).toBe(CARD_STATUS.ACTIVE);
            expect(card.deletedAt).toBeUndefined();
        });

        it('sets status to DELETED', () => {
            expect(card.softDelete().status).toBe(CARD_STATUS.DELETED);
        });

        it('sets deletedAt to a recent date', () => {
            const before = new Date();
            const deleted = card.softDelete();
            const after = new Date();

            expect(deleted.deletedAt).toBeDefined();
            expect(deleted.deletedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
            expect(deleted.deletedAt!.getTime()).toBeLessThanOrEqual(after.getTime());
        });

        it('refreshes updatedAt', () => {
            const deleted = card.softDelete();
            expect(deleted.updatedAt.getTime()).toBeGreaterThanOrEqual(card.updatedAt.getTime());
        });

        it('preserves other fields', () => {
            const deleted = card.softDelete();
            expect(deleted.id).toBe(card.id);
            expect(deleted.slug).toBe(card.slug);
            expect(deleted.clientName).toBe(card.clientName);
        });
    });

    describe('withUpdates()', () => {
        let card: Card;

        beforeEach(() => {
            card = Card.create({
                slug: 's',
                clientName: 'Original Name',
                clientEmail: 'orig@example.com',
                invitees: [{ email: 'a@b.com' }],
            });
        });

        it('returns a new instance (immutability)', () => {
            expect(card.withUpdates({ clientName: 'New' })).not.toBe(card);
        });

        it('does not mutate the original', () => {
            card.withUpdates({ clientName: 'New' });
            expect(card.clientName).toBe('Original Name');
        });

        it('applies clientName patch', () => {
            const updated = card.withUpdates({ clientName: 'Updated Name' });
            expect(updated.clientName).toBe('Updated Name');
        });

        it('applies clientEmail patch', () => {
            const updated = card.withUpdates({ clientEmail: 'new@example.com' });
            expect(updated.clientEmail).toBe('new@example.com');
        });

        it('recomputes inviteeCount when invitees patch is applied', () => {
            const updated = card.withUpdates({
                invitees: [{ email: 'x@y.com' }, { email: 'a@b.com' }, { email: 'c@d.com' }],
            });
            expect(updated.inviteeCount).toBe(3);
        });

        it('preserves invitees when not in patch', () => {
            const updated = card.withUpdates({ clientName: 'New Name' });
            expect(updated.invitees).toEqual(card.invitees);
            expect(updated.inviteeCount).toBe(1);
        });

        it('refreshes updatedAt', () => {
            const updated = card.withUpdates({ clientName: 'X' });
            expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(card.updatedAt.getTime());
        });

        it('preserves unchanged fields', () => {
            const updated = card.withUpdates({ title: 'My Event' });
            expect(updated.slug).toBe(card.slug);
            expect(updated.id).toBe(card.id);
            expect(updated.status).toBe(card.status);
        });
    });
});
