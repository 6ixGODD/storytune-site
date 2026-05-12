import styles from './scroll-verb.module.scss';

const VERBS = [
    { text: 'design.', color: 'hsl(38 42% 70%)' },       // warm amber
    { text: 'animate.', color: 'hsl(162 28% 62%)' },     // sage
    { text: 'delight.', color: 'hsl(338 30% 70%)' },     // dusty rose
    { text: 'personalise.', color: 'hsl(252 28% 72%)' }, // soft lavender
    { text: 'surprise.', color: 'hsl(18 40% 68%)' },     // terracotta
    { text: 'remember.', color: 'hsl(207 28% 66%)' },    // slate blue
];

export default function ScrollVerb() {
    return (
        <div className={styles.outer}>
            {/* Accessible label for screen readers */}
            <span className='sr-only'>We help you {VERBS.map((v) => v.text).join(', ')}</span>
            <header
                className={styles.header}
                style={{ '--count': VERBS.length } as React.CSSProperties}
                aria-hidden='true'
            >
                <div className={styles.track}>
                    <h2 className={styles.prefix}>we help you&nbsp;</h2>
                    <ul className={styles.list}>
                        {VERBS.map((verb) => (
                            <li
                                key={verb.text}
                                className={styles.item}
                                style={{ '--verb-color': verb.color } as React.CSSProperties}
                            >
                                {verb.text}
                            </li>
                        ))}
                    </ul>
                </div>
            </header>
        </div>
    );
}
