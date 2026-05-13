'use client';

import { useEffect, useRef } from 'react';

import { defaultTextRevealContent } from '@/lib/defaults/site-content';
import { TextRevealContent } from '@/lib/entities/site-content';

import styles from './text-reveal.module.scss';

interface TextRevealProps {
    content?: TextRevealContent;
}

export default function TextReveal({ content = defaultTextRevealContent }: TextRevealProps) {
    const blocksRef = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
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
                const progress = -rect.top / (blockHeight - vh);
                const p = Math.max(0, Math.min(1, progress));

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
    }, [content.taglines]);

    return (
        <>
            {content.taglines.map((text, index) => (
                <div
                    key={`${text}-${index}`}
                    className={styles.block}
                    ref={(element) => {
                        blocksRef.current[index] = element;
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
