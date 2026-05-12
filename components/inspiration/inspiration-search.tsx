import styles from './inspiration-search.module.scss';

interface InspirationSearchProps {
    defaultValue?: string;
    currentCategory?: string;
}

/** Server component — submits a GET form to preserve URL-driven navigation. */
export default function InspirationSearch({ defaultValue, currentCategory }: InspirationSearchProps) {
    return (
        <form action='/inspiration' method='get' className={styles.form}>
            {currentCategory && <input type='hidden' name='category' value={currentCategory} />}
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
