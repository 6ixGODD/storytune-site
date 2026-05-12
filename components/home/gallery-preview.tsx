import Image from 'next/image';
import Link from 'next/link';

import { inspirationService } from '@/lib/services/inspiration.service';

import styles from './gallery-preview.module.scss';

export default async function GalleryPreview() {
    const previews = await inspirationService.getPreview(3);

    return (
        <section className={styles.section}>
            <div className={styles.inner}>
                <header className={styles.sectionHead}>
                    <p className={styles.eyebrow}>Directions</p>
                    <h2 className={styles.heading}>Browse directions</h2>
                </header>

                <div className={styles.grid}>
                    {previews.length === 0 ? (
                        <p className={styles.empty}>No directions available yet.</p>
                    ) : (
                        previews.map((item) => (
                            <Link key={item.slug} href={item.inspirationUrl} className={styles.card}>
                                <div className={styles.thumb}>
                                    <Image
                                        src={`/inspiration/${item.slug}/${item.coverPath}`}
                                        alt={item.title}
                                        className={styles.cover}
                                        loading='lazy'
                                    />
                                </div>
                                <div className={styles.cardMeta}>
                                    <span className={styles.cardLabel}>{item.title}</span>
                                    {item.category && <span className={styles.cardCategory}>{item.category}</span>}
                                </div>
                            </Link>
                        ))
                    )}
                </div>

                <div className={styles.footer}>
                    <Link href='/inspiration' className={styles.galleryLink}>
                        View all directions ↗
                    </Link>
                </div>
            </div>
        </section>
    );
}
