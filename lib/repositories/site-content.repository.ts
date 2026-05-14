import { ObjectId } from 'mongodb';

import { DB_COLLECTIONS } from '@/lib/constants';
import { getDb } from '@/lib/db/client';
import { SiteContentKey, SiteContentMap } from '@/lib/entities/site-content';

interface SiteContentDocument {
    _id: ObjectId;
    key: SiteContentKey;
    value: unknown;
    updatedAt: Date;
}

const col = async () => {
    const db = await getDb();
    return db.collection<SiteContentDocument>(DB_COLLECTIONS.SITE_CONTENT);
};

export const siteContentRepository = {
    async getAll(): Promise<Partial<SiteContentMap>> {
        const documents = await (await col()).find({}).toArray();

        return Object.fromEntries(
            documents.map((document) => [document.key, document.value as unknown as SiteContentMap[typeof document.key]]),
        ) as Partial<SiteContentMap>;
    },

    async get<K extends SiteContentKey>(key: K): Promise<SiteContentMap[K] | null> {
        const document = await (await col()).findOne({ key });
        return document ? (document.value as unknown as SiteContentMap[K]) : null;
    },

    async upsert<K extends SiteContentKey>(key: K, value: SiteContentMap[K]): Promise<void> {
        await (await col()).updateOne({ key }, { $set: { key, value, updatedAt: new Date() } }, { upsert: true });
    },
};
