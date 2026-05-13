import Link from 'next/link';

import { CarouselItem, GalleryCarousel } from '@/components/home/gallery-carousel';
import { ArrowUpRight } from '@/components/ui/arrow-up-right';
import { defaultGalleryContent } from '@/lib/defaults/site-content';
import { GalleryContent } from '@/lib/entities/site-content';
import { inspirationService } from '@/lib/services/inspiration.service';

import styles from './gallery-preview.module.scss';

interface GalleryPreviewProps {
    content?: GalleryContent;
}

function isExternalHref(href: string) {
    return /^https?:\/\//.test(href);
}

export default async function GalleryPreview({ content = defaultGalleryContent }: GalleryPreviewProps) {
    const previews = await inspirationService.getPreview(3);
    const viewAllIsExternal = isExternalHref(content.viewAllHref);

    const items: CarouselItem[] = previews.map((item) => ({
        slug: item.slug,
        title: item.title,
        category: item.category ?? '',
        coverPath: item.coverPath,
        inspirationUrl: item.inspirationUrl,
    }));

    return (
        <section className={styles.section}>
            <div className={styles.inner}>
                <header className={styles.sectionHead}>
                    <p className={styles.eyebrow}>{content.eyebrow}</p>
                    <h2 className={styles.heading}>{content.heading}</h2>
                </header>

                <GalleryCarousel items={items} />

                <div className={styles.footer}>
                    {viewAllIsExternal ? (
                        <a href={content.viewAllHref} target='_blank' rel='noreferrer' className={styles.galleryLink}>
                            {content.viewAllLabel} <ArrowUpRight />
                        </a>
                    ) : (
                        <Link href={content.viewAllHref} className={styles.galleryLink}>
                            {content.viewAllLabel} <ArrowUpRight />
                        </Link>
                    )}
                </div>
            </div>
        </section>
    );
}
