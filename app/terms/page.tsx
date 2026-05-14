import type { Metadata } from 'next';

import MarkdownPage from '@/components/legal/markdown-page';
import { siteContentService } from '@/lib/services/site-content.service';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Terms of Service — StoryTune',
    description: 'Terms and conditions for using StoryTune.',
};

export default async function TermsPage() {
    const content = await siteContentService.get('legal.terms');
    return <MarkdownPage markdown={content.markdown} />;
}
