import { ArrowUpRight } from '@/components/ui/arrow-up-right';

import styles from './cta.module.scss';

export default function Cta() {
    return (
        <section className={styles.section}>
            <div className={styles.inner}>
                <h2 className={styles.heading}>
                    Your event deserves
                    <br />
                    something unforgettable.
                </h2>
                <p className={styles.sub}>
                    Every invitation we make is a unique, animated digital experience — Designed to be opened slowly.
                    Remembered long after the event ends.
                </p>
                <a href='https://etsy.com' target='_blank' rel='noreferrer' className={styles.btn}>
                    Start on Etsy <ArrowUpRight />
                </a>
            </div>
        </section>
    );
}
