'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

import { ArrowUpRight } from '@/components/ui/arrow-up-right';
import { track } from '@/lib/analytics';
import { defaultCtaContent } from '@/lib/defaults/site-content';
import { CtaContent } from '@/lib/entities/site-content';

import styles from './cta.module.scss';

interface CtaProps {
    content?: CtaContent;
}

function isExternalHref(href: string) {
    return /^https?:\/\//.test(href);
}

export default function Cta({ content = defaultCtaContent }: CtaProps) {
    const sectionRef = useRef<HTMLElement>(null);
    const enteredRef = useRef(false);
    const buttonIsExternal = isExternalHref(content.btnHref);

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
                    {content.heading1}
                    <br />
                    {content.heading2}
                </h2>
                <p className={styles.sub}>{content.sub}</p>
                {buttonIsExternal ? (
                    <a
                        href={content.btnHref}
                        target='_blank'
                        rel='noreferrer'
                        className={styles.btn}
                        onClick={() => track('home_cta_click', { cta_name: 'create_invitation', section_name: 'cta' })}
                    >
                        {content.btnLabel} <ArrowUpRight />
                    </a>
                ) : (
                    <Link
                        href={content.btnHref}
                        className={styles.btn}
                        onClick={() => track('home_cta_click', { cta_name: 'create_invitation', section_name: 'cta' })}
                    >
                        {content.btnLabel} <ArrowUpRight />
                    </Link>
                )}
            </div>
        </section>
    );
}
