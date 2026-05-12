import { describe, expect, it } from 'vitest';

import { LoginSchema } from '@/lib/schemas/auth';

describe('LoginSchema', () => {
    it('accepts valid username and password', () => {
        const result = LoginSchema.safeParse({ username: 'admin', password: 'secret' });
        expect(result.success).toBe(true);
    });

    it('rejects empty username', () => {
        const result = LoginSchema.safeParse({ username: '', password: 'secret' });
        expect(result.success).toBe(false);
        expect(result.error?.flatten().fieldErrors.username).toBeDefined();
    });

    it('rejects empty password', () => {
        const result = LoginSchema.safeParse({ username: 'admin', password: '' });
        expect(result.success).toBe(false);
        expect(result.error?.flatten().fieldErrors.password).toBeDefined();
    });

    it('rejects missing fields', () => {
        const result = LoginSchema.safeParse({});
        expect(result.success).toBe(false);
    });

    it('parses valid input correctly', () => {
        const data = LoginSchema.parse({ username: 'u', password: 'p' });
        expect(data).toEqual({ username: 'u', password: 'p' });
    });
});
