import { NextRequest } from 'next/server';
import { z } from 'zod';

import { SiteContentKey, SiteContentMap } from '@/lib/entities/site-content';
import { authErrorResponse, requireAuth } from '@/lib/infra/auth';
import { SiteContentKeySchema, siteContentValueSchemas } from '@/lib/schemas/site-content';
import { siteContentService } from '@/lib/services/site-content.service';

interface RouteParams {
    params: Promise<{ key: string }>;
}

function validateKey(rawKey: string): SiteContentKey | null {
    const parsed = SiteContentKeySchema.safeParse(rawKey);
    return parsed.success ? parsed.data : null;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
    try {
        await requireAuth();
    } catch {
        return authErrorResponse();
    }

    const { key: rawKey } = await params;
    const key = validateKey(rawKey);

    if (!key) {
        return Response.json({ success: false, error: 'Invalid CMS key' }, { status: 400 });
    }

    const data = await siteContentService.get(key);
    return Response.json({ success: true, data });
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
    try {
        await requireAuth();
    } catch {
        return authErrorResponse();
    }

    const { key: rawKey } = await params;
    const key = validateKey(rawKey);

    if (!key) {
        return Response.json({ success: false, error: 'Invalid CMS key' }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
        return Response.json({ success: false, error: 'Validation failed', details: { value: ['Expected an object'] } }, { status: 400 });
    }

    const schema = siteContentValueSchemas[key] as z.ZodTypeAny;
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        return Response.json(
            { success: false, error: 'Validation failed', details: z.flattenError(parsed.error).fieldErrors },
            { status: 400 },
        );
    }

    await siteContentService.update(key, parsed.data as SiteContentMap[typeof key]);
    const updated = await siteContentService.get(key);

    return Response.json({ success: true, data: updated });
}
