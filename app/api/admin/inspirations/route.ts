import { NextRequest } from 'next/server';
import { z } from 'zod';

import { authErrorResponse, requireAuth } from '@/lib/infra/auth';
import { InspirationsListQuerySchema } from '@/lib/schemas/inspirations';
import { inspirationService } from '@/lib/services/inspiration.service';

export async function GET(req: NextRequest) {
    try {
        await requireAuth();
    } catch {
        return authErrorResponse();
    }

    const { searchParams } = new URL(req.url);
    const parsed = InspirationsListQuerySchema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success) {
        return Response.json(
            { success: false, error: 'Validation failed', details: z.flattenError(parsed.error).fieldErrors },
            { status: 400 },
        );
    }

    const data = await inspirationService.list(parsed.data);
    return Response.json({ success: true, data });
}
