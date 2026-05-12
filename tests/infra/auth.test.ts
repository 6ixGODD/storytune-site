import { afterEach, describe, expect, it, vi } from 'vitest';

// Must mock next/headers before importing modules that transitively use it.
vi.mock('next/headers', () => ({
    cookies: vi.fn(),
}));

import { cookies } from 'next/headers';

import { authErrorResponse, requireAuth, signToken, verifyToken } from '@/lib/infra/auth';

describe('signToken() / verifyToken()', () => {
    it('round-trips a payload correctly', () => {
        const payload = { adminId: 'abc123', username: 'admin' };
        const token = signToken(payload);
        const decoded = verifyToken(token);

        expect(decoded.adminId).toBe(payload.adminId);
        expect(decoded.username).toBe(payload.username);
    });

    it('signToken returns a non-empty JWT string', () => {
        const token = signToken({ adminId: 'id', username: 'u' });
        expect(typeof token).toBe('string');
        expect(token.split('.').length).toBe(3);
    });

    it('verifyToken throws on a tampered token', () => {
        const token = signToken({ adminId: 'id', username: 'u' });
        const tampered = token.slice(0, -4) + 'xxxx';
        expect(() => verifyToken(tampered)).toThrow();
    });

    it('verifyToken throws on a completely invalid string', () => {
        expect(() => verifyToken('not.a.jwt')).toThrow();
    });

    it('verifyToken throws on an expired token', async () => {
        // Sign with very short expiry and wait for it to expire
        // We sign manually with jsonwebtoken to use -1s expiry
        const jwt = await import('jsonwebtoken');
        const { config } = await import('@/lib/config');
        const expiredToken = jwt.default.sign({ adminId: 'x', username: 'u' }, config.jwt.secret, {
            expiresIn: -1,
        });
        expect(() => verifyToken(expiredToken)).toThrow();
    });
});

describe('authErrorResponse()', () => {
    it('returns a Response with status 401', () => {
        const response = authErrorResponse();
        expect(response.status).toBe(401);
    });

    it('returns JSON body with success: false', async () => {
        const response = authErrorResponse();
        const body = await response.json();
        expect(body).toEqual({ success: false, error: 'Unauthorized' });
    });
});

describe('requireAuth()', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('returns payload when a valid token cookie is present', async () => {
        const payload = { adminId: 'id1', username: 'admin' };
        const token = signToken(payload);

        vi.mocked(cookies).mockResolvedValue({
            get: (name: string) => (name === 'auth_token' ? { value: token } : undefined),
        } as ReturnType<typeof cookies> extends Promise<infer R> ? R : never);

        const result = await requireAuth();
        expect(result.adminId).toBe('id1');
        expect(result.username).toBe('admin');
    });

    it('throws Unauthorized when no cookie is present', async () => {
        vi.mocked(cookies).mockResolvedValue({
            get: () => undefined,
        } as ReturnType<typeof cookies> extends Promise<infer R> ? R : never);

        await expect(requireAuth()).rejects.toThrow('Unauthorized');
    });

    it('throws Unauthorized when cookie contains an invalid token', async () => {
        vi.mocked(cookies).mockResolvedValue({
            get: () => ({ value: 'invalid.token.here' }),
        } as ReturnType<typeof cookies> extends Promise<infer R> ? R : never);

        await expect(requireAuth()).rejects.toThrow('Unauthorized');
    });
});
