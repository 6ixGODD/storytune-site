import { NextRequest } from 'next/server';

import { readCardFile } from '@/lib/infra/storage';
import { cardRepository } from '@/lib/repositories/card.repository';

interface RouteParams {
    params: Promise<{ slug: string; path?: string[] }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
    const { slug, path: pathSegments } = await params;
    const filePath = pathSegments?.join('/');

    try {
        const card = await cardRepository.findActiveBySlug(slug);

        if (!card) {
            return new Response('Not Found', { status: 404 });
        }

        const { buffer, mimeType } = await readCardFile('uploaded', slug, filePath);

        if (mimeType === 'text/html') {
            let html = buffer.toString('utf-8');
            const base = `<base href="/card/${slug}/">`;
            if (!html.includes('<base')) {
                html = /<head([^>]*)>/i.test(html)
                    ? html.replace(/<head([^>]*)>/i, `<head$1>${base}`)
                    : `${base}${html}`;
            }
            return new Response(html, {
                headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' },
            });
        }

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
