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
