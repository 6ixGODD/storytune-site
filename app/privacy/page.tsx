import type { Metadata } from 'next';

import MarkdownPage from '@/components/legal/markdown-page';
import { siteContentService } from '@/lib/services/site-content.service';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Privacy Policy — StoryTune',
    description: 'How StoryTune collects and uses your information.',
};

export default async function PrivacyPage() {
    const content = await siteContentService.get('legal.privacy');
    return <MarkdownPage markdown={content.markdown} />;
}
