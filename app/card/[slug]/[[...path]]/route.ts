import { NextRequest } from 'next/server';

import { getDb } from '@/lib/db/client';
import { readCardFile } from '@/lib/infra/storage';

interface RouteParams {
    params: Promise<{ slug: string; path?: string[] }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
    const { slug, path: pathSegments } = await params;
    const filePath = pathSegments?.join('/');

    try {
        const db = await getDb();
        const card = await db.collection('cards').findOne({ slug });

        if (!card || card.status !== 'active') {
            return new Response('Not Found', { status: 404 });
        }

        const { buffer, mimeType } = await readCardFile('uploaded', slug, filePath);

        return new Response(new Uint8Array(buffer), {
            headers: {
                'Content-Type': mimeType,
                'Cache-Control': 'public, max-age=3600',
            },
        });
    } catch {
        return new Response('Not Found', { status: 404 });
    }
}
