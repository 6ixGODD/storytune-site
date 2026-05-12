/**
 * @file lib/services/auth.service.ts
 * Authentication service for admin login and session management.
 *
 * Handles credential verification, JWT issuance, HTTP-only cookie management,
 * and first-run admin account seeding. All functionality is exposed on the
 * `authService` module singleton.
 */
import { cookies } from 'next/headers';

import { config } from '@/lib/config';
import { AUTH_COOKIE_NAME } from '@/lib/constants';
import { Admin } from '@/lib/entities/admin';
import { signToken } from '@/lib/infra/auth';
import { createLogger } from '@/lib/logger';
import { adminRepository } from '@/lib/repositories/admin.repository';

const log = createLogger('auth.service');

export const authService = {
    /**
     * Verify admin credentials and issue a signed JWT on success.
     *
     * @param username - Submitted username.
     * @param password - Plain-text submitted password.
     * @returns `{ success: true, token }` on success or `{ success: false, error }` on failure.
     */
    async login(
        username: string,
        password: string,
    ): Promise<{ success: true; token: string } | { success: false; error: string }> {
        const admin = await adminRepository.findByUsername(username);
        if (!admin || !(await admin.verifyPassword(password))) {
            log.warn({ username }, 'login failed');
            return { success: false, error: 'Invalid credentials' };
        }
        const token = signToken({ adminId: admin.id, username: admin.username });
        log.info({ username }, 'admin logged in');
        return { success: true, token };
    },

    /**
     * Write the JWT to an HTTP-only, same-site cookie in the current response.
     *
     * The `secure` flag is set when running in production mode.
     *
     * @param token - Signed JWT string to store in the cookie.
     */
    async setAuthCookie(token: string): Promise<void> {
        const cookieStore = await cookies();
        cookieStore.set(AUTH_COOKIE_NAME, token, {
            httpOnly: true,
            secure: config.isProd,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });
    },

    /**
     * Create the default admin account if no admin documents exist in the database.
     *
     * Uses credentials from `config.admin.*` (`STORYTUNE__ADMIN_USERNAME` /
     * `STORYTUNE__ADMIN_PASSWORD`). Intended to be called once during application
     * startup or via a protected bootstrap endpoint.
     *
     * @returns `{ seeded: true }` if a new admin was created, `{ seeded: false }` if skipped.
     */
    async seedIfNeeded(): Promise<{ seeded: boolean }> {
        if (await adminRepository.hasAny()) return { seeded: false };
        const admin = await Admin.create(config.admin.username, config.admin.password);
        await adminRepository.insert(admin);
        return { seeded: true };
    },
};
