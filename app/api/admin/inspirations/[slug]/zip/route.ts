import { NextRequest } from 'next/server';

import { config } from '@/lib/config';
import { authErrorResponse, requireAuth } from '@/lib/infra/auth';
import { inspirationService } from '@/lib/services/inspiration.service';

interface RouteParams {
    params: Promise<{ slug: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
    try {
        await requireAuth();
    } catch {
        return authErrorResponse();
    }

    const { slug } = await params;

    const formData = await req.formData().catch(() => null);
    if (!formData) {
        return Response.json({ success: false, error: 'Invalid form data' }, { status: 400 });
    }

    const zipFile = formData.get('zip');
    if (!zipFile || !(zipFile instanceof File)) {
        return Response.json({ success: false, error: 'ZIP file is required' }, { status: 400 });
    }

    const maxBytes = config.storage.maxUploadSizeMb * 1024 * 1024;
    if (zipFile.size > maxBytes) {
        return Response.json(
            { success: false, error: `ZIP file exceeds the ${config.storage.maxUploadSizeMb}MB upload limit` },
            { status: 400 },
        );
    }

    try {
        const zipBuffer = Buffer.from(await zipFile.arrayBuffer());
        const inspiration = await inspirationService.replaceZip(slug, zipBuffer);
        return Response.json({ success: true, data: { slug: inspiration.slug, updatedAt: inspiration.updatedAt } });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Replace failed';
        const status = message === 'Inspiration not found' ? 404 : 500;
        return Response.json({ success: false, error: message }, { status });
    }
}
