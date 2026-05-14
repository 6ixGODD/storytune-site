/**
 * @file lib/services/inspiration.service.ts
 * Application service for inspiration / directions gallery management.
 *
 * Orchestrates the inspiration upload workflow (ZIP extraction → validation →
 * file deployment → database upsert) and delegates simpler CRUD operations to
 * `inspirationRepository`.
 */
import { v4 as uuid4 } from 'uuid';

import { Inspiration, InspirationSummary } from '@/lib/entities/inspiration';
import { replaceDistDir } from '@/lib/infra/storage';
import { cleanupTempDir, extractZip, validateDistDir } from '@/lib/infra/zip';
import { createLogger } from '@/lib/logger';
import {
    CreateInspirationInput,
    inspirationRepository,
    ListInspirationsOptions,
    UpdateInspirationInput,
} from '@/lib/repositories/inspiration.repository';

const logger = createLogger('inspiration.service');

/** Input for the inspiration upload flow. `slug` and `preview` default when omitted. */
export interface UploadInspirationInput extends Omit<CreateInspirationInput, 'slug'> {
    slug?: string;
}

export const inspirationService = {
    /** Return a paginated list of inspirations with total count and pagination metadata. */
    async list(
        opts: ListInspirationsOptions,
    ): Promise<{ items: InspirationSummary[]; total: number; page: number; pageSize: number }> {
        const { items, total } = await inspirationRepository.list(opts);
        return { items, total, page: opts.page, pageSize: opts.pageSize };
    },

    /**
     * Fetch up to `limit` active inspirations flagged for the homepage preview grid.
     *
     * @param limit - Maximum number of items to return (default: 3).
     */
    async getPreview(limit = 3): Promise<InspirationSummary[]> {
        return inspirationRepository.findPreview(limit);
    },

    /** Retrieve a single inspiration by slug (any status). */
    async getBySlug(slug: string): Promise<Inspiration | null> {
        return inspirationRepository.findBySlug(slug);
    },

    /** Apply a partial update to an inspiration's metadata fields. */
    async update(slug: string, input: UpdateInspirationInput): Promise<Inspiration | null> {
        return inspirationRepository.update(slug, input);
    },

    /**
     * Replace only the dist files for an existing inspiration without touching metadata.
     *
     * @param slug - Slug of the inspiration to update.
     * @param zipBuffer - Raw bytes of the replacement ZIP archive.
     * @throws If the inspiration does not exist, or if extraction/validation/storage fails.
     */
    async replaceZip(slug: string, zipBuffer: Buffer): Promise<Inspiration> {
        let tempDir: string | null = null;
        try {
            const existing = await inspirationRepository.findBySlug(slug);
            if (!existing) throw new Error('Inspiration not found');
            tempDir = await extractZip(zipBuffer);
            const effectiveDir = await validateDistDir(tempDir);
            await replaceDistDir('inspiration', slug, effectiveDir);
            tempDir = null;
            const inspiration = await inspirationRepository.update(slug, {});
            logger.info({ slug }, 'inspiration dist replaced');
            return inspiration!;
        } catch (err) {
            if (tempDir) await cleanupTempDir(tempDir);
            logger.error({ slug, err }, 'inspiration dist replacement failed');
            throw err;
        }
    },

    /** Return all distinct active categories for the sidebar filter. */
    async getCategories(): Promise<string[]> {
        return inspirationRepository.findCategories();
    },

    /** Soft-delete an inspiration by slug. Returns `false` if not found. */
    async softDelete(slug: string): Promise<boolean> {
        return inspirationRepository.softDelete(slug);
    },

    /**
     * Full inspiration upload pipeline:
     * extract ZIP → validate dist → deploy files → upsert DB record.
     *
     * If an inspiration with the given slug already exists it is updated in place
     * (file directory replaced atomically, DB record patched). A temporary directory
     * is cleaned up on failure; on success, ownership is transferred to the permanent
     * inspiration directory.
     *
     * @param zipBuffer - Raw bytes of the uploaded ZIP archive.
     * @param input - Inspiration metadata; `slug` is auto-generated with UUID v4 when omitted.
     * @returns The persisted `Inspiration` entity after a successful upload.
     * @throws Rethrows any extraction, validation, or storage error after cleanup.
     */
    async uploadFromZip(zipBuffer: Buffer, input: UploadInspirationInput): Promise<Inspiration> {
        const slug = input.slug ?? uuid4();
        let tempDir: string | null = null;

        try {
            tempDir = await extractZip(zipBuffer);
            const effectiveDir = await validateDistDir(tempDir);
            await replaceDistDir('inspiration', slug, effectiveDir);
            tempDir = null;
            const inspiration = await inspirationRepository.upsert({ ...input, slug });
            logger.info({ slug }, 'inspiration uploaded successfully');
            return inspiration;
        } catch (err) {
            if (tempDir) {
                await cleanupTempDir(tempDir);
            }
            logger.error({ slug, err }, 'inspiration upload failed');
            throw err;
        }
    },
};
