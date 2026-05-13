'use client';

import { useRouter } from 'next/navigation';

import { track } from '@/lib/analytics';

import styles from './inspiration-search.module.scss';

interface InspirationSearchProps {
    defaultValue?: string;
    currentCategory?: string;
}

export default function InspirationSearch({ defaultValue, currentCategory }: InspirationSearchProps) {
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const q = (form.elements.namedItem('q') as HTMLInputElement).value.trim();
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        if (currentCategory) params.set('category', currentCategory);
        if (q) {
            track('inspiration_filter_change', { filter_type: 'search', filter_value: q });
        }
        router.replace(`/inspiration${params.size ? `?${params}` : ''}`, { scroll: false });
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <input
                name='q'
                type='search'
                defaultValue={defaultValue}
                placeholder='Search directions…'
                className={styles.input}
                autoComplete='off'
            />
            <button type='submit' className={styles.button}>
                Search
            </button>
        </form>
    );
}
