/**
 * @file lib/repositories/inspiration.repository.ts
 * Persistence layer for inspiration / directions gallery cards.
 *
 * Defines the internal `InspirationDocument` MongoDB document shape and exposes
 * the `inspirationRepository` module singleton. All methods return typed domain
 * entities (`Inspiration`, `InspirationSummary`) rather than raw documents.
 *
 * Business logic belongs in `lib/services/inspiration.service.ts`, not here.
 */
import { ObjectId } from 'mongodb';

import { DB_COLLECTIONS, INSPIRATION_STATUS, InspirationStatus } from '@/lib/constants';
import { getDb } from '@/lib/db/client';
import { Inspiration, InspirationSummary } from '@/lib/entities/inspiration';
import { createLogger } from '@/lib/logger';

const logger = createLogger('inspiration.repository');

interface InspirationDocument {
    _id: ObjectId;
    slug: string;
    title: string;
    category: string;
    tags: string[];
    coverPath: string;
    description?: string;
    preview: boolean;
    inspirationUrl: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

function toEntity(doc: InspirationDocument): Inspiration {
    return new Inspiration({
        id: doc._id.toHexString(),
        slug: doc.slug,
        title: doc.title,
        category: doc.category,
        tags: doc.tags,
        coverPath: doc.coverPath,
        description: doc.description,
        preview: doc.preview,
        inspirationUrl: doc.inspirationUrl,
        status: doc.status as InspirationStatus,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        deletedAt: doc.deletedAt,
    });
}

const col = async () => {
    const db = await getDb();
    return db.collection<InspirationDocument>(DB_COLLECTIONS.INSPIRATIONS);
};

/** Options for the paginated inspiration list query. */
export interface ListInspirationsOptions {
    page: number;
    pageSize: number;
    /** Filter by category (exact match). */
    category?: string;
    /** Keyword search across title, category, tags, and description. */
    q?: string;
    includeDeleted?: boolean;
}

/** Input for creating a new inspiration document. */
export interface CreateInspirationInput {
    slug: string;
    title: string;
    category: string;
    tags: string[];
    coverPath: string;
    description?: string;
    preview: boolean;
}

/** Partial fields that can be patched on an existing inspiration. */
export interface UpdateInspirationInput {
    title?: string;
    category?: string;
    tags?: string[];
    coverPath?: string;
    description?: string;
    preview?: boolean;
}

const SUMMARY_PROJECTION = {
    _id: 0,
    slug: 1,
    title: 1,
    category: 1,
    tags: 1,
    coverPath: 1,
    description: 1,
    preview: 1,
    inspirationUrl: 1,
    status: 1,
    createdAt: 1,
} as const;

export const inspirationRepository = {
    /** Fetch a paginated, sorted list of inspirations. Active-only by default. */
    async list(opts: ListInspirationsOptions): Promise<{ items: InspirationSummary[]; total: number }> {
        const { page, pageSize, category, q, includeDeleted } = opts;
        const filter: Record<string, unknown> = includeDeleted ? {} : { status: INSPIRATION_STATUS.ACTIVE };
        if (category) filter.category = category;
        if (q) {
            filter.$or = [
                { title: { $regex: q, $options: 'i' } },
                { category: { $regex: q, $options: 'i' } },
                { tags: { $elemMatch: { $regex: q, $options: 'i' } } },
                { description: { $regex: q, $options: 'i' } },
            ];
        }

        const skip = (page - 1) * pageSize;
        logger.debug({ page, pageSize, category, includeDeleted }, 'list inspirations');

        const c = await col();
        const [items, total] = await Promise.all([
            c
                .find(filter, { projection: SUMMARY_PROJECTION })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(pageSize)
                .toArray() as Promise<InspirationSummary[]>,
            c.countDocuments(filter),
        ]);

        return { items, total };
    },

    /**
     * Fetch up to `limit` active inspirations flagged for homepage preview,
     * ordered by most recently created.
     */
    async findPreview(limit: number): Promise<InspirationSummary[]> {
        const c = await col();
        return c
            .find({ status: INSPIRATION_STATUS.ACTIVE, preview: true }, { projection: SUMMARY_PROJECTION })
            .sort({ createdAt: -1 })
            .limit(limit)
            .toArray() as Promise<InspirationSummary[]>;
    },

    /** Find an inspiration by slug regardless of status. Returns `null` if not found. */
    async findBySlug(slug: string): Promise<Inspiration | null> {
        const c = await col();
        const doc = await c.findOne({ slug });
        return doc ? toEntity(doc) : null;
    },

    /** Find an active inspiration by slug. Returns `null` if not found or deleted. */
    async findActiveBySlug(slug: string): Promise<Inspiration | null> {
        const c = await col();
        const doc = await c.findOne({ slug, status: INSPIRATION_STATUS.ACTIVE });
        return doc ? toEntity(doc) : null;
    },

    /** Insert a new inspiration document and return the resulting entity. */
    async create(input: CreateInspirationInput): Promise<Inspiration> {
        const c = await col();
        const now = new Date();
        const doc: Omit<InspirationDocument, '_id'> = {
            ...input,
            inspirationUrl: `/inspiration/${input.slug}`,
            status: INSPIRATION_STATUS.ACTIVE,
            createdAt: now,
            updatedAt: now,
        };
        const result = await c.insertOne(doc as InspirationDocument);
        logger.info({ slug: input.slug }, 'inspiration created');
        return toEntity({ ...doc, _id: result.insertedId } as InspirationDocument);
    },

    /** Insert or update an inspiration by slug. */
    async upsert(input: CreateInspirationInput): Promise<Inspiration> {
        const existing = await inspirationRepository.findBySlug(input.slug);
        if (existing) {
            return (await inspirationRepository.update(input.slug, input))!;
        }
        return inspirationRepository.create(input);
    },

    /** Apply a partial patch to an existing inspiration and return the updated entity. */
    async update(slug: string, input: UpdateInspirationInput): Promise<Inspiration | null> {
        const c = await col();
        const patch: Record<string, unknown> = { updatedAt: new Date() };

        for (const [key, value] of Object.entries(input)) {
            if (value !== undefined) patch[key] = value;
        }

        const doc = await c.findOneAndUpdate({ slug }, { $set: patch }, { returnDocument: 'after' });
        if (doc) logger.info({ slug }, 'inspiration updated');
        return doc ? toEntity(doc) : null;
    },

    /** Set an inspiration's status to DELETED. Returns `true` if found and updated. */
    async softDelete(slug: string): Promise<boolean> {
        const c = await col();
        const result = await c.updateOne(
            { slug, status: INSPIRATION_STATUS.ACTIVE },
            { $set: { status: INSPIRATION_STATUS.DELETED, deletedAt: new Date(), updatedAt: new Date() } },
        );
        if (result.matchedCount > 0) logger.info({ slug }, 'inspiration soft-deleted');
        return result.matchedCount > 0;
    },

    /** Return all distinct active categories, sorted alphabetically. */
    async findCategories(): Promise<string[]> {
        const c = await col();
        const cats = await c.distinct('category', { status: INSPIRATION_STATUS.ACTIVE });
        return (cats as string[]).filter(Boolean).sort();
    },
};
