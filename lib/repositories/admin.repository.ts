/**
 * @file lib/repositories/admin.repository.ts
 * Persistence layer for administrator accounts.
 *
 * Defines the internal `AdminDocument` MongoDB document shape and exposes the
 * `adminRepository` module singleton. Password hashing is delegated to the
 * `Admin` domain entity; this module only handles raw DB reads/writes.
 */
import { ObjectId } from 'mongodb';

import { DB_COLLECTIONS } from '@/lib/constants';
import { getDb } from '@/lib/db/client';
import { Admin } from '@/lib/entities/admin';
import { createLogger } from '@/lib/logger';

const log = createLogger('admin.repository');

interface AdminDocument {
    _id: ObjectId;
    username: string;
    passwordHash: string;
    createdAt: Date;
    updatedAt: Date;
}

function toEntity(doc: AdminDocument): Admin {
    return Admin.fromPersisted(doc._id.toHexString(), doc.username, doc.passwordHash, doc.createdAt, doc.updatedAt);
}

const col = async () => {
    const db = await getDb();
    return db.collection<AdminDocument>(DB_COLLECTIONS.ADMINS);
};

export const adminRepository = {
    /** Find an admin by username. Returns `null` if not found. */
    async findByUsername(username: string): Promise<Admin | null> {
        const c = await col();
        const doc = await c.findOne({ username });
        return doc ? toEntity(doc) : null;
    },

    /** Return `true` if at least one admin document exists in the collection. */
    async hasAny(): Promise<boolean> {
        const c = await col();
        return (await c.countDocuments()) > 0;
    },

    /** Persist a new `Admin` entity to the database. */
    async insert(admin: Admin): Promise<void> {
        const c = await col();
        await c.insertOne({
            _id: new ObjectId(admin.id),
            username: admin.username,
            passwordHash: admin.getPasswordHash(),
            createdAt: admin.createdAt,
            updatedAt: admin.updatedAt,
        });
        log.info({ username: admin.username }, 'admin inserted');
    },
};
