/**
 * @file lib/schemas/cards.ts
 * Zod schemas for card management API inputs.
 */
import { z } from 'zod';

/** Schema for a single invitee entry (name optional, email required). */
export const InviteeSchema = z.object({
    name: z.string().optional(),
    email: z.email('Invalid email address'),
});

/** Multipart form fields accepted by the card upload endpoint. */
export const CardUploadSchema = z.object({
    slug: z
        .string()
        .min(1)
        .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
        .optional(),
    clientName: z.string().min(1, 'Client name is required'),
    clientEmail: z.email('Invalid client email'),
    title: z.string().optional(),
    eventType: z.string().optional(),
    notes: z.string().optional(),
    invitees: z
        .union([
            z.array(InviteeSchema),
            z.string().transform((s) => {
                try {
                    return JSON.parse(s) as z.infer<typeof InviteeSchema>[];
                } catch {
                    return [];
                }
            }),
        ])
        .optional(),
});

/** Body fields accepted by the card PATCH endpoint. */
export const CardUpdateSchema = z.object({
    clientName: z.string().min(1).optional(),
    clientEmail: z.email().optional(),
    title: z.string().optional(),
    eventType: z.string().optional(),
    notes: z.string().optional(),
    invitees: z.array(InviteeSchema).optional(),
    rateLimit: z
        .object({
            windowMs: z.number().int().min(1000, 'windowMs must be at least 1000ms'),
            maxRequests: z.number().int().min(1, 'maxRequests must be at least 1'),
        })
        .optional(),
    quota: z
        .object({
            maxRequests: z.number().int().min(1, 'maxRequests must be at least 1'),
        })
        .optional(),
});

/** Query parameters for the cards list endpoint. */
export const CardsListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    includeDeleted: z.union([z.boolean(), z.string().transform((v) => v.toLowerCase() === 'true')]).default(false),
});

export type CardUploadInput = z.infer<typeof CardUploadSchema>;
export type CardUpdateInput = z.infer<typeof CardUpdateSchema>;
export type CardsListQuery = z.infer<typeof CardsListQuerySchema>;
export type Invitee = z.infer<typeof InviteeSchema>;
