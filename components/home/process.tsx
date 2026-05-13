import { defaultProcessContent } from '@/lib/defaults/site-content';
import { ProcessContent } from '@/lib/entities/site-content';

import styles from './process.module.scss';

interface ProcessProps {
    content?: ProcessContent;
}

export default function Process({ content = defaultProcessContent }: ProcessProps) {
    return (
        <section id='process' className={styles.section}>
            <div className={styles.inner}>
                <header className={styles.sectionHead}>
                    <p className={styles.eyebrow}>{content.eyebrow}</p>
                    <h2 className={styles.heading}>{content.heading}</h2>
                </header>

                <div className={styles.body}>
                    <div className={styles.disclosure}>
                        {content.steps.map((step) => (
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

                    <div className={styles.panel} aria-hidden='true'>
                        {content.steps.map((step, index) => (
                            <div key={step.id} className={styles.timelineStep}>
                                <div className={styles.timelineTrack}>
                                    <div className={styles.timelineDot} />
                                    {index < content.steps.length - 1 && <div className={styles.timelineConnector} />}
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
