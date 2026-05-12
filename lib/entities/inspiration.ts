/**
 * @file lib/entities/inspiration.ts
 * `Inspiration` domain entity — a curated directions / gallery card.
 *
 * Inspirations are uploaded as ZIP dist packages (identical mechanism to Cards)
 * but carry gallery-specific metadata: category, tags, a caller-supplied cover
 * image path inside the dist, and a `preview` flag that selects up to three
 * items for the homepage gallery preview section.
 *
 * Like `Card`, instances are immutable; mutation methods return new instances.
 */
import { randomBytes } from 'node:crypto';

import { INSPIRATION_STATUS, InspirationStatus } from '@/lib/constants';

/** Plain-data bag used to construct or reconstruct an `Inspiration` instance. */
export interface InspirationProps {
    id: string;
    slug: string;
    title: string;
    /** Broad grouping used for gallery filtering (e.g. "Wedding", "Birthday"). */
    category: string;
    /** Fine-grained labels (e.g. ["floral", "pastel", "romantic"]). */
    tags: string[];
    /**
     * Relative path to the cover image *within* the dist package.
     * (e.g. `"assets/hero.jpg"` — resolved to `/inspiration/<slug>/assets/hero.jpg`)
     */
    coverPath: string;
    description?: string;
    /** When `true`, this inspiration is eligible for the homepage preview grid. */
    preview: boolean;
    /** Canonical URL — always `/inspiration/<slug>`. */
    inspirationUrl: string;
    status: InspirationStatus;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

/**
 * Rich domain model for a curated inspiration / directions card.
 *
 * Use `Inspiration.create()` for new records and rehydrate from MongoDB docs via
 * the repository's `toEntity()` helper.
 */
export class Inspiration {
    readonly id: string;
    readonly slug: string;
    readonly title: string;
    readonly category: string;
    readonly tags: string[];
    readonly coverPath: string;
    readonly description?: string;
    readonly preview: boolean;
    readonly inspirationUrl: string;
    readonly status: InspirationStatus;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt?: Date;

    constructor(props: InspirationProps) {
        this.id = props.id;
        this.slug = props.slug;
        this.title = props.title;
        this.category = props.category;
        this.tags = props.tags;
        this.coverPath = props.coverPath;
        this.description = props.description;
        this.preview = props.preview;
        this.inspirationUrl = props.inspirationUrl;
        this.status = props.status;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
        this.deletedAt = props.deletedAt;
    }

    /**
     * Instantiate a brand-new active inspiration.
     *
     * @param input - Required and optional fields for the new inspiration.
     * @returns A new `Inspiration` instance with `status = ACTIVE`.
     */
    static create(input: {
        slug: string;
        title: string;
        category: string;
        tags?: string[];
        coverPath: string;
        description?: string;
        preview?: boolean;
    }): Inspiration {
        const now = new Date();
        return new Inspiration({
            id: randomBytes(12).toString('hex'),
            ...input,
            tags: input.tags ?? [],
            preview: input.preview ?? false,
            inspirationUrl: `/inspiration/${input.slug}`,
            status: INSPIRATION_STATUS.ACTIVE,
            createdAt: now,
            updatedAt: now,
        });
    }

    /** Returns `true` if status is ACTIVE. */
    isActive(): boolean {
        return this.status === INSPIRATION_STATUS.ACTIVE;
    }

    /**
     * Returns the full public URL for the cover image.
     *
     * Convenience method; the actual path is stored in `coverPath` and resolved
     * relative to `inspirationUrl`.
     */
    coverUrl(): string {
        return `/inspiration/${this.slug}/${this.coverPath}`;
    }

    /**
     * Mark this inspiration as deleted (soft delete).
     *
     * Returns a new instance — the original is not mutated.
     */
    softDelete(): Inspiration {
        const now = new Date();
        return new Inspiration({
            ...this.toProps(),
            status: INSPIRATION_STATUS.DELETED,
            deletedAt: now,
            updatedAt: now,
        });
    }

    /**
     * Apply a partial update and return a new instance with `updatedAt` refreshed.
     */
    withUpdates(
        patch: Partial<Pick<InspirationProps, 'title' | 'category' | 'tags' | 'coverPath' | 'description' | 'preview'>>,
    ): Inspiration {
        return new Inspiration({ ...this.toProps(), ...patch, updatedAt: new Date() });
    }

    private toProps(): InspirationProps {
        return {
            id: this.id,
            slug: this.slug,
            title: this.title,
            category: this.category,
            tags: this.tags,
            coverPath: this.coverPath,
            description: this.description,
            preview: this.preview,
            inspirationUrl: this.inspirationUrl,
            status: this.status,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            deletedAt: this.deletedAt,
        };
    }
}

/**
 * Lightweight projection returned by list and preview endpoints.
 * Omits heavy fields not needed for card grids.
 */
export type InspirationSummary = Pick<
    Inspiration,
    'slug' | 'title' | 'category' | 'tags' | 'coverPath' | 'description' | 'preview' | 'inspirationUrl' | 'status' | 'createdAt'
>;
