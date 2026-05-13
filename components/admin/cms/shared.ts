import { SiteContentKey, SiteContentMap } from '@/lib/entities/site-content';

export interface CmsFormProps<K extends SiteContentKey> {
    initialContent: SiteContentMap[K];
}

export async function saveCmsSection<K extends SiteContentKey>(
    key: K,
    value: SiteContentMap[K],
): Promise<SiteContentMap[K]> {
    const response = await fetch(`/api/admin/cms/${encodeURIComponent(key)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value),
    });

    const data = (await response.json().catch(() => null)) as { success?: boolean; data?: SiteContentMap[K]; error?: string } | null;

    if (!response.ok || !data?.success || !data.data) {
        throw new Error(data?.error ?? 'Failed to save content');
    }

    return data.data;
}
