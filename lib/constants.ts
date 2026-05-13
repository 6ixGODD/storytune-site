/**
 * @file lib/constants.ts
 * Application-wide constants that are truly fixed (not environment-dependent).
 *
 * Environment-dependent defaults (pool sizes, timeouts, sizes, etc.) belong in
 * `lib/config.ts`, not here.
 */

/**
 * Ordered list of image file extensions probed when looking for a gallery card
 * cover thumbnail. The first match wins.
 */
export const COVER_EXTENSIONS = ['png', 'jpg', 'webp', 'gif'] as const;

/** Union type of valid cover image extensions. */
export type CoverExtension = (typeof COVER_EXTENSIONS)[number];

/** Name of the HTTP-only cookie that stores the admin JWT. */
export const AUTH_COOKIE_NAME = 'auth_token';

/** Default number of items returned per paginated list request. */
export const DEFAULT_PAGE_SIZE = 20;

/** MongoDB collection names used throughout the application. */
export const DB_COLLECTIONS = {
    /** Collection storing invitation card records. */
    CARDS: 'cards',
    /** Collection storing admin user accounts. */
    ADMINS: 'admins',
    /** Collection storing curated inspiration / directions records. */
    INSPIRATIONS: 'inspirations',
} as const;

/**
 * Allowed values for the `status` field on a card document.
 * Cards are soft-deleted only — the `DELETED` status replaces hard removal.
 */
export const CARD_STATUS = {
    /** Card is live and can be served to invitees. */
    ACTIVE: 'active',
    /** Card has been soft-deleted and must not be served. */
    DELETED: 'deleted',
} as const;

/** Union type derived from `CARD_STATUS` values. */
export type CardStatus = (typeof CARD_STATUS)[keyof typeof CARD_STATUS];

// ── Per-card rate limiting & quota defaults ───────────────────────────────────

/**
 * Default rate-limit configuration applied to every newly created card.
 *
 * These values are intentionally generous — the goal is to block obvious abuse
 * (bots, scrapers) rather than to constrain legitimate guests. Each card admin
 * can override them via the PATCH endpoint.
 *
 * - `windowMs`: length of the sliding window in milliseconds (default: 1 minute).
 * - `maxRequests`: maximum number of qualifying requests allowed within the window.
 */
export const DEFAULT_CARD_RATE_LIMIT = {
    windowMs: 60_000,
    maxRequests: 300,
} as const;

/**
 * Default quota configuration applied to every newly created card.
 *
 * The quota caps the **lifetime** total of qualifying requests for a card.
 * Set to 1 million by default — essentially unlimited for a typical invitation,
 * but provides a hard ceiling against runaway bot traffic.
 */
export const DEFAULT_CARD_QUOTA = {
    maxRequests: 1_000_000,
} as const;

/**
 * Allowed values for the `status` field on an inspiration document.
 * Inspirations are soft-deleted only — the `DELETED` status replaces hard removal.
 */
export const INSPIRATION_STATUS = {
    /** Inspiration is live and visible in the gallery. */
    ACTIVE: 'active',
    /** Inspiration has been soft-deleted and must not be served. */
    DELETED: 'deleted',
} as const;

/** Union type derived from `INSPIRATION_STATUS` values. */
export type InspirationStatus = (typeof INSPIRATION_STATUS)[keyof typeof INSPIRATION_STATUS];
