'use client';

import { CSSProperties, useEffect, useRef } from 'react';

import { defaultClipRevealContent } from '@/lib/defaults/site-content';
import { ClipRevealContent } from '@/lib/entities/site-content';

import styles from './clip-reveal.module.scss';

interface ClipRevealProps {
    content?: ClipRevealContent;
}

export default function ClipReveal({ content = defaultClipRevealContent }: ClipRevealProps) {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 640px)');
        if (!mq.matches) return;

        const section = sectionRef.current;
        if (!section) return;

        const rows = Array.from(section.querySelectorAll<HTMLElement>(`.${styles.row}`));

        const update = () => {
            const vh = window.innerHeight;
            const center = vh * 0.5;
            rows.forEach((row) => {
                const { top, bottom } = row.getBoundingClientRect();
                const rowCenter = (top + bottom) / 2;
                const halfHeight = (bottom - top) * 0.6;
                row.classList.toggle(styles.inView, Math.abs(rowCenter - center) < halfHeight);
            });
        };

        window.addEventListener('scroll', update, { passive: true });
        update();
        return () => window.removeEventListener('scroll', update);
    }, [content.rows]);

    return (
        <section ref={sectionRef} className={styles.section}>
            <div className={styles.container}>
                {content.rows.map((row, index) => (
                    <p key={`${row.primary}-${index}`} className={styles.row}>
                        {row.primary}
                        <span
                            className={styles.hoverSpan}
                            style={
                                {
                                    '--hover-bg': row.hoverBg,
                                    '--hover-color': row.hoverColor,
                                } as CSSProperties
                            }
                        >
                            {row.hover}
                        </span>
                    </p>
                ))}
            </div>
        </section>
    );
}
