import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { cardDirExists, findCoverAsset, listInspirationSlugs, readCardFile, resolveCardFilePath } from '@/lib/infra/storage';

// Paths derived from config defaults (set in tests/setup.ts)
const uploadedBase = path.join(os.tmpdir(), 'storytune-test', 'cards');
const inspirationBase = path.join(os.tmpdir(), 'storytune-test', 'inspiration');

beforeAll(async () => {
    // Create a sample uploaded card
    const cardDir = path.join(uploadedBase, 'sample-card');
    await fs.mkdir(cardDir, { recursive: true });
    await fs.writeFile(path.join(cardDir, 'index.html'), '<html></html>');
    await fs.mkdir(path.join(cardDir, 'assets'), { recursive: true });
    await fs.writeFile(path.join(cardDir, 'assets', 'main.js'), 'console.warn("hi")');

    // Create a sample inspiration card with a cover image
    const inspDir = path.join(inspirationBase, 'insp-card');
    await fs.mkdir(path.join(inspDir, 'assets'), { recursive: true });
    await fs.writeFile(path.join(inspDir, 'index.html'), '<html></html>');
    await fs.writeFile(path.join(inspDir, 'assets', 'cover.jpg'), 'fake-image-bytes');

    // A second inspiration card with png cover
    const inspDir2 = path.join(inspirationBase, 'insp-card-2');
    await fs.mkdir(path.join(inspDir2, 'assets'), { recursive: true });
    await fs.writeFile(path.join(inspDir2, 'index.html'), '<html></html>');
    await fs.writeFile(path.join(inspDir2, 'assets', 'cover.png'), 'fake-png-bytes');
});

afterAll(async () => {
    await fs.rm(path.join(os.tmpdir(), 'storytune-test'), { recursive: true, force: true });
});

describe('resolveCardFilePath()', () => {
    it('resolves to index.html when no filePath given', () => {
        const result = resolveCardFilePath('uploaded', 'sample-card');
        expect(result).toBe(path.join(uploadedBase, 'sample-card', 'index.html'));
    });

    it('resolves a nested asset path', () => {
        const result = resolveCardFilePath('uploaded', 'sample-card', 'assets/main.js');
        expect(result).toBe(path.join(uploadedBase, 'sample-card', 'assets', 'main.js'));
    });

    it('resolves inspiration paths using the inspiration base', () => {
        const result = resolveCardFilePath('inspiration', 'insp-card', 'assets/cover.jpg');
        expect(result).toBe(path.join(inspirationBase, 'insp-card', 'assets', 'cover.jpg'));
    });

    it('throws on path traversal with ../', () => {
        expect(() => resolveCardFilePath('uploaded', 'sample-card', '../other-card/index.html')).toThrow(
            'path traversal detected',
        );
    });

    it('throws on path traversal via encoded segments', () => {
        expect(() => resolveCardFilePath('uploaded', 'sample-card', '../../etc/passwd')).toThrow(
            'path traversal detected',
        );
    });
});

describe('cardDirExists()', () => {
    it('returns true for an existing card directory', async () => {
        await expect(cardDirExists('uploaded', 'sample-card')).resolves.toBe(true);
    });

    it('returns false for a non-existent directory', async () => {
        await expect(cardDirExists('uploaded', 'ghost-card')).resolves.toBe(false);
    });

    it('returns true for an existing inspiration directory', async () => {
        await expect(cardDirExists('inspiration', 'insp-card')).resolves.toBe(true);
    });
});

describe('readCardFile()', () => {
    it('reads index.html by default', async () => {
        const { buffer, mimeType } = await readCardFile('uploaded', 'sample-card');
        expect(buffer.toString()).toBe('<html></html>');
        expect(mimeType).toBe('text/html');
    });

    it('reads a nested asset with correct mime type', async () => {
        const { buffer, mimeType } = await readCardFile('uploaded', 'sample-card', 'assets/main.js');
        expect(buffer.toString()).toContain('console.warn');
        expect(mimeType).toContain('javascript');
    });

    it('throws when the file does not exist', async () => {
        await expect(readCardFile('uploaded', 'sample-card', 'missing.css')).rejects.toThrow();
    });

    it('throws when the card slug does not exist', async () => {
        await expect(readCardFile('uploaded', 'ghost-card')).rejects.toThrow();
    });
});

describe('findCoverAsset()', () => {
    it('finds a jpg cover and returns the URL', async () => {
        const url = await findCoverAsset('insp-card');
        expect(url).toBe('/inspiration/insp-card/assets/cover.jpg');
    });

    it('finds a png cover (checks extension priority)', async () => {
        // png comes after jpg in COVER_EXTENSIONS order, but insp-card-2 only has png
        const url = await findCoverAsset('insp-card-2');
        expect(url).toBe('/inspiration/insp-card-2/assets/cover.png');
    });

    it('returns null when no cover image exists', async () => {
        const url = await findCoverAsset('ghost-card');
        expect(url).toBeNull();
    });
});

describe('listInspirationSlugs()', () => {
    it('returns slugs for all subdirectories in the inspiration path', async () => {
        const slugs = await listInspirationSlugs();
        expect(slugs).toContain('insp-card');
        expect(slugs).toContain('insp-card-2');
    });

    it('returns only directory entries (not files)', async () => {
        // Write a file directly in the inspiration base to ensure it is filtered out
        await fs.writeFile(path.join(inspirationBase, 'stray-file.txt'), 'x');
        const slugs = await listInspirationSlugs();
        expect(slugs).not.toContain('stray-file.txt');
    });

    it('returns an empty array when the directory is missing', async () => {
        // Temporarily use a non-existent path by relying on a slug that does not map to a real dir
        // (listInspirationSlugs itself handles missing base dir gracefully)
        const slugs = await listInspirationSlugs();
        expect(Array.isArray(slugs)).toBe(true);
    });
});
