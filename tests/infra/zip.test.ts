import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import AdmZip from 'adm-zip';
import { afterEach, describe, expect, it } from 'vitest';

import { cleanupTempDir, extractZip, validateDistDir } from '@/lib/infra/zip';

/** Create an in-memory ZIP buffer with the given entries. */
function makeZipBuffer(entries: { name: string; content: string }[]): Buffer {
    const zip = new AdmZip();
    for (const entry of entries) {
        zip.addFile(entry.name, Buffer.from(entry.content));
    }
    return zip.toBuffer();
}

describe('validateDistDir()', () => {
    it('resolves successfully when index.html is present', async () => {
        const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vtest-'));
        await fs.writeFile(path.join(tmpDir, 'index.html'), '<html></html>');

        await expect(validateDistDir(tmpDir)).resolves.toBeUndefined();
        await fs.rm(tmpDir, { recursive: true, force: true });
    });

    it('throws when index.html is missing', async () => {
        const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vtest-'));

        await expect(validateDistDir(tmpDir)).rejects.toThrow('missing index.html');
        await fs.rm(tmpDir, { recursive: true, force: true });
    });

    it('throws on a completely non-existent directory', async () => {
        await expect(validateDistDir(path.join(os.tmpdir(), 'ghost-dir-xyz'))).rejects.toThrow();
    });
});

describe('cleanupTempDir()', () => {
    it('removes an existing directory without throwing', async () => {
        const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cleanup-'));
        await fs.writeFile(path.join(tmpDir, 'file.txt'), 'data');

        await expect(cleanupTempDir(tmpDir)).resolves.toBeUndefined();
        await expect(fs.access(tmpDir)).rejects.toThrow();
    });

    it('does not throw when the directory does not exist', async () => {
        await expect(cleanupTempDir(path.join(os.tmpdir(), 'ghost-dir-never-created'))).resolves.toBeUndefined();
    });
});

describe('extractZip()', () => {
    const extractedDirs: string[] = [];

    afterEach(async () => {
        for (const dir of extractedDirs.splice(0)) {
            await fs.rm(dir, { recursive: true, force: true });
        }
    });

    it('extracts a valid ZIP buffer to a temp directory', async () => {
        const zipBuffer = makeZipBuffer([
            { name: 'index.html', content: '<html>hello</html>' },
            { name: 'assets/main.js', content: 'console.warn("hello")' },
        ]);

        const dir = await extractZip(zipBuffer);
        extractedDirs.push(dir);

        const indexContent = await fs.readFile(path.join(dir, 'index.html'), 'utf-8');
        expect(indexContent).toBe('<html>hello</html>');

        const jsContent = await fs.readFile(path.join(dir, 'assets', 'main.js'), 'utf-8');
        expect(jsContent).toBe('console.warn("hello")');
    });

    it('returns a path to an existing directory', async () => {
        const zipBuffer = makeZipBuffer([{ name: 'index.html', content: '' }]);
        const dir = await extractZip(zipBuffer);
        extractedDirs.push(dir);

        await expect(fs.access(dir)).resolves.toBeUndefined();
    });

    it('creates a uniquely named temp dir on each call', async () => {
        const zipBuffer = makeZipBuffer([{ name: 'index.html', content: '' }]);
        const dir1 = await extractZip(zipBuffer);
        const dir2 = await extractZip(zipBuffer);
        extractedDirs.push(dir1, dir2);

        expect(dir1).not.toBe(dir2);
    });

    it('throws on an invalid (non-ZIP) buffer', async () => {
        const badBuffer = Buffer.from('this is not a zip file');
        await expect(extractZip(badBuffer)).rejects.toThrow();
    });
});
