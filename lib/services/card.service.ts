/**
 * @file lib/services/card.service.ts
 * Application service for invitation card management.
 *
 * Orchestrates the card upload workflow (ZIP extraction → validation → file deployment
 * → database upsert) and delegates simpler CRUD operations to `cardRepository`.
 *
 * All methods are exposed on the `cardService` module singleton.
 */
import { v4 as uuid4 } from 'uuid';

import { Card, CardSummary, Invitee } from '@/lib/entities/card';
import { replaceCardDir } from '@/lib/infra/storage';
import { cleanupTempDir, extractZip, validateDistDir } from '@/lib/infra/zip';
import { createLogger } from '@/lib/logger';
import { cardRepository, CreateCardInput, ListCardsOptions, UpdateCardInput } from '@/lib/repositories/card.repository';

const logger = createLogger('card.service');

/** Input for the card upload flow. `slug` defaults to a generated UUID when omitted. */
export interface UploadCardInput extends Omit<CreateCardInput, 'slug' | 'invitees'> {
    slug?: string;
    invitees?: Invitee[];
}

export const cardService = {
    /** Return a paginated list of cards with total count and pagination metadata. */
    async list(
        opts: ListCardsOptions,
    ): Promise<{ items: CardSummary[]; total: number; page: number; pageSize: number }> {
        const { items, total } = await cardRepository.list(opts);
        return { items, total, page: opts.page, pageSize: opts.pageSize };
    },

    /** Retrieve a single card by slug (any status). */
    async getBySlug(slug: string): Promise<Card | null> {
        return cardRepository.findBySlug(slug);
    },

    /** Apply a partial update to a card's metadata fields. */
    async update(slug: string, input: UpdateCardInput): Promise<Card | null> {
        return cardRepository.update(slug, input);
    },

    /**
     * Replace only the dist files for an existing card without touching metadata.
     *
     * @param slug - Slug of the card to update.
     * @param zipBuffer - Raw bytes of the replacement ZIP archive.
     * @throws If the card does not exist, or if extraction/validation/storage fails.
     */
    async replaceZip(slug: string, zipBuffer: Buffer): Promise<Card> {
        let tempDir: string | null = null;
        try {
            const existing = await cardRepository.findBySlug(slug);
            if (!existing) throw new Error('Card not found');
            tempDir = await extractZip(zipBuffer);
            const effectiveDir = await validateDistDir(tempDir);
            await replaceCardDir(slug, effectiveDir);
            tempDir = null;
            const card = await cardRepository.update(slug, {});
            logger.info({ slug }, 'card dist replaced');
            return card!;
        } catch (err) {
            if (tempDir) await cleanupTempDir(tempDir);
            logger.error({ slug, err }, 'card dist replacement failed');
            throw err;
        }
    },

    /** Soft-delete a card by slug. Returns `false` if the card was not found. */
    async softDelete(slug: string): Promise<boolean> {
        return cardRepository.softDelete(slug);
    },

    /**
     * Full card upload pipeline: extract ZIP → validate → deploy dist files → upsert DB record.
     *
     * If a card with the given slug already exists it is updated in place (file directory
     * replaced atomically, DB record patched). A temporary directory is cleaned up on
     * failure; on success, ownership is transferred to the card's permanent directory.
     *
     * @param zipBuffer - Raw bytes of the uploaded ZIP archive.
     * @param input - Card metadata; `slug` is auto-generated with UUID v4 when omitted.
     * @returns The persisted `Card` entity after a successful upload.
     * @throws Rethrows any extraction, validation, or storage error after cleanup.
     */
    async uploadFromZip(zipBuffer: Buffer, input: UploadCardInput): Promise<Card> {
        const slug = input.slug ?? uuid4();
        const invitees = input.invitees ?? [];
        let tempDir: string | null = null;

        try {
            tempDir = await extractZip(zipBuffer);
            const effectiveDir = await validateDistDir(tempDir);
            await replaceCardDir(slug, effectiveDir);
            tempDir = null;
            const card = await cardRepository.upsert({ ...input, slug, invitees });
            logger.info({ slug }, 'card uploaded successfully');
            return card;
        } catch (err) {
            if (tempDir) {
                await cleanupTempDir(tempDir);
            }
            logger.error({ slug, err }, 'card upload failed');
            throw err;
        }
    },
};
