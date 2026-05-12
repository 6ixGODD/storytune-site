/**
 * @file lib/config.ts
 * Centralised, validated application configuration.
 *
 * All runtime settings are loaded from environment variables (with `dotenv/config` for
 * local development). Every variable is prefixed with `STORYTUNE__` (double-underscore)
 * except the standard `NODE_ENV`.
 *
 * Import `config` anywhere you need a setting — never read `process.env` directly.
 *
 * @example
 * ```ts
 * import { config } from '@/lib/config';
 * console.log(config.mongo.dbName);
 * ```
 */
import 'dotenv/config';

import path from 'node:path';

import { z } from 'zod';

const envSchema = z.object({
    // ── Runtime ───────────────────────────────────────────────────────────────
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    // ── Application ───────────────────────────────────────────────────────────
    /** Publicly reachable base URL, used in email links and sitemap. */
    STORYTUNE__SITE_URL: z.string().url().default('http://localhost:3000'),
    /** TCP port the Next.js server listens on. */
    STORYTUNE__PORT: z.coerce.number().int().min(1).max(65535).default(3000),

    // ── MongoDB ───────────────────────────────────────────────────────────────
    /** Full MongoDB connection string (may include credentials). */
    STORYTUNE__MONGODB_URI: z.string().default('mongodb://localhost:27017'),
    /** Name of the MongoDB database to use. */
    STORYTUNE__MONGODB_DB_NAME: z.string().default('storytune'),
    /** Maximum number of connections in the connection pool. */
    STORYTUNE__MONGODB_MAX_POOL_SIZE: z.coerce.number().int().min(1).default(10),
    /** Minimum number of connections kept alive in the pool. */
    STORYTUNE__MONGODB_MIN_POOL_SIZE: z.coerce.number().int().min(0).default(0),
    /** Milliseconds to wait for a new connection before timing out. */
    STORYTUNE__MONGODB_CONNECT_TIMEOUT_MS: z.coerce.number().int().min(0).default(30_000),
    /** Milliseconds to wait for server selection before giving up. */
    STORYTUNE__MONGODB_SERVER_SELECTION_TIMEOUT_MS: z.coerce.number().int().min(0).default(30_000),
    /** Milliseconds of socket inactivity before closing (0 = no timeout). */
    STORYTUNE__MONGODB_SOCKET_TIMEOUT_MS: z.coerce.number().int().min(0).default(0),
    /** Whether to use TLS for the MongoDB connection. */
    STORYTUNE__MONGODB_TLS: z
        .union([z.boolean(), z.string().transform((v) => v.toLowerCase() === 'true')])
        .default(false),
    /** Absolute path to the TLS CA certificate file (PEM), when TLS is enabled. */
    STORYTUNE__MONGODB_TLS_CA_FILE: z.string().optional(),
    /** Database used for credential authentication (typically "admin"). */
    STORYTUNE__MONGODB_AUTH_SOURCE: z.string().default('admin'),
    /** Connect directly to the specified host, bypassing topology discovery (useful for testcontainers). */
    STORYTUNE__MONGODB_DIRECT_CONNECTION: z
        .union([z.boolean(), z.string().transform((v) => v.toLowerCase() === 'true')])
        .default(false),

    // ── JWT ───────────────────────────────────────────────────────────────────
    /** Secret key used for signing and verifying JWTs. Use a long random string in production. */
    STORYTUNE__JWT_SECRET: z.string().default('change-me-in-production-please-use-32-chars'),
    /** Token lifetime in vercel/ms format (e.g. "7d", "2h", "30m"). */
    STORYTUNE__JWT_EXPIRES_IN: z.string().default('7d'),
    /** HMAC signing algorithm for JWTs. */
    STORYTUNE__JWT_ALGORITHM: z.enum(['HS256', 'HS384', 'HS512']).default('HS256'),

    // ── Storage ───────────────────────────────────────────────────────────────
    /** Absolute path where uploaded customer invitation card dist files are stored. */
    STORYTUNE__UPLOADED_CARDS_PATH: z.string().default('/tmp/storytune/cards'),
    /** Absolute path where inspiration gallery card dist files reside. */
    STORYTUNE__INSPIRATION_CARDS_PATH: z.string().default('/tmp/storytune/inspiration'),
    /** Directory used for temporary ZIP extraction (defaults to OS temp dir). */
    STORYTUNE__TEMP_DIR: z.string().optional(),
    /** Maximum allowed upload size in megabytes. */
    STORYTUNE__MAX_UPLOAD_SIZE_MB: z.coerce.number().int().min(1).default(50),

    // ── Resend ────────────────────────────────────────────────────────────────
    /** Resend API key (starts with "re_"). */
    STORYTUNE__RESEND_API_KEY: z.string().default(''),
    /** "From" email address for all outbound emails. */
    STORYTUNE__RESEND_FROM_EMAIL: z.string().default('noreply@story-tune.com'),
    /** Display name shown as the sender in email clients. */
    STORYTUNE__RESEND_FROM_NAME: z.string().default('StoryTune'),

    // ── Mail templates ────────────────────────────────────────────────────────
    /** Directory containing Handlebars email template files (*.hbs). */
    STORYTUNE__MAIL_TEMPLATE_DIR: z.string().default(path.join(process.cwd(), 'emails', 'templates')),

    // ── Logging ───────────────────────────────────────────────────────────────
    /**
     * Minimum log level. Defaults to "debug" in development and "info" in production.
     * Valid values: trace | debug | info | warn | error | fatal.
     */
    STORYTUNE__LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).optional(),

    // ── Admin seed ────────────────────────────────────────────────────────────
    /** Username for the first admin account, created automatically if no admins exist. */
    STORYTUNE__ADMIN_USERNAME: z.string().default('admin'),
    /** Password for the first admin account. Change before first production deploy. */
    STORYTUNE__ADMIN_PASSWORD: z.string().default('admin123'),
});

