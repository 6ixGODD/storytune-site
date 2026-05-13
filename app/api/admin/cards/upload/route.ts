import { NextRequest } from 'next/server';
import { z } from 'zod';

import { config } from '@/lib/config';
import { authErrorResponse, requireAuth } from '@/lib/infra/auth';
import { CardUploadSchema } from '@/lib/schemas/cards';
import { cardService } from '@/lib/services/card.service';

export async function POST(req: NextRequest) {
    try {
        await requireAuth();
    } catch {
        return authErrorResponse();
    }

    const formData = await req.formData().catch(() => null);
    if (!formData) {
        return Response.json({ success: false, error: 'Invalid form data' }, { status: 400 });
    }

    const fields: Record<string, unknown> = {};
    for (const [key, value] of formData.entries()) {
        if (key === 'zip') continue;
        // Treat blank slug as absent so the service auto-generates a UUID.
        if (key === 'slug' && typeof value === 'string' && value.trim() === '') continue;
        fields[key] = value;
    }

    const parsed = CardUploadSchema.safeParse(fields);
    if (!parsed.success) {
        return Response.json(
            { success: false, error: 'Validation failed', details: z.flattenError(parsed.error).fieldErrors },
            { status: 400 },
        );
    }

    const zipFile = formData.get('zip');
    if (!zipFile || !(zipFile instanceof File)) {
        return Response.json({ success: false, error: 'ZIP file is required' }, { status: 400 });
    }

    const maxBytes = config.storage.maxUploadSizeMb * 1024 * 1024;
    if (zipFile.size > maxBytes) {
        return Response.json(
            {
                success: false,
                error: `ZIP file exceeds the ${config.storage.maxUploadSizeMb}MB upload limit`,
            },
            { status: 400 },
        );
    }

    try {
        const zipBuffer = Buffer.from(await zipFile.arrayBuffer());
        const card = await cardService.uploadFromZip(zipBuffer, parsed.data);
        return Response.json({
            success: true,
            data: {
                slug: card.slug,
                clientName: card.clientName,
                clientEmail: card.clientEmail,
                inviteeCount: card.inviteeCount,
                cardUrl: card.cardUrl,
                status: card.status,
            },
        });
    } catch (err) {
        return Response.json(
            { success: false, error: err instanceof Error ? err.message : 'Upload failed' },
            { status: 500 },
        );
    }
}
