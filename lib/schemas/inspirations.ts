/**
 * @file lib/schemas/inspirations.ts
 * Zod schemas for inspiration management API inputs.
 */
import { z } from 'zod';

const slugField = z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
    .optional();

/** Tags can be sent as a JSON array string or a comma-separated string from multipart forms. */
const tagsField = z
    .union([
        z.array(z.string().min(1)),
        z.string().transform((s) => {
            try {
                const parsed = JSON.parse(s);
                return Array.isArray(parsed) ? (parsed as string[]) : s.split(',').map((t) => t.trim()).filter(Boolean);
            } catch {
                return s.split(',').map((t) => t.trim()).filter(Boolean);
            }
        }),
    ])
    .optional();

/** `preview` can arrive as a boolean or as the string "true"/"false" in multipart forms. */
const previewField = z
    .union([z.boolean(), z.string().transform((s) => s === 'true')])
    .optional();

/** Multipart form fields accepted by the inspiration upload endpoint. */
export const InspirationUploadSchema = z.object({
    slug: slugField,
    title: z.string().min(1, 'Title is required'),
    category: z.string().min(1, 'Category is required'),
    tags: tagsField,
    /**
     * Relative path to the cover image within the uploaded dist.
     * Must point to an existing file (e.g. `"assets/hero.jpg"`).
     */
    coverPath: z.string().min(1, 'Cover path is required'),
    description: z.string().optional(),
    preview: previewField,
});

/** Body fields accepted by the inspiration PATCH endpoint. */
export const InspirationUpdateSchema = z.object({
    title: z.string().min(1).optional(),
    category: z.string().min(1).optional(),
    tags: z.array(z.string().min(1)).optional(),
    coverPath: z.string().min(1).optional(),
    description: z.string().optional(),
    preview: z.boolean().optional(),
});

/** Query parameters for the inspirations list endpoint. */
export const InspirationsListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    /** Filter to a specific category when provided. */
    category: z.string().optional(),
    includeDeleted: z.coerce.boolean().default(false),
});

export type InspirationUploadInput = z.infer<typeof InspirationUploadSchema>;
export type InspirationUpdateInput = z.infer<typeof InspirationUpdateSchema>;
export type InspirationsListQuery = z.infer<typeof InspirationsListQuerySchema>;
