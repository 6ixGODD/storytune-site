import { AdminShell } from '@/components/admin/admin-shell';
import { CmsEditor } from '@/components/admin/cms/cms-editor';
import { requirePageAuth } from '@/lib/infra/page-auth';
import { siteContentService } from '@/lib/services/site-content.service';

export const dynamic = 'force-dynamic';

export default async function CmsPage() {
    await requirePageAuth();
    const content = await siteContentService.getAll();

    return (
        <AdminShell>
            <div>
                <h1 className='text-2xl font-semibold'>Content</h1>
                <p className='mt-0.5 text-sm text-muted-foreground'>Edit website copy, navigation, pricing, and homepage sections.</p>
            </div>
            <CmsEditor content={content} />
        </AdminShell>
    );
}
