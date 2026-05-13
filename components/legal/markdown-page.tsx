'use client';

/**
 * @file components/legal/markdown-page.tsx
 * Reusable document page with sticky TOC and markdown rendering.
 *
 * Accepts a `markdown` string as a prop — pass hardcoded content for now,
 * swap for a CMS fetch later. The first `#` heading becomes the page title
 * in the header; `##` headings are extracted to build the sticky TOC.
 *
 * Design adapted from the contents-marker-w-scroll-target layout:
 * sticky TOC on the left, 60ch-wide article on the right.
 */
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import styles from './markdown-page.module.scss';

// ── Heading extraction ────────────────────────────────────────────────────────

interface TocEntry {
    id: string;
    label: string;
}

/** Convert a heading string to a URL-safe anchor ID. */
function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
}

/** Extract all `##` level headings from a markdown string. */
function extractToc(markdown: string): TocEntry[] {
    const lines = markdown.split('\n');
    const entries: TocEntry[] = [];
    for (const line of lines) {
        const m = line.match(/^##\s+(.+)$/);
        if (m) {
            const label = m[1].trim();
            entries.push({ id: slugify(label), label });
        }
    }
    return entries;
}

/** Extract the first `#` heading as the page title. */
function extractTitle(markdown: string): string {
    const m = markdown.match(/^#\s+(.+)$/m);
    return m ? m[1].trim() : '';
}

/** Extract italic text immediately after the title (used for "Last updated: …"). */
function extractSubtitle(markdown: string): string {
    // Look for `*text*` or `_text_` on a line by itself after the title
    const m = markdown.match(/^[*_](.+?)[*_]\s*$/m);
    return m ? m[1].trim() : '';
}

// ── Component ─────────────────────────────────────────────────────────────────

interface MarkdownPageProps {
    markdown: string;
}

export default function MarkdownPage({ markdown }: MarkdownPageProps) {
    const toc = extractToc(markdown);
    const title = extractTitle(markdown);
    const subtitle = extractSubtitle(markdown);
    const [activeId, setActiveId] = useState<string>('');
    const contentRef = useRef<HTMLElement>(null);

    // Track which section is in view with IntersectionObserver
    useEffect(() => {
        const content = contentRef.current;
        if (!content || toc.length === 0) return;

        const headings = Array.from(content.querySelectorAll('h2[id]'));
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                        break;
                    }
                }
            },
            { rootMargin: '-10% 0px -80% 0px', threshold: 0 },
        );

        headings.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, [toc]);

    return (
        <div className={styles.container}>
            {/* ── Sticky TOC ── */}
            <nav className={styles.toc} aria-label='Table of contents'>
                <span className={styles.tocLabel}>Contents</span>
                <ol className={styles.tocList}>
                    {toc.map((entry) => (
                        <li key={entry.id}>
                            <a
                                href={`#${entry.id}`}
                                className={`${styles.tocLink} ${activeId === entry.id ? styles.tocLinkActive : ''}`}
                            >
                                {entry.label}
                            </a>
                        </li>
                    ))}
                </ol>
                <div className={styles.tocBack}>
                    <a href='#top' className={styles.backToTop}>
                        ↑ Back to top
                    </a>
                </div>
            </nav>

            {/* ── Article ── */}
            <article className={styles.article} ref={contentRef} id='top'>
                <header className={styles.header}>
                    <h1 className={styles.title}>{title}</h1>
                    {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                    <Link href='/' className={styles.backLink}>
                        ← Back to StoryTune
                    </Link>
                </header>

                <div className={styles.body}>
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            // Suppress h1 — we render it in the header above
                            h1: () => null,
                            // Add IDs to h2 headings so TOC anchors work
                            h2: ({ children }) => {
                                const text = String(children);
                                const id = slugify(text);
                                return (
                                    <h2 id={id} className={styles.h2}>
                                        {children}
                                    </h2>
                                );
                            },
                            h3: ({ children }) => <h3 className={styles.h3}>{children}</h3>,
                            p: ({ children }) => <p className={styles.p}>{children}</p>,
                            ul: ({ children }) => <ul className={styles.ul}>{children}</ul>,
                            ol: ({ children }) => <ol className={styles.ol}>{children}</ol>,
                            li: ({ children }) => <li className={styles.li}>{children}</li>,
                            a: ({ href, children }) => (
                                <a href={href} className={styles.a} target='_blank' rel='noreferrer'>
                                    {children}
                                </a>
                            ),
                            // Suppress the italic "Last updated" line — rendered in header
                            em: ({ children }) => {
                                const text = String(children);
                                if (text.startsWith('Last updated')) return null;
                                return <em>{children}</em>;
                            },
                            hr: () => <hr className={styles.hr} />,
                        }}
                    >
                        {markdown}
                    </ReactMarkdown>
                </div>

                <footer className={styles.footer}>
                    <p>© {new Date().getFullYear()} StoryTune</p>
                </footer>
            </article>
        </div>
    );
}
