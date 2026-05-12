import styles from './text-reveal.module.scss';

const TAGLINES = ['Every invitation is a world of its own.', 'Not a link. An experience.'];

export default function TextReveal() {
    return (
        <>
            {TAGLINES.map((text) => (
                // Each block is 200vh — provides scroll distance for the animation
                <div key={text} className={styles.block}>
                    <section className={styles.sticky}>
                        <p className={styles.text}>
                            <span className={styles.span}>{text}</span>
                            <span className={styles.glow} aria-hidden='true'>
                                {text}
                            </span>
                        </p>
                    </section>
                </div>
            ))}
        </>
    );
}