function parseEnv() {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        throw new Error(`Invalid environment variables:
${JSON.stringify(errors, null, 2)}`);
    }
    return result.data;
}

const env = parseEnv();

/**
 * Typed application configuration derived from environment variables.
 *
 * Grouped into logical namespaces: `app`, `mongo`, `jwt`, `storage`, `resend`,
 * `mail`, `logger`, `admin`. Top-level helpers `isDev` and `isProd` are
 * shortcuts for `env === 'development'` / `env === 'production'`.
 */
export const config = {
    /** Raw `NODE_ENV` string. */
    env: env.NODE_ENV,
    /** `true` when running in development mode. */
    isDev: env.NODE_ENV === 'development',
    /** `true` when running in production mode. */
    isProd: env.NODE_ENV === 'production',

    /** Public-facing application settings. */
    app: {
        /** Canonical base URL, e.g. `https://www.story-tune.com`. */
        baseUrl: env['STORYTUNE__SITE_URL'],
        /** TCP port the HTTP server listens on. */
        port: env['STORYTUNE__PORT'],
    },

    /** MongoDB connection and pool settings (maps directly to `MongoClientOptions`). */
    mongo: {
        /** Full connection URI, including credentials if required. */
        uri: env['STORYTUNE__MONGODB_URI'],
        /** Target database name. */
        dbName: env['STORYTUNE__MONGODB_DB_NAME'],
        /** Upper bound on the number of simultaneous connections in the pool. */
        maxPoolSize: env['STORYTUNE__MONGODB_MAX_POOL_SIZE'],
        /** Lower bound — connections below this count are kept alive proactively. */
        minPoolSize: env['STORYTUNE__MONGODB_MIN_POOL_SIZE'],
        /** How long (ms) to wait when establishing a new connection. */
        connectTimeoutMS: env['STORYTUNE__MONGODB_CONNECT_TIMEOUT_MS'],
        /** How long (ms) to wait for the driver to find a suitable server. */
        serverSelectionTimeoutMS: env['STORYTUNE__MONGODB_SERVER_SELECTION_TIMEOUT_MS'],
        /** How long (ms) an idle socket can remain open (0 disables the timeout). */
        socketTimeoutMS: env['STORYTUNE__MONGODB_SOCKET_TIMEOUT_MS'],
        /** Enable TLS encryption for the MongoDB connection. */
        tls: env['STORYTUNE__MONGODB_TLS'],
        /** Path to a PEM-encoded CA file when using self-signed TLS certificates. */
        tlsCAFile: env['STORYTUNE__MONGODB_TLS_CA_FILE'],
        /** Authentication database, typically `"admin"` for URI-based auth. */
        authSource: env['STORYTUNE__MONGODB_AUTH_SOURCE'],
        /** Bypass topology discovery and connect directly to the given host. */
        directConnection: env['STORYTUNE__MONGODB_DIRECT_CONNECTION'],
    },

    /** JSON Web Token configuration. */
    jwt: {
        /** Signing secret. Must be kept confidential and at least 32 characters long. */
        secret: env['STORYTUNE__JWT_SECRET'],
        /** Token lifetime in vercel/ms notation, e.g. `"7d"` or `"2h"`. */
        expiresIn: env['STORYTUNE__JWT_EXPIRES_IN'],
        /** HMAC algorithm used to sign tokens. */
        algorithm: env['STORYTUNE__JWT_ALGORITHM'],
    },

    /** File system paths for card dist packages and temporary files. */
    storage: {
        /** Root directory where uploaded customer card dist directories are stored. */
        uploadedCardsPath: env['STORYTUNE__UPLOADED_CARDS_PATH'],
        /** Root directory of the curated inspiration gallery card dist packages. */
        inspirationCardsPath: env['STORYTUNE__INSPIRATION_CARDS_PATH'],
        /** Override for the OS temporary directory used during ZIP extraction. */
        tempDir: env['STORYTUNE__TEMP_DIR'],
        /** Maximum file size (in MB) accepted by the card upload endpoint. */
        maxUploadSizeMb: env['STORYTUNE__MAX_UPLOAD_SIZE_MB'],
    },

    /** Resend transactional email settings. */
    resend: {
        /** Resend API key used to authenticate outbound email requests. */
        apiKey: env['STORYTUNE__RESEND_API_KEY'],
        /** Email address that appears in the `From` header. */
        fromEmail: env['STORYTUNE__RESEND_FROM_EMAIL'],
        /** Display name that appears alongside the `From` email address. */
        fromName: env['STORYTUNE__RESEND_FROM_NAME'],
    },

    /** Email template settings. */
    mail: {
        /** Absolute path to the directory containing Handlebars (*.hbs) email templates. */
        templateDir: env['STORYTUNE__MAIL_TEMPLATE_DIR'],
    },

    /** Structured logging configuration. */
    logger: {
        /**
         * Minimum log level to emit. When not set, defaults to `"debug"` in
         * development and `"info"` in production.
         */
        level: env['STORYTUNE__LOG_LEVEL'],
    },

    /** Bootstrap admin account (used for first-run seeding only). */
    admin: {
        /** Username for the auto-seeded admin account. */
        username: env['STORYTUNE__ADMIN_USERNAME'],
        /** Plain-text password for the auto-seeded admin account. */
        password: env['STORYTUNE__ADMIN_PASSWORD'],
    },
} as const;

/** Inferred type of the `config` object. */
export type Config = typeof config;
