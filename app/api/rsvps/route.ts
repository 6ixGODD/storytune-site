import { NextRequest } from 'next/server';

import { RsvpSchema } from '@/lib/schemas/rsvp';
import { rsvpService } from '@/lib/services/rsvp.service';

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null);
    const parsed = RsvpSchema.safeParse(body);
    if (!parsed.success) {
        return Response.json(
            { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
            { status: 400 },
        );
    }

    const result = await rsvpService.submit(parsed.data);
    if (!result.success) {
        return Response.json({ success: false, error: result.error }, { status: result.status });
    }
    return Response.json({ success: true });
}
