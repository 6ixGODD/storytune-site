import { NextRequest } from 'next/server';
import { z } from 'zod';

import { authErrorResponse, requireAuth } from '@/lib/infra/auth';
import { CardsListQuerySchema } from '@/lib/schemas/cards';
import { cardService } from '@/lib/services/card.service';

export async function GET(req: NextRequest) {
    try {
        await requireAuth();
    } catch {
        return authErrorResponse();
    }

    const { searchParams } = new URL(req.url);
    const parsed = CardsListQuerySchema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success) {
        return Response.json(
            { success: false, error: 'Validation failed', details: z.flattenError(parsed.error).fieldErrors },
            { status: 400 },
        );
    }

    const data = await cardService.list(parsed.data);
    return Response.json({ success: true, data });
}
