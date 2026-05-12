'use client';

import React, { useEffect, useRef } from 'react';

import styles from './scroll-verb.module.scss';

const VERBS = [
    { text: 'design.', color: 'hsl(38 18% 72%)' },
    { text: 'animate.', color: 'hsl(162 22% 62%)' },
    { text: 'delight.', color: 'hsl(338 24% 68%)' },
    { text: 'personalise.', color: 'hsl(252 22% 72%)' },
    { text: 'surprise.', color: 'hsl(18 22% 66%)' },
    { text: 'remember.', color: 'hsl(207 22% 66%)' },
];

export default function ScrollVerb() {
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
            // lh in px from the header's computed line-height
            const lh = parseFloat(getComputedStyle(header).lineHeight);
            // target = centre of the bright zone on mobile (50svh + 1lh)
            const target = vh * 0.5 + lh;

            let bestIdx = 0;
            let bestDist = Infinity;
            items.forEach((item, i) => {
                const { top, bottom } = item.getBoundingClientRect();
                const dist = Math.abs((top + bottom) / 2 - target);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestIdx = i;
                }
            });

            // Only activate if within ¾ lh — prevents stale highlight when section
            // is fully above/below the viewport or "remember" drifts into prefix zone.
            const withinRange = bestDist < lh * 0.75;
            items.forEach((item, i) => item.classList.toggle(styles.active, withinRange && i === bestIdx));
        };

        window.addEventListener('scroll', update, { passive: true });
        update();
        return () => window.removeEventListener('scroll', update);
    }, []);

    return (
        <div className={styles.outer}>
            <span className='sr-only'>We help you {VERBS.map((v) => v.text).join(', ')}</span>
            <header
                ref={headerRef}
                className={styles.header}
                style={{ '--count': VERBS.length } as React.CSSProperties}
                aria-hidden='true'
            >
                <div className={styles.track}>
                    <h2 className={styles.prefix}>we help you&nbsp;</h2>
                    <ul ref={listRef} className={styles.list}>
                        {VERBS.map((verb) => (
                            <li
                                key={verb.text}
                                className={styles.item}
                                style={{ '--verb-color': verb.color } as React.CSSProperties}
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
