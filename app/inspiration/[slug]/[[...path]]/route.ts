import { NextRequest } from 'next/server';

import { readCardFile } from '@/lib/infra/storage';

interface RouteParams {
    params: Promise<{ slug: string; path?: string[] }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
    const { slug, path: pathSegments } = await params;
    const filePath = pathSegments?.join('/');

    try {
        const { buffer, mimeType } = await readCardFile('inspiration', slug, filePath);

        // Inject <base> tag into HTML responses so that relative asset URLs
        // (e.g. `assets/style.css`) resolve to `/inspiration/<slug>/assets/style.css`
        // rather than the parent path `/inspiration/assets/style.css`.
        if (mimeType === 'text/html') {
            let html = buffer.toString('utf-8');
            const base = `<base href="/inspiration/${slug}/">`;
            // Only inject if there is no existing <base> tag.
            if (!html.includes('<base')) {
                html = /<head([^>]*)>/i.test(html)
                    ? html.replace(/<head([^>]*)>/i, `<head$1>${base}`)
                    : `${base}${html}`;
            }
            return new Response(html, {
                headers: {
                    'Content-Type': 'text/html; charset=utf-8',
                    // Don't cache the injected HTML so updates propagate quickly.
                    'Cache-Control': 'no-cache',
                },
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