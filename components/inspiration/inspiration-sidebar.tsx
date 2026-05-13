'use client';

import Link from 'next/link';

import styles from '@/app/inspiration/inspiration.module.scss';
import { track } from '@/lib/analytics';

interface InspirationSidebarProps {
    categories: string[];
    activeCategory?: string;
    q?: string;
}

function buildCategoryHref(category: string | null, q?: string): string {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (q) params.set('q', q);
    const qs = params.toString();
    return `/inspiration${qs ? `?${qs}` : ''}`;
}

export default function InspirationSidebar({ categories, activeCategory, q }: InspirationSidebarProps) {
    const handleCategoryClick = (cat: string | null) => {
        if (cat) {
            track('inspiration_filter_change', { filter_type: 'category', filter_value: cat });
        }
    };

    return (
        <aside className={styles.sidebar}>
            <p className={styles.sidebarLabel}>Filter</p>
            <nav className={styles.catList}>
                <Link
                    href={buildCategoryHref(null, q)}
                    scroll={false}
                    className={`${styles.catLink}${!activeCategory ? ` ${styles.catActive}` : ''}`}
                    onClick={() => handleCategoryClick(null)}
                >
                    <span>All</span>
                </Link>
                {categories.map((cat) => (
                    <Link
                        key={cat}
                        href={buildCategoryHref(cat, q)}
                        scroll={false}
                        className={`${styles.catLink}${activeCategory === cat ? ` ${styles.catActive}` : ''}`}
                        onClick={() => handleCategoryClick(cat)}
                    >
                        <span>{cat}</span>
                    </Link>
                ))}
            </nav>
        </aside>
    );
}
