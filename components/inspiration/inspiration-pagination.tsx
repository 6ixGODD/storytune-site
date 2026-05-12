import Link from 'next/link';

import styles from '@/app/inspiration/inspiration.module.scss';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    /** Current URL search params (category, q, etc.) to preserve in page links. */
    searchParams: Record<string, string>;
}

function getPageRange(current: number, total: number): (number | '...')[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (current > 3) pages.push('...');
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push('...');
    pages.push(total);
    return pages;
}

function buildHref(page: number, searchParams: Record<string, string>): string {
    const p = new URLSearchParams(searchParams);
    p.set('page', String(page));
    return `/inspiration?${p.toString()}`;
}

export default function InspirationPagination({ currentPage, totalPages, searchParams }: PaginationProps) {
    const pages = getPageRange(currentPage, totalPages);
    const prevHref = currentPage > 1 ? buildHref(currentPage - 1, searchParams) : null;
    const nextHref = currentPage < totalPages ? buildHref(currentPage + 1, searchParams) : null;

    return (
        <nav className={styles.pagination} aria-label='Pagination'>
            {prevHref ? (
                <Link href={prevHref} className={styles.pageArrow} aria-label='Previous page'>
                    ←
                </Link>
            ) : (
                <span className={`${styles.pageArrow} ${styles.pageArrowDisabled}`} aria-disabled='true'>
                    ←
                </span>
            )}

            {pages.map((p, i) =>
                p === '...' ? (
                    <span key={`ellipsis-${i}`} className={styles.pageEllipsis}>
                        …
                    </span>
                ) : (
                    <Link
                        key={p}
                        href={buildHref(p, searchParams)}
                        className={`${styles.pageLink}${p === currentPage ? ` ${styles.pageActive}` : ''}`}
                        aria-current={p === currentPage ? 'page' : undefined}
                    >
                        {p}
                    </Link>
                ),
            )}

            {nextHref ? (
                <Link href={nextHref} className={styles.pageArrow} aria-label='Next page'>
                    →
                </Link>
            ) : (
                <span className={`${styles.pageArrow} ${styles.pageArrowDisabled}`} aria-disabled='true'>
                    →
                </span>
            )}
        </nav>
    );
}
