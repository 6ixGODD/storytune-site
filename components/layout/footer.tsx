import styles from './footer.module.scss';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.inner}>
                <span className={styles.brand}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src='/logo.svg' alt='StoryTune' height={22} />
                </span>
                <span className={styles.copy}>© {new Date().getFullYear()} StoryTune</span>
            </div>
        </footer>
    );
}
