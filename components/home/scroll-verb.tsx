'use client';

import { CSSProperties, useEffect, useRef } from 'react';

import { defaultScrollVerbContent } from '@/lib/defaults/site-content';
import { ScrollVerbContent } from '@/lib/entities/site-content';

import styles from './scroll-verb.module.scss';

interface ScrollVerbProps {
    content?: ScrollVerbContent;
}

export default function ScrollVerb({ content = defaultScrollVerbContent }: ScrollVerbProps) {
    const listRef = useRef<HTMLUListElement>(null);
    const headerRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 640px)');
        if (!mq.matches) return;

        const list = listRef.current;
        const header = headerRef.current;
        if (!list || !header) return;

        const items = Array.from(list.querySelectorAll<HTMLLIElement>('li'));

        const update = () => {
            const vh = window.innerHeight;
            const lh = parseFloat(getComputedStyle(header).lineHeight);
            const target = vh * 0.5 + lh;

            let bestIdx = 0;
            let bestDist = Infinity;
            items.forEach((item, index) => {
                const { top, bottom } = item.getBoundingClientRect();
                const dist = Math.abs((top + bottom) / 2 - target);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestIdx = index;
                }
            });

            const withinRange = bestDist < lh * 0.75;
            items.forEach((item, index) => item.classList.toggle(styles.active, withinRange && index === bestIdx));
        };

        window.addEventListener('scroll', update, { passive: true });
        update();
        return () => window.removeEventListener('scroll', update);
    }, [content.verbs]);

    return (
        <div className={styles.outer}>
            <span className='sr-only'>
                {content.prefix} {content.verbs.map((verb) => verb.text).join(', ')}
            </span>
            <header
                ref={headerRef}
                className={styles.header}
                style={{ '--count': content.verbs.length } as CSSProperties}
                aria-hidden='true'
            >
                <div className={styles.track}>
                    <h2 className={styles.prefix}>
                        {content.prefix}
                        &nbsp;
                    </h2>
                    <ul ref={listRef} className={styles.list}>
                        {content.verbs.map((verb) => (
                            <li
                                key={`${verb.text}-${verb.color}`}
                                className={styles.item}
                                style={{ '--verb-color': verb.color } as CSSProperties}
                            >
                                {verb.text}
                            </li>
                        ))}
                    </ul>
                </div>
            </header>
        </div>
    );
}
