import { describe, expect, it } from 'vitest';

import { Admin } from '@/lib/entities/admin';

describe('Admin entity', () => {
    describe('Admin.create()', () => {
        it('creates an admin with the given username', async () => {
            const admin = await Admin.create('testuser', 'pass123');
            expect(admin.username).toBe('testuser');
        });

        it('generates a non-empty hex id', async () => {
            const admin = await Admin.create('u', 'p');
            expect(admin.id).toMatch(/^[0-9a-f]{24}$/);
        });

        it('generates unique ids', async () => {
            const a = await Admin.create('u1', 'p');
            const b = await Admin.create('u2', 'p');
            expect(a.id).not.toBe(b.id);
        });

        it('hashes the password (does not store plaintext)', async () => {
            const admin = await Admin.create('u', 'mysecret');
            expect(admin.getPasswordHash()).not.toBe('mysecret');
            expect(admin.getPasswordHash()).toMatch(/^\$2[aby]\$/);
        });

        it('sets createdAt and updatedAt to the same recent time', async () => {
            const before = new Date();
            const admin = await Admin.create('u', 'p');
            const after = new Date();

            expect(admin.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
            expect(admin.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
            expect(admin.createdAt.getTime()).toBe(admin.updatedAt.getTime());
        });
    });

    describe('Admin.fromPersisted()', () => {
        it('reconstructs an admin from stored data', () => {
            const now = new Date();
            const hash = '$2b$12$dummyhashvalue';
            const admin = Admin.fromPersisted('abc123', 'jane', hash, now, now);

            expect(admin.id).toBe('abc123');
            expect(admin.username).toBe('jane');
            expect(admin.getPasswordHash()).toBe(hash);
            expect(admin.createdAt).toBe(now);
            expect(admin.updatedAt).toBe(now);
        });
    });

    describe('verifyPassword()', () => {
        it('returns true for the correct password', async () => {
            const admin = await Admin.create('u', 'correct-password');
            await expect(admin.verifyPassword('correct-password')).resolves.toBe(true);
        });

        it('returns false for a wrong password', async () => {
            const admin = await Admin.create('u', 'correct-password');
            await expect(admin.verifyPassword('wrong-password')).resolves.toBe(false);
        });

        it('returns false for an empty string', async () => {
            const admin = await Admin.create('u', 'correct-password');
            await expect(admin.verifyPassword('')).resolves.toBe(false);
        });
    });

    describe('changePassword()', () => {
        it('returns a new instance (immutability)', async () => {
            const admin = await Admin.create('u', 'old');
            const updated = await admin.changePassword('new');
            expect(updated).not.toBe(admin);
        });

        it('does not mutate the original hash', async () => {
            const admin = await Admin.create('u', 'old');
            const originalHash = admin.getPasswordHash();
            await admin.changePassword('new');
            expect(admin.getPasswordHash()).toBe(originalHash);
        });

        it('new instance verifies against the new password', async () => {
            const admin = await Admin.create('u', 'old');
            const updated = await admin.changePassword('new-password');
            await expect(updated.verifyPassword('new-password')).resolves.toBe(true);
        });

        it('new instance rejects the old password', async () => {
            const admin = await Admin.create('u', 'old');
            const updated = await admin.changePassword('new-password');
            await expect(updated.verifyPassword('old')).resolves.toBe(false);
        });

        it('refreshes updatedAt', async () => {
            const admin = await Admin.create('u', 'old');
            const updated = await admin.changePassword('new');
            expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(admin.updatedAt.getTime());
        });

        it('preserves id and username', async () => {
            const admin = await Admin.create('myuser', 'old');
            const updated = await admin.changePassword('new');
            expect(updated.id).toBe(admin.id);
            expect(updated.username).toBe(admin.username);
        });
    });
});
