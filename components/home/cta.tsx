'use client';

import { useEffect, useRef } from 'react';

import { ArrowUpRight } from '@/components/ui/arrow-up-right';
import { track } from '@/lib/analytics';

import styles from './cta.module.scss';

export default function Cta() {
    const sectionRef = useRef<HTMLElement>(null);
    const enteredRef = useRef(false);

    useEffect(() => {
        const el = sectionRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !enteredRef.current) {
                    enteredRef.current = true;
                    track('home_section_view', { section_name: 'featured_templates' });
                }
            },
            { threshold: 0.3 },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className={styles.section}>
            <div className={styles.inner}>
                <h2 className={styles.heading}>
                    Your event deserves
                    <br />
                    something unforgettable.
                </h2>
                <p className={styles.sub}>
                    Every invitation we make is a unique, animated digital experience — Designed to be opened slowly.
                    Remembered long after the event ends.
                </p>
                <a
                    href='https://etsy.com'
                    target='_blank'
                    rel='noreferrer'
                    className={styles.btn}
                    onClick={() => track('home_cta_click', { cta_name: 'create_invitation', section_name: 'cta' })}
                >
                    Start on Etsy <ArrowUpRight />
                </a>
            </div>
        </section>
    );
}
