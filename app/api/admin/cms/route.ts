import { authErrorResponse, requireAuth } from '@/lib/infra/auth';
import { siteContentService } from '@/lib/services/site-content.service';

export async function GET() {
    try {
        await requireAuth();
    } catch {
        return authErrorResponse();
    }

    const data = await siteContentService.getAll();
    return Response.json({ success: true, data });
}
