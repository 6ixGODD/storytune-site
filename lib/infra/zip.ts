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
 * Validate that an extracted dist directory is a valid invitation card package
 * and return the effective root path.
 *
 * Many build tools (Vite, webpack, etc.) create a ZIP where all files sit inside
 * a single top-level subfolder rather than at the archive root. This function
 * detects that pattern and returns the subfolder as the effective root, so callers
 * can deploy the correct directory without requiring the uploader to re-zip.
 *
 * @param dirPath - Path to the extracted temporary directory.
 * @returns The effective root path — either `dirPath` itself (index.html at root)
 *   or a single immediate subdirectory (index.html one level deep).
 * @throws `Error` if `index.html` cannot be found at the root or one level deep.
 */
export async function validateDistDir(dirPath: string): Promise<string> {
    // Happy path: index.html is directly inside dirPath.
    try {
        await fs.access(path.join(dirPath, 'index.html'));
        return dirPath;
    } catch {
        // fall through to unwrap check
    }

    // Unwrap: exactly one subdirectory and no loose files at root.
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const dirs = entries.filter((e) => e.isDirectory());
    const files = entries.filter((e) => !e.isDirectory());
    if (dirs.length === 1 && files.length === 0) {
        const subDir = path.join(dirPath, dirs[0].name);
        try {
            await fs.access(path.join(subDir, 'index.html'));
            return subDir;
        } catch {
            // fall through to error
        }
    }

    throw new Error('Invalid ZIP: missing index.html at root');
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
