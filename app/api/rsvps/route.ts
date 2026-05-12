import { NextRequest } from 'next/server';

import { RsvpSchema } from '@/lib/schemas/rsvp';
import { rsvpService } from '@/lib/services/rsvp.service';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null);
    const parsed = RsvpSchema.safeParse(body);
    if (!parsed.success) {
        return Response.json(
            { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
            { status: 400, headers: CORS_HEADERS },
        );
    }

    const result = await rsvpService.submit(parsed.data);
    if (!result.success) {
        return Response.json({ success: false, error: result.error }, { status: result.status, headers: CORS_HEADERS });
    }
    return Response.json({ success: true }, { headers: CORS_HEADERS });
}
