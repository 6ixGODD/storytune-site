'use client';

import { useEffect, useRef } from 'react';

import styles from './text-reveal.module.scss';

const TAGLINES = ['Every invitation is a world of its own.', 'Not a link. An experience.'];

export default function TextReveal() {
    const blocksRef = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        // Native scroll-driven animation (Chrome 115+) — no JS needed
        if (CSS.supports('animation-timeline', 'scroll()')) return;

        const blocks = blocksRef.current.filter(Boolean) as HTMLDivElement[];
        blocks.forEach((block) => {
            block.dataset.fallback = 'true';
        });

        const handleScroll = () => {
            const vh = window.innerHeight;
            blocks.forEach((block) => {
                const sticky = block.querySelector<HTMLElement>(`.${styles.sticky}`);
                if (!sticky) return;

                const rect = block.getBoundingClientRect();
                const blockHeight = block.offsetHeight;
                // progress: 0 when block top enters viewport, 1 when block bottom exits
                const progress = -rect.top / (blockHeight - vh);
                const p = Math.max(0, Math.min(1, progress));

                // 0–0.25: fade+slide in, 0.25–0.75: fully visible, 0.75–1.0: fade+slide out
                let opacity: number;
                let translateY: number;
                if (p < 0.25) {
                    opacity = p / 0.25;
                    translateY = (1 - opacity) * 28;
                } else if (p < 0.75) {
                    opacity = 1;
                    translateY = 0;
                } else {
                    opacity = 1 - (p - 0.75) / 0.25;
                    translateY = -((p - 0.75) / 0.25) * 16;
                }

                sticky.style.setProperty('--reveal-opacity', String(opacity));
                sticky.style.setProperty('--reveal-y', `${translateY}px`);
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            {TAGLINES.map((text, i) => (
                // Each block is 200vh — provides scroll distance for the animation
                <div
                    key={text}
                    className={styles.block}
                    ref={(el) => {
                        blocksRef.current[i] = el;
                    }}
                >
                    <section className={styles.sticky}>
                        <p className={styles.text}>
                            <span className={styles.span}>{text}</span>
                            <span className={styles.glow} aria-hidden='true'>
                                {text}
                            </span>
                        </p>
                    </section>
                </div>
            ))}
        </>
    );
}
