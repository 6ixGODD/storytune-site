import { NextRequest } from 'next/server';

import { authErrorResponse, requireAuth } from '@/lib/infra/auth';
import { InspirationUpdateSchema } from '@/lib/schemas/inspirations';
import { inspirationService } from '@/lib/services/inspiration.service';

interface RouteParams {
    params: Promise<{ slug: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
    try {
        await requireAuth();
    } catch {
        return authErrorResponse();
    }

    const { slug } = await params;
    const inspiration = await inspirationService.getBySlug(slug);
    if (!inspiration) {
        return Response.json({ success: false, error: 'Inspiration not found' }, { status: 404 });
    }
    return Response.json({ success: true, data: inspiration });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
    try {
        await requireAuth();
    } catch {
        return authErrorResponse();
    }

    const { slug } = await params;
    const body = await req.json().catch(() => null);
    const parsed = InspirationUpdateSchema.safeParse(body);
    if (!parsed.success) {
        return Response.json(
            { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
            { status: 400 },
        );
    }

    const inspiration = await inspirationService.update(slug, parsed.data);
    if (!inspiration) {
        return Response.json({ success: false, error: 'Inspiration not found' }, { status: 404 });
    }
    return Response.json({ success: true, data: inspiration });
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
    try {
        await requireAuth();
    } catch {
        return authErrorResponse();
    }

    const { slug } = await params;
    const deleted = await inspirationService.softDelete(slug);
    if (!deleted) {
        return Response.json({ success: false, error: 'Inspiration not found or already deleted' }, { status: 404 });
    }
    return Response.json({ success: true });
}
