import Link from 'next/link';

import { CarouselItem, GalleryCarousel } from '@/components/home/gallery-carousel';
import { ArrowUpRight } from '@/components/ui/arrow-up-right';
import { inspirationService } from '@/lib/services/inspiration.service';

import styles from './gallery-preview.module.scss';

export default async function GalleryPreview() {
    const previews = await inspirationService.getPreview(3);

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
                    <p className={styles.eyebrow}>Directions</p>
                    <h2 className={styles.heading}>Browse directions</h2>
                </header>

                <GalleryCarousel items={items} />

                <div className={styles.footer}>
                    <Link href='/inspiration' className={styles.galleryLink}>
                    View all directions <ArrowUpRight />
                    </Link>
                </div>
            </div>
        </section>
    );
}
