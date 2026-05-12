/**
 * @file lib/schemas/auth.ts
 * Zod schemas for admin authentication API inputs.
 */
import { z } from 'zod';

/** Login request body schema. */
export const LoginSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof LoginSchema>;
