import { NextRequest } from 'next/server';
import { z } from 'zod';

import { authErrorResponse, requireAuth } from '@/lib/infra/auth';
import { CardUpdateSchema } from '@/lib/schemas/cards';
import { cardService } from '@/lib/services/card.service';

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
    const card = await cardService.getBySlug(slug);
    if (!card) {
        return Response.json({ success: false, error: 'Card not found' }, { status: 404 });
    }
    return Response.json({ success: true, data: card });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
    try {
        await requireAuth();
    } catch {
        return authErrorResponse();
    }

    const { slug } = await params;
    const body = await req.json().catch(() => null);
    const parsed = CardUpdateSchema.safeParse(body);
    if (!parsed.success) {
        return Response.json(
            { success: false, error: 'Validation failed', details: z.flattenError(parsed.error).fieldErrors },
            { status: 400 },
        );
    }

    const card = await cardService.update(slug, parsed.data);
    if (!card) {
        return Response.json({ success: false, error: 'Card not found' }, { status: 404 });
    }
    return Response.json({ success: true, data: card });
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
    try {
        await requireAuth();
    } catch {
        return authErrorResponse();
    }

    const { slug } = await params;
    const deleted = await cardService.softDelete(slug);
    if (!deleted) {
        return Response.json({ success: false, error: 'Card not found or already deleted' }, { status: 404 });
    }
    return Response.json({ success: true });
}
