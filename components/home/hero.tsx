import Link from 'next/link';

import styles from './hero.module.scss';

export default function Hero() {
    return (
        <section className={styles.hero}>
            <div className={styles.inner}>
                <h1 className={styles.heading}>
                    Not just an invitation.
                    <br />
                    <span className={styles.dim}>An experience.</span>
                </h1>
                <p className={styles.sub}>Animated digital invitations crafted with motion, atmosphere and emotion.</p>
                <div className={styles.actions}>
                    <Link href='/inspiration' className={styles.btnPrimary}>
                        Browse Directions
                    </Link>
                    <a href='https://etsy.com' target='_blank' rel='noreferrer' className={styles.btnSecondary}>
                        Order on Etsy ↗
                    </a>
                </div>
            </div>
            <div className={styles.scroll} aria-hidden='true'>
                <span>scroll</span>
                <span className={styles.scrollLine} />
            </div>
        </section>
    );
}
