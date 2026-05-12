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

// Same chevron path as the codepen reference (visually centred in its viewBox)
const ChevronRight = () => (
    <svg
        xmlns='http://www.w3.org/2000/svg'
        viewBox='0 0 36 36'
        width='16'
        height='16'
        fill='currentColor'
        aria-hidden='true'
    >
        <path d='M23.5587,16.916 C24.1447,17.4999987 24.1467,18.446 23.5647,19.034 L16.6077,26.056 C16.3147,26.352 15.9287,26.4999987 15.5427,26.4999987 C15.1607,26.4999987 14.7787,26.355 14.4867,26.065 C13.8977,25.482 13.8947,24.533 14.4777,23.944 L20.3818,17.984 L14.4408,12.062 C13.8548,11.478 13.8528,10.5279 14.4378,9.941 C15.0218,9.354 15.9738,9.353 16.5588,9.938 L23.5588,16.916 L23.5587,16.916 Z' />
    </svg>
);

const ChevronLeft = () => (
    <svg
        xmlns='http://www.w3.org/2000/svg'
        viewBox='0 0 36 36'
        width='16'
        height='16'
        fill='currentColor'
        aria-hidden='true'
        style={{ transform: 'rotate(180deg)' }}
    >
        <path d='M23.5587,16.916 C24.1447,17.4999987 24.1467,18.446 23.5647,19.034 L16.6077,26.056 C16.3147,26.352 15.9287,26.4999987 15.5427,26.4999987 C15.1607,26.4999987 14.7787,26.355 14.4867,26.065 C13.8977,25.482 13.8947,24.533 14.4777,23.944 L20.3818,17.984 L14.4408,12.062 C13.8548,11.478 13.8528,10.5279 14.4378,9.941 C15.0218,9.354 15.9738,9.353 16.5588,9.938 L23.5588,16.916 L23.5587,16.916 Z' />
    </svg>
);

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
            {/* track has no `position` — images (position:absolute via Next fill) escape
                to the nearest positioned ancestor (.carousel) and stack for crossfade */}
            <ul ref={trackRef} className={styles.track} aria-label='Directions carousel'>
                {items.map((item, i) => (
                    <li key={item.slug} className={styles.slide} aria-label={`Slide ${i + 1}: ${item.title}`}>
                        <Image
                            src={`/inspiration/${item.slug}/${item.coverPath}`}
                            alt={item.title}
                            fill
                            sizes='(max-width: 768px) 100vw, 1200px'
                            className={styles.coverImg}
                            unoptimized
                        />
                    </li>
                ))}
            </ul>

            {/* Caption overlay */}
            <div className={styles.carouselCaption}>
                <Link href={current.inspirationUrl} className={styles.captionTitle}>
                    {current.title}
                </Link>
                {current.category && <span className={styles.captionCategory}>{current.category}</span>}

                <div className={styles.dots} role='tablist' aria-label='Slide indicators'>
                    {items.map((_, i) => (
                        <button
                            key={i}
                            role='tab'
                            aria-selected={i === active}
                            aria-label={`Go to slide ${i + 1}`}
                            className={`${styles.dot} ${i === active ? styles.dotActive : ''}`}
                            onClick={() => goTo(i)}
                        />
                    ))}
                </div>
            </div>

            <button
                className={`${styles.navBtn} ${styles.navPrev}`}
                onClick={() => goTo(Math.max(0, active - 1))}
                disabled={active === 0}
                aria-label='Previous direction'
            >
                <ChevronLeft />
            </button>
            <button
                className={`${styles.navBtn} ${styles.navNext}`}
                onClick={() => goTo(Math.min(items.length - 1, active + 1))}
                disabled={active === items.length - 1}
                aria-label='Next direction'
            >
                <ChevronRight />
            </button>
        </div>
    );
}
