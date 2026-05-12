import Link from 'next/link';

import styles from './gallery-preview.module.scss';

// Placeholder cards for homepage preview
const PREVIEW_CARDS = [
    { id: 'floral-dream', label: 'Floral Dream' },
    { id: 'minimal-noir', label: 'Minimal Noir' },
    { id: 'golden-hour', label: 'Golden Hour' },
];

export default function GalleryPreview() {
    return (
        <section className={styles.section}>
            <div className={styles.inner}>
                <header className={styles.sectionHead}>
                    <p className={styles.eyebrow}>Directions</p>
                    <h2 className={styles.heading}>Browse directions</h2>
                </header>

                <div className={styles.grid}>
                    {PREVIEW_CARDS.map((card) => (
                        <div key={card.id} className={styles.card}>
                            <div className={styles.thumb}>
                                <span className={styles.cardLabel}>{card.label}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className={styles.footer}>
                    <Link href='/inspiration' className={styles.galleryLink}>
                        View all directions ↗
                    </Link>
                </div>
            </div>
        </section>
    );
}
