import { NextRequest } from 'next/server';

import { config } from '@/lib/config';
import { LoginSchema } from '@/lib/schemas/auth';
import { authService } from '@/lib/services/auth.service';

export async function POST(req: NextRequest) {
    // Seed the first admin account on first login attempt (idempotent).
    await authService.seedIfNeeded();

    const body = await req.json().catch(() => null);
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
        return Response.json(
            { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
            { status: 400 },
        );
    }

    const result = await authService.login(parsed.data.username, parsed.data.password);
    if (!result.success) {
        return Response.json({ success: false, error: result.error }, { status: 401 });
    }

    await authService.setAuthCookie(result.token);
    return Response.json({ success: true });
}

/** Dev-only: seed the first admin account if none exists. */
export async function GET() {
    if (!config.isDev) {
        return Response.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    const { seeded } = await authService.seedIfNeeded();
    return Response.json({ success: true, message: seeded ? 'Admin seeded' : 'Admin already exists' });
}
