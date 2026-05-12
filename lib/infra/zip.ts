/**
 * @file lib/infra/zip.ts
 * ZIP archive extraction and validation utilities for card dist uploads.
 *
 * Temporary directories are created under `config.storage.tempDir` when set,
 * falling back to the OS default temp directory (`os.tmpdir()`).
 */
import AdmZip from 'adm-zip';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import { config } from '@/lib/config';
import { createLogger } from '@/lib/logger';

const log = createLogger('infra.zip');

/**
 * Extract a ZIP buffer to a freshly created temporary directory.
 *
 * @param buffer - Raw bytes of the ZIP file.
 * @returns Absolute path to the temporary directory containing the extracted contents.
 */
export async function extractZip(buffer: Buffer): Promise<string> {
    const baseDir = config.storage.tempDir ?? os.tmpdir();
    const tempDir = await fs.mkdtemp(path.join(baseDir, 'storytune-'));
    const zip = new AdmZip(buffer);
    zip.extractAllTo(tempDir, true);
    log.debug({ tempDir }, 'ZIP extracted');
    return tempDir;
}

/**
 * Validate that an extracted dist directory is a valid invitation card package.
 * Currently checks for the presence of `index.html` at the directory root.
 *
 * @param dirPath - Path to the extracted directory.
 * @throws `Error` if `index.html` is not found.
 */
export async function validateDistDir(dirPath: string): Promise<void> {
    const indexPath = path.join(dirPath, 'index.html');
    try {
        await fs.access(indexPath);
    } catch {
        throw new Error('Invalid ZIP: missing index.html at root');
    }
}

/**
 * Remove a temporary directory (best-effort).
 * Logs a warning on failure but does **not** throw, so callers in `finally`
 * blocks are not interrupted by cleanup errors.
 *
 * @param dirPath - Path to the temporary directory to remove.
 */
export async function cleanupTempDir(dirPath: string): Promise<void> {
    try {
        await fs.rm(dirPath, { recursive: true, force: true });
        log.debug({ dirPath }, 'temp dir cleaned up');
    } catch (err) {
        log.warn({ dirPath, err }, 'failed to clean up temp dir');
    }
}
