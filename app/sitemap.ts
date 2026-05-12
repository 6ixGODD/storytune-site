import { MetadataRoute } from 'next';

import { config } from '@/lib/config';

export default function sitemap(): MetadataRoute.Sitemap {
    const base = config.app.baseUrl;
    return [
        { url: base, lastModified: new Date(), changeFrequency: 'monthly', priority: 1 },
        { url: `${base}/inspiration`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    ];
}
