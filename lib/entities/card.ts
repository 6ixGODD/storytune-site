/**
 * @file lib/entities/card.ts
 * `Card` domain entity — the rich model for a customer invitation card.
 *
 * Encapsulates all card state and lifecycle transitions. Instances are immutable;
 * mutation methods (`softDelete`, `withUpdates`) return new instances.
 *
 * The `id` field is a random hex string generated at creation time, decoupled from
 * MongoDB's `ObjectId`.
 */
import { randomBytes } from 'node:crypto';

import { CARD_STATUS, CardStatus, DEFAULT_CARD_QUOTA, DEFAULT_CARD_RATE_LIMIT } from '@/lib/constants';

/** A single invitee entry associated with a card. */
export interface Invitee {
    name?: string;
    email: string;
}

/**
 * Per-card rate-limit configuration.
 *
 * Requests to the card's public endpoints are measured in fixed time windows.
 * When the count within a window exceeds `maxRequests` the server returns 429.
 */
export interface CardRateLimit {
    /** Length of the rate-limit window in milliseconds. */
    windowMs: number;
    /** Maximum number of qualifying requests allowed per window. */
    maxRequests: number;
}

/**
 * Per-card quota configuration.
 *
 * The quota caps the **lifetime** total of qualifying requests for a card.
 * Once `requestCount` reaches `maxRequests` the server returns 429.
 */
export interface CardQuota {
    /** Maximum number of lifetime requests allowed for this card. */
    maxRequests: number;
}

/** Plain-data bag used to construct or reconstruct a `Card` instance. */
export interface CardProps {
    id: string;
    slug: string;
    clientName: string;
    clientEmail: string;
    title?: string;
    eventType?: string;
    notes?: string;
    cardUrl: string;
    inviteeCount: number;
    invitees: Invitee[];
    status: CardStatus;
    /** Rate-limit settings for public endpoints of this card. */
    rateLimit: CardRateLimit;
    /** Lifetime quota settings for this card. */
    quota: CardQuota;
    /** Running total of qualifying requests served for this card (persisted in DB). */
    requestCount: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

/**
 * Rich domain model for an invitation card.
 *
 * Use `Card.create()` to instantiate new cards and `Card.fromPersisted()` / the
 * repository's `toEntity()` helper to rehydrate from stored documents.
 */
export class Card {
    readonly id: string;
    readonly slug: string;
    readonly clientName: string;
    readonly clientEmail: string;
    readonly title?: string;
    readonly eventType?: string;
    readonly notes?: string;
    readonly cardUrl: string;
    readonly inviteeCount: number;
    readonly invitees: Invitee[];
    readonly status: CardStatus;
    readonly rateLimit: CardRateLimit;
    readonly quota: CardQuota;
    readonly requestCount: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt?: Date;

    constructor(props: CardProps) {
        this.id = props.id;
        this.slug = props.slug;
        this.clientName = props.clientName;
        this.clientEmail = props.clientEmail;
        this.title = props.title;
        this.eventType = props.eventType;
        this.notes = props.notes;
        this.cardUrl = props.cardUrl;
        this.inviteeCount = props.inviteeCount;
        this.invitees = props.invitees;
        this.status = props.status;
        this.rateLimit = props.rateLimit;
        this.quota = props.quota;
        this.requestCount = props.requestCount;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
        this.deletedAt = props.deletedAt;
    }

    /**
     * Instantiate a brand-new active card.
     *
     * Generates a random ID, sets the canonical `cardUrl`, computes `inviteeCount`,
     * stamps both `createdAt` and `updatedAt` to `now`, and applies the global
     * default rate-limit and quota constants.
     *
     * @param input - Required and optional fields for the new card.
     * @returns A new `Card` instance with `status = ACTIVE`.
     */
    static create(input: {
        slug: string;
        clientName: string;
        clientEmail: string;
        title?: string;
        eventType?: string;
        notes?: string;
        invitees?: Invitee[];
    }): Card {
        const now = new Date();
        const invitees = input.invitees ?? [];

        return new Card({
            id: randomBytes(12).toString('hex'),
            ...input,
            cardUrl: `/card/${input.slug}`,
            invitees,
            inviteeCount: invitees.length,
            status: CARD_STATUS.ACTIVE,
            rateLimit: { ...DEFAULT_CARD_RATE_LIMIT },
            quota: { ...DEFAULT_CARD_QUOTA },
            requestCount: 0,
            createdAt: now,
            updatedAt: now,
        });
    }

    /**
     * Check whether the card is currently live.
     *
     * @returns `true` if `status === CARD_STATUS.ACTIVE`.
     */
    isActive(): boolean {
        return this.status === CARD_STATUS.ACTIVE;
    }

    /**
     * Check whether this card has exceeded its lifetime quota.
     *
     * @returns `true` when `requestCount` has reached or exceeded `quota.maxRequests`.
     */
    isQuotaExceeded(): boolean {
        return this.requestCount >= this.quota.maxRequests;
    }

    /**
     * Mark the card as deleted (soft delete).
     *
     * Returns a **new** instance with `status = DELETED`, `deletedAt = now`, and a
     * refreshed `updatedAt`. The original instance is not mutated.
     *
     * @returns New `Card` instance in the deleted state.
     */
    softDelete(): Card {
        const now = new Date();
        return new Card({ ...this.toProps(), status: CARD_STATUS.DELETED, deletedAt: now, updatedAt: now });
    }

    /**
     * Apply a partial update to the card.
     *
     * Returns a **new** instance with the supplied fields merged in. Automatically
     * recomputes `inviteeCount` whenever `invitees` is included in the patch, and
     * refreshes `updatedAt`.
     *
     * @param patch - Fields to update; only the supplied keys are changed.
     * @returns New `Card` instance with the patch applied.
     */
    withUpdates(
        patch: Partial<
            Pick<
                CardProps,
                'clientName' | 'clientEmail' | 'title' | 'eventType' | 'notes' | 'invitees' | 'rateLimit' | 'quota'
            >
        >,
    ): Card {
        const invitees = patch.invitees ?? this.invitees;

        return new Card({
            ...this.toProps(),
            ...patch,
            invitees,
            inviteeCount: invitees.length,
            updatedAt: new Date(),
        });
    }

    private toProps(): CardProps {
        return {
            id: this.id,
            slug: this.slug,
            clientName: this.clientName,
            clientEmail: this.clientEmail,
            title: this.title,
            eventType: this.eventType,
            notes: this.notes,
            cardUrl: this.cardUrl,
            inviteeCount: this.inviteeCount,
            invitees: this.invitees,
            status: this.status,
            rateLimit: this.rateLimit,
            quota: this.quota,
            requestCount: this.requestCount,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            deletedAt: this.deletedAt,
        };
    }
}

/**
 * Lightweight projection of a `Card` returned by list endpoints.
 * Omits the full `invitees` array and per-card notes to reduce payload size.
 */
export type CardSummary = Pick<
    Card,
    | 'slug'
    | 'clientName'
    | 'clientEmail'
    | 'inviteeCount'
    | 'cardUrl'
    | 'status'
    | 'createdAt'
    | 'title'
    | 'eventType'
    | 'rateLimit'
    | 'quota'
    | 'requestCount'
>;
