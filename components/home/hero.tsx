'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

import { ArrowUpRight } from '@/components/ui/arrow-up-right';
import { track } from '@/lib/analytics';

import styles from './hero.module.scss';

export default function Hero() {
    const sectionRef = useRef<HTMLElement>(null);
    const enteredRef = useRef(false);

    useEffect(() => {
        const el = sectionRef.current;
        if (!el) return;
        const startTime = Date.now();
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !enteredRef.current) {
                    enteredRef.current = true;
                    track('home_section_view', {
                        section_name: 'hero',
                        visible_duration_ms: Date.now() - startTime,
                    });
                }
            },
            { threshold: 0.3 },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className={styles.hero}>
            <div className={styles.inner}>
                <h1 className={styles.heading}>
                    Not just an invitation.
                    <br />
                    <span className={styles.dim}>An experience.</span>
                </h1>
                <p className={styles.sub}>Animated digital invitations crafted with motion, atmosphere and emotion.</p>
                <div className={styles.actions}>
                    <Link
                        href='/inspiration'
                        className={styles.btnPrimary}
                        onClick={() => track('home_cta_click', { cta_name: 'explore_templates', section_name: 'hero' })}
                    >
                        Browse Directions
                    </Link>
                    <a
                        href='https://etsy.com'
                        target='_blank'
                        rel='noreferrer'
                        className={styles.btnSecondary}
                        onClick={() => track('home_cta_click', { cta_name: 'start_now', section_name: 'hero' })}
                    >
                        Order on Etsy <ArrowUpRight />
                    </a>
                </div>
            </div>
            <div className={styles.scroll} aria-hidden='true'>
                <span>scroll</span>
                <span className={styles.scrollLine} />
            </div>
        </section>
    );
}
