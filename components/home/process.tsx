import styles from './process.module.scss';

const STEPS = [
    {
        id: '01',
        title: 'Choose a direction',
        body: 'Browse the inspiration gallery and pick a template, or describe your vision from scratch. All orders placed through our Etsy shop.',
    },
    {
        id: '02',
        title: 'Share your story',
        body: "After ordering, fill in the event details — names, date, venue, any special notes. We'll use them to personalise every element.",
    },
    {
        id: '03',
        title: 'We craft the experience',
        body: 'Our team builds your animated digital invitation — motion, sound, personalised content. Light and deep custom orders include two revision rounds.',
    },
    {
        id: '04',
        title: 'Delivered as a living invitation',
        body: 'You receive a private link. Share it directly with guests — no app needed, works on every device. Template orders ship within 24 hours.',
    },
];

export default function Process() {
    return (
        <section id='process' className={styles.section}>
            <div className={styles.inner}>
                <header className={styles.sectionHead}>
                    <p className={styles.eyebrow}>Process</p>
                    <h2 className={styles.heading}>From Idea to Atmosphere</h2>
                </header>

                <div className={styles.body}>
                    {/* Left: morphing disclosure */}
                    <div className={styles.disclosure}>
                        {STEPS.map((step) => (
                            <details key={step.id} name='morph' className={styles.details}>
                                <summary className={styles.summary}>
                                    <span className={styles.stepId}>{step.id}</span>
                                    <span className={styles.stepTitle}>{step.title}</span>
                                    <svg
                                        className={styles.plusIcon}
                                        width='16'
                                        height='16'
                                        viewBox='0 0 16 16'
                                        fill='none'
                                        aria-hidden='true'
                                    >
                                        <path
                                            d='M8 2v12M2 8h12'
                                            stroke='currentColor'
                                            strokeWidth='1.5'
                                            strokeLinecap='round'
                                        />
                                    </svg>
                                </summary>
                                <div className={styles.content}>
                                    <p>{step.body}</p>
                                </div>
                            </details>
                        ))}
                    </div>

                    {/* Right: visual step timeline */}
                    <div className={styles.panel} aria-hidden='true'>
                        {STEPS.map((step, i) => (
                            <div key={step.id} className={styles.timelineStep}>
                                <div className={styles.timelineTrack}>
                                    <div className={styles.timelineDot} />
                                    {i < STEPS.length - 1 && <div className={styles.timelineConnector} />}
                                </div>
                                <div className={styles.timelineInfo}>
                                    <span className={styles.timelineNum}>{step.id}</span>
                                    <span className={styles.timelineTitle}>{step.title}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
