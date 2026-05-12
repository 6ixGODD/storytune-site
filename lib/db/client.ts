/**
 * @file lib/db/client.ts
 * MongoDB client singleton.
 *
 * Creates exactly one `MongoClient` for the lifetime of the process. In development
 * mode the client is stored on the Node.js global object so that Next.js Hot Module
 * Replacement (HMR) reloads do not open additional connections.
 *
 * All connection tuning parameters (pool size, timeouts, TLS, etc.) are read from
 * `lib/config.ts` and ultimately from `STORYTUNE__MONGODB_*` environment variables.
 *
 * @example
 * ```ts
 * import { getDb } from '@/lib/db/client';
 * const db = await getDb();
 * const cards = db.collection('cards');
 * ```
 */
import { Db, MongoClient, MongoClientOptions } from 'mongodb';

import { config } from '@/lib/config';
import { createLogger } from '@/lib/logger';

const log = createLogger('db.client');

const globalForMongo = globalThis as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
};

/** Options passed to every `MongoClient` constructor call. */
const mongoOptions: MongoClientOptions = {
    maxPoolSize: config.mongo.maxPoolSize,
    minPoolSize: config.mongo.minPoolSize,
    connectTimeoutMS: config.mongo.connectTimeoutMS,
    serverSelectionTimeoutMS: config.mongo.serverSelectionTimeoutMS,
    ...(config.mongo.socketTimeoutMS > 0 && { socketTimeoutMS: config.mongo.socketTimeoutMS }),
    tls: config.mongo.tls,
    ...(config.mongo.tlsCAFile && { tlsCAFile: config.mongo.tlsCAFile }),
    authSource: config.mongo.authSource,
};

async function createClient(): Promise<MongoClient> {
    const client = new MongoClient(config.mongo.uri, mongoOptions);
    const c = await client.connect();
    log.info(
        {
            uri: config.mongo.uri.replace(/\/\/[^@]+@/, '//<credentials>@'),
            db: config.mongo.dbName,
            pool: `${config.mongo.minPoolSize}–${config.mongo.maxPoolSize}`,
        },
        'MongoDB connected',
    );
    return c;
}

/**
 * A `Promise<MongoClient>` that resolves once the driver has established its
 * initial connection. In development the promise is cached on `globalThis` to
 * survive HMR reloads; in production a new promise is created once per process.
 */
let clientPromise: Promise<MongoClient>;

if (config.isDev) {
    if (!globalForMongo._mongoClientPromise) {
        globalForMongo._mongoClientPromise = createClient();
    }
    clientPromise = globalForMongo._mongoClientPromise;
} else {
    clientPromise = createClient();
}

export { clientPromise };

/**
 * Resolve the connected `MongoClient` and return a handle to the specified database.
 *
 * @param dbName - Database name to use. Defaults to `config.mongo.dbName`
 *   (`STORYTUNE__MONGODB_DB_NAME`), which defaults to `"storytune"`.
 * @returns A `Db` instance ready for collection operations.
 */
export async function getDb(dbName?: string): Promise<Db> {
    const client = await clientPromise;
    return client.db(dbName ?? config.mongo.dbName);
}
