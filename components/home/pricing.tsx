'use client';

import { useState } from 'react';

import styles from './pricing.module.scss';

type Tier = 'template' | 'light' | 'deep';

const TIERS = [
    {
        id: 'template' as Tier,
        label: 'Directions',
        price: '$9.99',
        desc: 'Pick a ready-made design from the inspiration gallery and swap in your details. Delivered within 24h.',
        features: ['Choose from gallery', 'Text & date swap', '24h delivery', 'Digital send link'],
    },
    {
        id: 'light' as Tier,
        label: 'Tailored',
        price: '$19.99',
        desc: 'Start from an inspiration template, then we adjust elements, palette, and typography to match your vision.',
        features: ['Based on a template', 'Element adjustments', 'Custom colour & font', '2 revisions included'],
    },
    {
        id: 'deep' as Tier,
        label: 'Fully Bespoke',
        price: '$39.99',
        desc: 'Built from scratch to your brief. Full motion, custom music, bespoke interactions — no limits.',
        features: ['From zero brief', 'Full motion design', 'Custom soundtrack', '2 revisions included'],
    },
];

export default function Pricing() {
    const [active, setActive] = useState<Tier>('template');
    const activeTier = TIERS.find((t) => t.id === active)!;

    return (
        <section id='pricing' className={styles.section}>
            <div className={styles.inner}>
                <header className={styles.sectionHead}>
                    <p className={styles.eyebrow}>Pricing</p>
                    <h2 className={styles.heading}>Choose your style</h2>
                </header>

                {/* Pill toggle — from dynamic-toggle-with-type-radio-has */}
                <div className={styles.toggleWrap} role='group' aria-label='Select pricing tier'>
                    <div className={styles.control}>
                        <div className={styles.track}>
                            <span
                                className={styles.indicator}
                                aria-hidden='true'
                                style={{ '--shift': TIERS.findIndex((t) => t.id === active) } as React.CSSProperties}
                            />
                            {TIERS.map((tier) => (
                                <label key={tier.id} className={styles.toggleLabel}>
                                    <input
                                        type='radio'
                                        name='pricing-tier'
                                        value={tier.id}
                                        checked={active === tier.id}
                                        onChange={() => setActive(tier.id)}
                                        className='sr-only'
                                    />
                                    {tier.label}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Tier detail card */}
                {/* Use `key={active}` so React remounts the card → triggers CSS fade-in animation on tier switch */}
                <div className={styles.card} key={active}>
                    <div className={styles.cardTop}>
                        <div className={styles.cardTopLeft}>
                            <div className={styles.price}>
                                {activeTier.price}
                                <span className={styles.priceNote}> / invitation</span>
                            </div>
                            <p className={styles.desc}>{activeTier.desc}</p>
                            <a href='https://etsy.com' target='_blank' rel='noreferrer' className={styles.cta}>
                                Order on Etsy ↗
                            </a>
                        </div>
                        <div className={styles.cardTopRight}>
                            <p className={styles.tierLabel}>{activeTier.label}</p>
                        </div>
                    </div>
                    <div className={styles.divider} />
                    <ul className={styles.features}>
                        {activeTier.features.map((f) => (
                            <li key={f} className={styles.feature}>
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
                                {f}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
}
