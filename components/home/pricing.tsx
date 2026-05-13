'use client';

import Link from 'next/link';
import { CSSProperties, useState } from 'react';

import { ArrowUpRight } from '@/components/ui/arrow-up-right';
import { defaultPricingContent } from '@/lib/defaults/site-content';
import { PricingContent } from '@/lib/entities/site-content';

import styles from './pricing.module.scss';

interface PricingProps {
    content?: PricingContent;
}

function isExternalHref(href: string) {
    return /^https?:\/\//.test(href);
}

export default function Pricing({ content = defaultPricingContent }: PricingProps) {
    const [active, setActive] = useState(content.tiers[0]?.id ?? '');
    const activeTierId = content.tiers.some((tier) => tier.id === active) ? active : (content.tiers[0]?.id ?? '');
    const activeTier = content.tiers.find((tier) => tier.id === activeTierId) ?? content.tiers[0];
    const ctaIsExternal = isExternalHref(content.etsyHref);

    return (
        <section id='pricing' className={styles.section}>
            <div className={styles.inner}>
                <header className={styles.sectionHead}>
                    <p className={styles.eyebrow}>{content.eyebrow}</p>
                    <h2 className={styles.heading}>{content.heading}</h2>
                </header>

                {content.tiers.length > 0 && (
                    <div className={styles.toggleWrap} role='group' aria-label='Select pricing tier'>
                        <div className={styles.control}>
                            <div className={styles.track}>
                                <span
                                    className={styles.indicator}
                                    aria-hidden='true'
                                    style={{ '--shift': content.tiers.findIndex((tier) => tier.id === activeTierId) } as CSSProperties}
                                />
                                {content.tiers.map((tier) => (
                                    <label key={tier.id} className={styles.toggleLabel}>
                                        <input
                                            type='radio'
                                            name='pricing-tier'
                                            value={tier.id}
                                            checked={activeTierId === tier.id}
                                            onChange={() => setActive(tier.id)}
                                            className='sr-only'
                                        />
                                        {tier.label}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTier ? (
                    <div className={styles.card} key={activeTier.id}>
                        <div className={styles.cardTop}>
                            <div className={styles.cardTopLeft}>
                                <div className={styles.price}>
                                    {activeTier.price}
                                    <span className={styles.priceNote}> / invitation</span>
                                </div>
                                <p className={styles.desc}>{activeTier.desc}</p>
                                {ctaIsExternal ? (
                                    <a href={content.etsyHref} target='_blank' rel='noreferrer' className={styles.cta}>
                                        Order on Etsy <ArrowUpRight />
                                    </a>
                                ) : (
                                    <Link href={content.etsyHref} className={styles.cta}>
                                        Order on Etsy <ArrowUpRight />
                                    </Link>
                                )}
                            </div>
                            <div className={styles.cardTopRight}>
                                <p className={styles.tierLabel}>{activeTier.label}</p>
                            </div>
                        </div>
                        <div className={styles.divider} />
                        <ul className={styles.features}>
                            {activeTier.features.map((feature) => (
                                <li key={feature} className={styles.feature}>
                                    <svg
                                        width='12'
                                        height='12'
                                        viewBox='0 0 12 12'
                                        fill='none'
                                        aria-hidden='true'
                                        className={styles.featureIcon}
                                    >
                                        <path
                                            d='M2 6l3 3 5-5'
                                            stroke='currentColor'
                                            strokeWidth='1.5'
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                        />
                                    </svg>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <div className={styles.card}>
                        <p className={styles.desc}>No pricing tiers configured yet.</p>
                    </div>
                )}
            </div>
        </section>
    );
}
