import { Db } from 'mongodb';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { DB_COLLECTIONS } from '@/lib/constants';
import { clientPromise } from '@/lib/db/client';
import { Admin } from '@/lib/entities/admin';
import { adminRepository } from '@/lib/repositories/admin.repository';

import { clearCollections, getTestDb } from './helpers';

let db: Db;

beforeEach(async () => {
    db = await getTestDb();
    await clearCollections(db, DB_COLLECTIONS.ADMINS);
});

afterAll(async () => {
    const client = await clientPromise;
    await client.close();
});

describe('adminRepository', () => {
    describe('hasAny()', () => {
        it('returns false when the collection is empty', async () => {
            await expect(adminRepository.hasAny()).resolves.toBe(false);
        });

        it('returns true after at least one admin is inserted', async () => {
            const admin = await Admin.create('alice', 'password1');
            await adminRepository.insert(admin);
            await expect(adminRepository.hasAny()).resolves.toBe(true);
        });
    });

    describe('insert() + findByUsername()', () => {
        it('persists an admin and retrieves it by username', async () => {
            const admin = await Admin.create('bob', 'hunter2');
            await adminRepository.insert(admin);

            const found = await adminRepository.findByUsername('bob');
            expect(found).not.toBeNull();
            expect(found!.username).toBe('bob');
        });

        it('stored password hash verifies correctly against the original password', async () => {
            const admin = await Admin.create('carol', 'secret123');
            await adminRepository.insert(admin);

            const found = await adminRepository.findByUsername('carol');
            await expect(found!.verifyPassword('secret123')).resolves.toBe(true);
            await expect(found!.verifyPassword('wrong')).resolves.toBe(false);
        });

        it('preserves createdAt and updatedAt timestamps', async () => {
            const admin = await Admin.create('dave', 'pass');
            await adminRepository.insert(admin);

            const found = await adminRepository.findByUsername('dave');
            expect(found!.createdAt.getTime()).toBe(admin.createdAt.getTime());
            expect(found!.updatedAt.getTime()).toBe(admin.updatedAt.getTime());
        });
    });

    describe('findByUsername()', () => {
        it('returns null for a non-existent username', async () => {
            await expect(adminRepository.findByUsername('ghost')).resolves.toBeNull();
        });

        it('is case-sensitive (does not find "Admin" when stored as "admin")', async () => {
            const admin = await Admin.create('admin', 'pass');
            await adminRepository.insert(admin);
            await expect(adminRepository.findByUsername('Admin')).resolves.toBeNull();
        });

        it('returns the correct admin when multiple admins exist', async () => {
            const a1 = await Admin.create('user1', 'p1');
            const a2 = await Admin.create('user2', 'p2');
            await adminRepository.insert(a1);
            await adminRepository.insert(a2);

            const found = await adminRepository.findByUsername('user2');
            expect(found!.username).toBe('user2');
        });
    });
});
