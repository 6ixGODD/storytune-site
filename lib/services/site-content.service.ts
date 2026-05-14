import { defaultSiteContent } from '@/lib/defaults/site-content';
import { SITE_CONTENT_KEYS, SiteContentKey, SiteContentMap } from '@/lib/entities/site-content';
import { siteContentRepository } from '@/lib/repositories/site-content.repository';

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mergeWithDefaults<T>(defaults: T, stored: unknown): T {
    if (Array.isArray(defaults)) {
        return (Array.isArray(stored) ? stored : defaults) as T;
    }

    if (isRecord(defaults)) {
        if (!isRecord(stored)) {
            return defaults;
        }

        const merged = { ...defaults } as Record<string, unknown>;
        for (const [key, value] of Object.entries(defaults)) {
            merged[key] = mergeWithDefaults(value, stored[key]);
        }
        return merged as T;
    }

    return (stored ?? defaults) as T;
}

export const siteContentService = {
    async getAll(): Promise<SiteContentMap> {
        const stored = await siteContentRepository.getAll();

        return Object.fromEntries(
            SITE_CONTENT_KEYS.map((key) => [
                key,
                mergeWithDefaults(defaultSiteContent[key], stored[key]) as SiteContentMap[typeof key],
            ]),
        ) as unknown as SiteContentMap;
    },

    async get<K extends SiteContentKey>(key: K): Promise<SiteContentMap[K]> {
        const stored = await siteContentRepository.get(key);
        return mergeWithDefaults(defaultSiteContent[key], stored);
    },

    async update<K extends SiteContentKey>(key: K, value: SiteContentMap[K]): Promise<void> {
        await siteContentRepository.upsert(key, value);
    },
};
