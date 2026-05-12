/**
 * Shared test helper for repository integration tests.
 *
 * Provides a `clearCollections` utility that wipes the specified MongoDB
 * collections before each test, ensuring isolation without restarting the
 * container between tests.
 */
import { Db } from 'mongodb';

import { getDb } from '@/lib/db/client';

/** Drop-and-recreate the given collections so every test starts clean. */
export async function clearCollections(db: Db, ...collectionNames: string[]): Promise<void> {
    for (const name of collectionNames) {
        await db.collection(name).deleteMany({});
    }
}

/** Lazily-resolved Db handle shared across all helpers in a test file. */
export async function getTestDb(): Promise<Db> {
    return getDb();
}
