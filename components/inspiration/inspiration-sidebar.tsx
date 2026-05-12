import Link from 'next/link';

import styles from '@/app/inspiration/inspiration.module.scss';

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
    return (
        <aside className={styles.sidebar}>
            <p className={styles.sidebarLabel}>Filter</p>
            <nav className={styles.catList}>
                <Link
                    href={buildCategoryHref(null, q)}
                    scroll={false}
                    className={`${styles.catLink}${!activeCategory ? ` ${styles.catActive}` : ''}`}
                >
                    <span>All</span>
                </Link>
                {categories.map((cat) => (
                    <Link
                        key={cat}
                        href={buildCategoryHref(cat, q)}
                        scroll={false}
                        className={`${styles.catLink}${activeCategory === cat ? ` ${styles.catActive}` : ''}`}
                    >
                        <span>{cat}</span>
                    </Link>
                ))}
            </nav>
        </aside>
    );
}
