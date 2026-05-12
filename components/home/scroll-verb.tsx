import styles from './scroll-verb.module.scss';

const VERBS = ['design.', 'animate.', 'delight.', 'personalise.', 'surprise.', 'remember.'];

export default function ScrollVerb() {
    return (
        <div className={styles.outer}>
            {/* Accessible label for screen readers */}
            <span className='sr-only'>We help you {VERBS.join(', ')}</span>
            <header
                className={styles.header}
                style={{ '--count': VERBS.length } as React.CSSProperties}
                aria-hidden='true'
            >
                <div className={styles.track}>
                    <h2 className={styles.prefix}>we help you&nbsp;</h2>
                    <ul className={styles.list}>
                        {VERBS.map((verb) => (
                            <li key={verb} className={styles.item}>
                                {verb}
                            </li>
                        ))}
                    </ul>
                </div>
            </header>
        </div>
    );
}
