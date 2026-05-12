/**
 * @file lib/infra/auth.ts
 * JWT signing/verification helpers and Next.js cookie utilities for admin authentication.
 *
 * Tokens are signed with the secret and algorithm from `lib/config.ts`.
 * The cookie name is the `AUTH_COOKIE_NAME` constant from `lib/constants.ts`.
 */
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

import { config } from '@/lib/config';
import { AUTH_COOKIE_NAME } from '@/lib/constants';

/** Shape of the data encoded inside every admin JWT. */
export interface JwtPayload {
    /** MongoDB ObjectId hex string of the authenticated admin document. */
    adminId: string;
    /** Username of the authenticated admin. */
    username: string;
}

/**
 * Sign a new JWT for the given payload.
 *
 * @param payload - Data to encode in the token.
 * @returns Signed JWT string.
 */
export function signToken(payload: JwtPayload): string {
    return jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
        algorithm: config.jwt.algorithm as jwt.Algorithm,
    });
}

/**
 * Verify and decode a JWT string.
 *
 * @param token - Raw JWT string.
 * @returns Decoded payload.
 * @throws `JsonWebTokenError` if the token is invalid or expired.
 */
export function verifyToken(token: string): JwtPayload {
    return jwt.verify(token, config.jwt.secret) as JwtPayload;
}

/**
 * Read the admin auth token from the incoming request cookie store.
 *
 * @returns The raw JWT string, or `undefined` if the cookie is absent.
 */
export async function getAuthToken(): Promise<string | undefined> {
    const cookieStore = await cookies();
    return cookieStore.get(AUTH_COOKIE_NAME)?.value;
}

/**
 * Assert that a valid admin JWT is present in the current request.
 *
 * @returns The decoded JWT payload.
 * @throws `Error('Unauthorized')` if the token is missing or invalid.
 */
export async function requireAuth(): Promise<JwtPayload> {
    const token = await getAuthToken();
    if (!token) throw new Error('Unauthorized');
    try {
        return verifyToken(token);
    } catch {
        throw new Error('Unauthorized');
    }
}

/**
 * Build a standard 401 JSON response for unauthorized requests.
 *
 * @returns `Response` with `{ success: false, error: "Unauthorized" }` and status 401.
 */
export function authErrorResponse(): Response {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
}
