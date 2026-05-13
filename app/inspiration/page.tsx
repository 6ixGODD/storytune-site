import InspirationCard from '@/components/inspiration/inspiration-card';
import InspirationPagination from '@/components/inspiration/inspiration-pagination';
import InspirationSearch from '@/components/inspiration/inspiration-search';
import InspirationSidebar from '@/components/inspiration/inspiration-sidebar';
import Footer from '@/components/layout/footer';
import Navbar from '@/components/layout/navbar';
import { inspirationService } from '@/lib/services/inspiration.service';
import { siteContentService } from '@/lib/services/site-content.service';

import styles from './inspiration.module.scss';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 6;

interface PageProps {
    searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}

export default async function DirectionsPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const q = params.q?.trim() || undefined;
    const category = params.category?.trim() || undefined;
    const currentPage = Math.max(1, parseInt(params.page ?? '1', 10));

    const [{ items, total }, categories, cms] = await Promise.all([
        inspirationService.list({ page: currentPage, pageSize: PAGE_SIZE, category, q }),
        inspirationService.getCategories(),
        siteContentService.getAll(),
    ]);

    const totalPages = Math.ceil(total / PAGE_SIZE);

    // Preserve current search params for pagination links
    const paginationParams: Record<string, string> = {};
    if (q) paginationParams.q = q;
    if (category) paginationParams.category = category;

    return (
        <>
            <Navbar content={cms.nav} />
            <main className={styles.main}>
                {/* ── Hero ── */}
                <div className={styles.hero}>
                    <div className={styles.heroInner}>
                        <h1 className={styles.title}>Directions</h1>
                        <InspirationSearch defaultValue={q} currentCategory={category} />
                    </div>
                </div>

                {/* ── Two-column layout ── */}
                <div className={styles.layout}>
                    <InspirationSidebar categories={categories} activeCategory={category} q={q} />

                    <div className={styles.content}>
                        <p className={styles.resultMeta}>
                            {total === 0
                                ? 'No directions found.'
                                : `${total} direction${total === 1 ? '' : 's'}${q ? ` for "${q}"` : ''}${category ? ` in ${category}` : ''}`}
                        </p>

                        <div className={styles.grid}>
                            {items.length === 0 ? (
                                <p className={styles.empty}>
                                    {q || category
                                        ? 'Try a different keyword or category.'
                                        : 'No directions uploaded yet.'}
                                </p>
                            ) : (
                                items.map((item, idx) => (
                                    <InspirationCard key={item.slug} item={item} positionIndex={idx} />
                                ))
                            )}
                        </div>

                        {totalPages > 1 && (
                            <InspirationPagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                searchParams={paginationParams}
                            />
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
