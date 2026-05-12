/**
 * @file lib/entities/admin.ts
 * `Admin` domain entity — the rich model for an administrator account.
 *
 * Password hashing is handled internally (bcrypt, cost factor 12).
 * The `_passwordHash` field is intentionally private; use `getPasswordHash()` only
 * in the persistence layer when writing to the database.
 *
 * Instances are immutable: all mutation methods (`changePassword`) return new instances.
 */
import { randomBytes } from 'node:crypto';

import bcrypt from 'bcryptjs';

export class Admin {
    private constructor(
        readonly id: string,
        readonly username: string,
        private readonly _passwordHash: string,
        readonly createdAt: Date,
        readonly updatedAt: Date,
    ) {}

    /**
     * Create a new `Admin` instance with a freshly hashed password.
     * Generates a random 12-byte hex ID (independent of the database).
     *
     * @param username - Unique login name.
     * @param plainPassword - Plain-text password; hashed with bcrypt before storage.
     * @returns New `Admin` instance ready to be persisted.
     */
    static async create(username: string, plainPassword: string): Promise<Admin> {
        const hash = await bcrypt.hash(plainPassword, 12);
        const now = new Date();
        return new Admin(randomBytes(12).toString('hex'), username, hash, now, now);
    }

    /**
     * Reconstruct an `Admin` instance from a persisted database document.
     * Intended for use by the repository layer only.
     *
     * @param id - Hex string representation of the MongoDB `_id`.
     * @param username - Admin username.
     * @param passwordHash - Bcrypt hash stored in the database.
     * @param createdAt - Original creation timestamp.
     * @param updatedAt - Most recent update timestamp.
     * @returns Reconstituted `Admin` entity.
     */
    static fromPersisted(id: string, username: string, passwordHash: string, createdAt: Date, updatedAt: Date): Admin {
        return new Admin(id, username, passwordHash, createdAt, updatedAt);
    }

    /**
     * Compare a plain-text password against the stored bcrypt hash.
     *
     * @param plain - Plain-text candidate password.
     * @returns `true` if the password matches, `false` otherwise.
     */
    async verifyPassword(plain: string): Promise<boolean> {
        return bcrypt.compare(plain, this._passwordHash);
    }

    /**
     * Return a new `Admin` instance with an updated password hash.
     * Does **not** mutate the current instance.
     *
     * @param newPlain - New plain-text password to hash and store.
     * @returns New `Admin` instance with the updated hash and a refreshed `updatedAt`.
     */
    async changePassword(newPlain: string): Promise<Admin> {
        const hash = await bcrypt.hash(newPlain, 12);
        return new Admin(this.id, this.username, hash, this.createdAt, new Date());
    }

    /**
     * Expose the bcrypt hash for persistence use.
     *
     * @returns The stored bcrypt password hash.
     * @internal Should only be called by the admin repository.
     */
    getPasswordHash(): string {
        return this._passwordHash;
    }
}
