import { authErrorResponse, requireAuth } from '@/lib/infra/auth';

export async function GET() {
    try {
        const payload = await requireAuth();
        return Response.json({ success: true, data: payload });
    } catch {
        return authErrorResponse();
    }
}
