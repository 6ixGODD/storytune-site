/**
 * @file lib/repositories/card.repository.ts
 * Persistence layer for invitation cards.
 *
 * Defines the internal `CardDocument` MongoDB document shape and exposes the
 * `cardRepository` module singleton — a plain object whose methods map domain
 * operations to MongoDB queries. All methods return typed domain entities (`Card`,
 * `CardSummary`) rather than raw documents.
 *
 * The repository never performs business logic; that belongs in `lib/services/`.
 */
import { ObjectId } from 'mongodb';

import { CARD_STATUS, CardStatus, DB_COLLECTIONS } from '@/lib/constants';
import { getDb } from '@/lib/db/client';
import { Card, CardSummary, Invitee } from '@/lib/entities/card';
import { createLogger } from '@/lib/logger';

const logger = createLogger('card.repository');

interface CardDocument {
    _id: ObjectId;
    slug: string;
    clientName: string;
    clientEmail: string;
    title?: string;
    eventType?: string;
    notes?: string;
    cardUrl: string;
    inviteeCount: number;
    invitees: Invitee[];
    status: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

function toEntity(doc: CardDocument): Card {
    return new Card({
        id: doc._id.toHexString(),
        slug: doc.slug,
        clientName: doc.clientName,
        clientEmail: doc.clientEmail,
        title: doc.title,
        eventType: doc.eventType,
        notes: doc.notes,
        cardUrl: doc.cardUrl,
        inviteeCount: doc.inviteeCount,
        invitees: doc.invitees,
        status: doc.status as CardStatus,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        deletedAt: doc.deletedAt,
    });
}

const col = async () => {
    const db = await getDb();
    return db.collection<CardDocument>(DB_COLLECTIONS.CARDS);
};

/** Options for the paginated card list query. */
export interface ListCardsOptions {
    page: number;
    pageSize: number;
    includeDeleted?: boolean;
}

/** Input for creating a new card document. */
export interface CreateCardInput {
    slug: string;
    clientName: string;
    clientEmail: string;
    title?: string;
    eventType?: string;
    notes?: string;
    invitees: Invitee[];
}

/** Partial fields that can be patched on an existing card. */
export interface UpdateCardInput {
    clientName?: string;
    clientEmail?: string;
    title?: string;
    eventType?: string;
    notes?: string;
    invitees?: Invitee[];
}

const SUMMARY_PROJECTION = {
    _id: 0,
    slug: 1,
    clientName: 1,
    clientEmail: 1,
    inviteeCount: 1,
    cardUrl: 1,
    status: 1,
    createdAt: 1,
    title: 1,
    eventType: 1,
} as const;

export const cardRepository = {
    /** Fetch a paginated, sorted list of cards. Active-only by default. */
    async list(opts: ListCardsOptions): Promise<{ items: CardSummary[]; total: number }> {
        const { page, pageSize, includeDeleted } = opts;
        const filter = includeDeleted ? {} : { status: CARD_STATUS.ACTIVE };
        const skip = (page - 1) * pageSize;

        logger.debug({ page, pageSize, includeDeleted }, 'list cards');

        const c = await col();
        const [items, total] = await Promise.all([
            c
                .find(filter, { projection: SUMMARY_PROJECTION })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(pageSize)
                .toArray() as Promise<CardSummary[]>,
            c.countDocuments(filter),
        ]);

        return { items, total };
    },

    /** Find a card by its unique slug, regardless of status. Returns `null` if not found. */
    async findBySlug(slug: string): Promise<Card | null> {
        const c = await col();
        const doc = await c.findOne({ slug });
        return doc ? toEntity(doc) : null;
    },

    /** Find an active card by slug. Returns `null` if not found or deleted. */
    async findActiveBySlug(slug: string): Promise<Card | null> {
        const c = await col();
        const doc = await c.findOne({ slug, status: CARD_STATUS.ACTIVE });
        return doc ? toEntity(doc) : null;
    },

    /** Insert a new card document and return the resulting entity. */
    async create(input: CreateCardInput): Promise<Card> {
        const c = await col();
        const now = new Date();
        const doc: Omit<CardDocument, '_id'> = {
            ...input,
            cardUrl: `/card/${input.slug}`,
            inviteeCount: input.invitees.length,
            status: CARD_STATUS.ACTIVE,
            createdAt: now,
            updatedAt: now,
        };
        const result = await c.insertOne(doc as CardDocument);
        logger.info({ slug: input.slug }, 'card created');
        return toEntity({ ...doc, _id: result.insertedId } as CardDocument);
    },

    /** Insert or update a card by slug — creates if absent, updates if present. */
    async upsert(input: CreateCardInput): Promise<Card> {
        const existing = await cardRepository.findBySlug(input.slug);
        if (existing) {
            return (await cardRepository.update(input.slug, input))!;
        }
        return cardRepository.create(input);
    },

    /** Apply a partial patch to an existing card and return the updated entity. */
    async update(slug: string, input: UpdateCardInput): Promise<Card | null> {
        const c = await col();
        const patch: Record<string, unknown> = { updatedAt: new Date() };

        for (const [key, value] of Object.entries(input)) {
            if (value !== undefined) {
                patch[key] = value;
                if (key === 'invitees' && Array.isArray(value)) {
                    patch.inviteeCount = value.length;
                }
            }
        }

        const doc = await c.findOneAndUpdate({ slug }, { $set: patch }, { returnDocument: 'after' });
        if (doc) logger.info({ slug }, 'card updated');
        return doc ? toEntity(doc) : null;
    },

    /** Set a card's status to DELETED. Returns `true` if the card was found and updated. */
    async softDelete(slug: string): Promise<boolean> {
        const c = await col();
        const result = await c.updateOne(
            { slug, status: CARD_STATUS.ACTIVE },
            { $set: { status: CARD_STATUS.DELETED, deletedAt: new Date(), updatedAt: new Date() } },
        );
        if (result.matchedCount > 0) logger.info({ slug }, 'card soft-deleted');
        return result.matchedCount > 0;
    },
};
