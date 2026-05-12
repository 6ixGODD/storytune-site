/**
 * @file lib/schemas/rsvp.ts
 * Zod schema for the public RSVP submission endpoint.
 */
import { z } from 'zod';

/** RSVP form submission body schema. */
export const RsvpSchema = z.object({
    slug: z.string().min(1, 'Slug is required'),
    name: z.string().min(1, 'Name is required'),
    email: z.email('Invalid email address'),
    attending: z.enum(['yes', 'no', 'maybe']),
    guests: z.coerce.number().int().min(0).max(20).default(0),
    message: z.string().max(1000).optional(),
});

export type RsvpInput = z.infer<typeof RsvpSchema>;
