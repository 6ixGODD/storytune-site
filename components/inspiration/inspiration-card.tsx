'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';

import { track } from '@/lib/analytics';
import { InspirationSummary } from '@/lib/entities/inspiration';

import styles from './inspiration-card.module.scss';

interface InspirationCardProps {
    item: InspirationSummary;
    positionIndex?: number;
}

export default function InspirationCard({ item, positionIndex }: InspirationCardProps) {
    const coverUrl = `/inspiration/${item.slug}/${item.coverPath}`;
    const cardRef = useRef<HTMLElement>(null);
    const viewedRef = useRef(false);

    useEffect(() => {
        const el = cardRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !viewedRef.current) {
                    viewedRef.current = true;
                    track('inspiration_card_view', {
                        template_id: item.slug,
                        template_title: item.title,
                        category: item.category ?? undefined,
                        tags: item.tags ?? undefined,
                    });
                }
            },
            { threshold: 0.4 },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [item]);

    const handleClick = () => {
        track('inspiration_card_click', {
            template_id: item.slug,
            template_title: item.title,
            category: item.category ?? undefined,
            tags: item.tags ?? undefined,
            position_index: positionIndex,
        });
    };

    return (
        <article ref={cardRef} className={styles.card}>
            <a
                href={item.inspirationUrl}
                className={styles.imageLink}
                aria-label={`View ${item.title}`}
                onClick={handleClick}
            >
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
