/**
 * @file lib/infra/page-auth.ts
 * Server-side auth guard for admin page components.
 * Redirects to /admin/login when the JWT is missing or invalid.
 */
import { redirect } from 'next/navigation';

import { JwtPayload } from '@/lib/infra/auth';
import { getAuthToken, verifyToken } from '@/lib/infra/auth';

export async function requirePageAuth(): Promise<JwtPayload> {
    const token = await getAuthToken();
    if (!token) redirect('/admin/login');
    try {
        return verifyToken(token);
    } catch {
        redirect('/admin/login');
    }
}
