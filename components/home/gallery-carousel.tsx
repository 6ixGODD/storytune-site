'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

import styles from './gallery-preview.module.scss';

export interface CarouselItem {
    slug: string;
    title: string;
    category: string;
    coverPath: string;
    inspirationUrl: string;
}

export function GalleryCarousel({ items }: { items: CarouselItem[] }) {
    const trackRef = useRef<HTMLUListElement>(null);
    const [active, setActive] = useState(0);

    useEffect(() => {
        const track = trackRef.current;
        if (!track) return;
        function onScroll() {
            const w = track!.clientWidth;
            if (!w) return;
            setActive(Math.round(track!.scrollLeft / w));
        }
        track.addEventListener('scroll', onScroll, { passive: true });
        return () => track.removeEventListener('scroll', onScroll);
    }, []);

    const goTo = useCallback((index: number) => {
        const track = trackRef.current;
        if (!track) return;
        track.scrollTo({ left: index * track.clientWidth, behavior: 'smooth' });
    }, []);

    if (!items.length) {
        return <p className={styles.empty}>No directions available yet.</p>;
    }

    const current = items[active] ?? items[0];

    return (
        <div className={styles.carousel}>
            {/* Scroll track: no position property, so images (position:absolute) escape
                to the nearest positioned ancestor (.carousel). This is the CSS trick that
                lets all slides' images stack on top of each other for the crossfade. */}
            <ul ref={trackRef} className={styles.track} aria-label="Directions carousel">
                {items.map((item, i) => (
                    <li
                        key={item.slug}
                        className={styles.slide}
                        aria-label={`Slide ${i + 1}: ${item.title}`}
                    >
                        <Image
                            src={`/inspiration/${item.slug}/${item.coverPath}`}
                            alt={item.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 960px"
                            className={styles.coverImg}
                            unoptimized
                        />
                    </li>
                ))}
            </ul>

            {/* Caption overlay at bottom */}
            <div className={styles.carouselCaption}>
                <Link href={current.inspirationUrl} className={styles.captionTitle}>
                    {current.title}
                </Link>
                {current.category && <span className={styles.captionCategory}>{current.category}</span>}

                {/* Navigation dots */}
                <div className={styles.dots} role="tablist" aria-label="Slide indicators">
                    {items.map((_, i) => (
                        <button
                            key={i}
                            role="tab"
                            aria-selected={i === active}
                            aria-label={`Go to slide ${i + 1}`}
                            className={`${styles.dot} ${i === active ? styles.dotActive : ''}`}
                            onClick={() => goTo(i)}
                        />
                    ))}
                </div>
            </div>

            {/* Prev / Next */}
            <button
                className={`${styles.navBtn} ${styles.navPrev}`}
                onClick={() => goTo(Math.max(0, active - 1))}
                disabled={active === 0}
                aria-label="Previous direction"
            >
                ‹
            </button>
            <button
                className={`${styles.navBtn} ${styles.navNext}`}
                onClick={() => goTo(Math.min(items.length - 1, active + 1))}
                disabled={active === items.length - 1}
                aria-label="Next direction"
            >
                ›
            </button>
        </div>
    );
}
