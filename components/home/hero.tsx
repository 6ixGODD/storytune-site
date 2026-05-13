'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

import { ArrowUpRight } from '@/components/ui/arrow-up-right';
import { track } from '@/lib/analytics';
import { defaultHeroContent } from '@/lib/defaults/site-content';
import { HeroContent } from '@/lib/entities/site-content';

import styles from './hero.module.scss';

interface HeroProps {
    content?: HeroContent;
}

function isExternalHref(href: string) {
    return /^https?:\/\//.test(href);
}

export default function Hero({ content = defaultHeroContent }: HeroProps) {
    const sectionRef = useRef<HTMLElement>(null);
    const enteredRef = useRef(false);
    const primaryIsExternal = isExternalHref(content.primaryBtnHref);
    const secondaryIsExternal = isExternalHref(content.secondaryBtnHref);

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
                    {content.heading1}
                    <br />
                    <span className={styles.dim}>{content.heading2}</span>
                </h1>
                <p className={styles.sub}>{content.sub}</p>
                <div className={styles.actions}>
                    {primaryIsExternal ? (
                        <a
                            href={content.primaryBtnHref}
                            target='_blank'
                            rel='noreferrer'
                            className={styles.btnPrimary}
                            onClick={() => track('home_cta_click', { cta_name: 'explore_templates', section_name: 'hero' })}
                        >
                            {content.primaryBtnLabel}
                        </a>
                    ) : (
                        <Link
                            href={content.primaryBtnHref}
                            className={styles.btnPrimary}
                            onClick={() => track('home_cta_click', { cta_name: 'explore_templates', section_name: 'hero' })}
                        >
                            {content.primaryBtnLabel}
                        </Link>
                    )}
                    {secondaryIsExternal ? (
                        <a
                            href={content.secondaryBtnHref}
                            target='_blank'
                            rel='noreferrer'
                            className={styles.btnSecondary}
                            onClick={() => track('home_cta_click', { cta_name: 'start_now', section_name: 'hero' })}
                        >
                            {content.secondaryBtnLabel} <ArrowUpRight />
                        </a>
                    ) : (
                        <Link
                            href={content.secondaryBtnHref}
                            className={styles.btnSecondary}
                            onClick={() => track('home_cta_click', { cta_name: 'start_now', section_name: 'hero' })}
                        >
                            {content.secondaryBtnLabel} <ArrowUpRight />
                        </Link>
                    )}
                </div>
            </div>
            <div className={styles.scroll} aria-hidden='true'>
                <span>scroll</span>
                <span className={styles.scrollLine} />
            </div>
        </section>
    );
}
