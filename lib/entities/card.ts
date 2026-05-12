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

import { CARD_STATUS, CardStatus } from '@/lib/constants';

/** A single invitee entry associated with a card. */
export interface Invitee {
    name?: string;
    email: string;
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
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
        this.deletedAt = props.deletedAt;
    }

    /**
     * Instantiate a brand-new active card.
     *
     * Generates a random ID, sets the canonical `cardUrl`, computes `inviteeCount`,
     * and stamps both `createdAt` and `updatedAt` to `now`.
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
        patch: Partial<Pick<CardProps, 'clientName' | 'clientEmail' | 'title' | 'eventType' | 'notes' | 'invitees'>>,
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
    'slug' | 'clientName' | 'clientEmail' | 'inviteeCount' | 'cardUrl' | 'status' | 'createdAt' | 'title' | 'eventType'
>;
