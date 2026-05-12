import Image from 'next/image';

import { InspirationSummary } from '@/lib/entities/inspiration';

import styles from './inspiration-card.module.scss';

interface InspirationCardProps {
    item: InspirationSummary;
}

export default function InspirationCard({ item }: InspirationCardProps) {
    const coverUrl = `/inspiration/${item.slug}/${item.coverPath}`;

    return (
        <article className={styles.card}>
            <a href={item.inspirationUrl} className={styles.imageLink} aria-label={`View ${item.title}`}>
                <div className={styles.imageWrapper}>
                    <Image
                        src={coverUrl}
                        alt={item.title}
                        fill
                        unoptimized
                        className={styles.image}
                        sizes='(max-width: 500px) 100vw, (max-width: 1100px) 50vw, 33vw'
                    />
                </div>
            </a>
            <div className={styles.info}>
                {item.category && <span className={styles.category}>{item.category}</span>}
                <h3 className={styles.title}>{item.title}</h3>
                {item.tags && item.tags.length > 0 && (
                    <div className={styles.tags}>
                        {item.tags.slice(0, 4).map((tag) => (
                            <span key={tag} className={styles.tag}>
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </article>
    );
}
