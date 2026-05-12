/**
 * @file lib/infra/storage.ts
 * File-system abstraction for reading and managing card dist packages.
 *
 * Two storage roots exist:
 * - **uploaded** — customer invitation cards deployed via the admin upload flow.
 * - **inspiration** — curated gallery cards managed manually on the server.
 *
 * Paths are resolved from `lib/config.ts` (`storage.uploadedCardsPath` /
 * `storage.inspirationCardsPath`). All path resolution includes a traversal guard
 * to prevent directory escape attacks.
 */
import fs from 'fs/promises';
import { lookup } from 'mime-types';
import path from 'path';

import { config } from '@/lib/config';
import { COVER_EXTENSIONS } from '@/lib/constants';
import { createLogger } from '@/lib/logger';

const log = createLogger('infra.storage');

export type CardStorageType = 'uploaded' | 'inspiration';

function getBasePath(type: CardStorageType): string {
    return type === 'uploaded' ? config.storage.uploadedCardsPath : config.storage.inspirationCardsPath;
}

/**
 * Resolve an absolute file path within a card directory.
 *
 * Prevents path traversal by verifying the resolved target remains inside the
 * card directory (`<basePath>/<slug>/`). Defaults to `index.html` when no
 * `filePath` is given.
 *
 * @param type - Storage root to use: `"uploaded"` or `"inspiration"`.
 * @param slug - Unique card identifier (directory name within the storage root).
 * @param filePath - Relative path to a specific file within the card directory.
 * @returns Absolute path to the requested file.
 * @throws `Error` on path traversal attempts.
 */
export function resolveCardFilePath(type: CardStorageType, slug: string, filePath?: string): string {
    const basePath = getBasePath(type);
    const cardDir = path.resolve(basePath, slug);
    const target = filePath ? path.resolve(cardDir, filePath) : path.join(cardDir, 'index.html');
    if (!target.startsWith(cardDir + path.sep) && target !== cardDir) {
        throw new Error('Invalid file path: path traversal detected');
    }
    return target;
}

/**
 * Read a card file from disk and infer its MIME type.
 *
 * @param type - Storage root (`"uploaded"` or `"inspiration"`).
 * @param slug - Card slug.
 * @param filePath - Relative path within the card directory (omit for `index.html`).
 * @returns Object containing the raw `buffer` and the inferred `mimeType` string.
 * @throws If the file does not exist or is not readable.
 */
export async function readCardFile(
    type: CardStorageType,
    slug: string,
    filePath?: string,
): Promise<{ buffer: Buffer; mimeType: string }> {
    const resolvedPath = resolveCardFilePath(type, slug, filePath);
    const buffer = await fs.readFile(resolvedPath);
    const mimeType = lookup(resolvedPath) || 'application/octet-stream';
    return { buffer, mimeType };
}

/**
 * Check whether a card's dist directory exists in the given storage root.
 *
 * @param type - Storage root to check.
 * @param slug - Card slug.
 * @returns `true` if the directory is accessible, `false` otherwise.
 */
export async function cardDirExists(type: CardStorageType, slug: string): Promise<boolean> {
    const cardDir = path.join(getBasePath(type), slug);
    try {
        await fs.access(cardDir);
        return true;
    } catch {
        return false;
    }
}

/**
 * Find the cover image URL for an inspiration card.
 *
 * Probes `assets/cover.<ext>` for each extension in `COVER_EXTENSIONS` in order
 * and returns the URL of the first match.
 *
 * @param slug - Inspiration card slug.
 * @returns Relative URL string (e.g. `/inspiration/my-card/assets/cover.jpg`),
 *   or `null` if no cover image is found.
 */
export async function findCoverAsset(slug: string): Promise<string | null> {
    for (const ext of COVER_EXTENSIONS) {
        try {
            const filePath = resolveCardFilePath('inspiration', slug, `assets/cover.${ext}`);
            await fs.access(filePath);
            return `/inspiration/${slug}/assets/cover.${ext}`;
        } catch {
            // try next extension
        }
    }
    return null;
}

/**
 * Enumerate all slugs in the inspiration gallery storage root.
 *
 * Returns the names of all immediate subdirectories. Non-directory entries and
 * read errors are silently ignored (returns `[]` with a warning log).
 *
 * @returns Array of slug strings, one per gallery card directory.
 */
export async function listInspirationSlugs(): Promise<string[]> {
    const basePath = config.storage.inspirationCardsPath;
    if (!basePath) return [];
    try {
        const entries = await fs.readdir(basePath, { withFileTypes: true });
        return entries.filter((e) => e.isDirectory()).map((e) => e.name);
    } catch {
        log.warn({ basePath }, 'inspiration directory not readable');
        return [];
    }
}

/**
 * Atomically replace (or create) a dist directory from a source temp directory.
 *
 * Strategy:
 * 1. If an existing directory is present, rename it to a timestamped backup.
 * 2. Rename the source temp directory into the target location.
 * 3. On success, remove the backup; on failure, restore it.
 *
 * This ensures the card/inspiration is always in a consistent state even if the
 * process is interrupted partway through.
 *
 * @param type - Storage root: `"uploaded"` (customer cards) or `"inspiration"`.
 * @param slug - Unique identifier used as the target directory name.
 * @param sourceTempDir - Path to the extracted dist directory to deploy.
 * @throws Rethrows any I/O error from the rename/restore step.
 */
export async function replaceDistDir(type: CardStorageType, slug: string, sourceTempDir: string): Promise<void> {
    const basePath = getBasePath(type);
    const targetDir = path.join(basePath, slug);
    const backupDir = `${targetDir}.__backup_${Date.now()}`;

    await fs.mkdir(basePath, { recursive: true });

    const existingExists = await cardDirExists(type, slug);
    if (existingExists) {
        await fs.rename(targetDir, backupDir);
    }

    try {
        await fs.rename(sourceTempDir, targetDir);
        if (existingExists) {
            await fs.rm(backupDir, { recursive: true, force: true });
        }
        log.info({ type, slug }, 'dist directory replaced');
    } catch (err) {
        if (existingExists) {
            await fs.rename(backupDir, targetDir);
        }
        throw err;
    }
}

/**
 * Atomically replace (or create) a card's dist directory from a source temp directory.
 *
 * @deprecated Prefer `replaceDistDir('uploaded', slug, sourceTempDir)`.
 */
export async function replaceCardDir(slug: string, sourceTempDir: string): Promise<void> {
    return replaceDistDir('uploaded', slug, sourceTempDir);
}
