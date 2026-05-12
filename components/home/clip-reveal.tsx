import styles from './clip-reveal.module.scss';

const ROWS = [
    {
        primary: 'Invitations that actually move.',
        hover: 'Animated. Interactive. Unforgettable.',
        hoverBg: 'hsl(220 15% 94%)',
        hoverColor: 'hsl(220 8% 10%)',
    },
    {
        primary: 'We design it. You send it.',
        hover: 'No creative skills needed.',
        hoverBg: 'hsl(160 12% 92%)',
        hoverColor: 'hsl(160 15% 8%)',
    },
    {
        primary: 'One link. Every guest.',
        hover: 'Works on any phone, anywhere.',
        hoverBg: 'hsl(30 12% 93%)',
        hoverColor: 'hsl(30 15% 8%)',
    },
    {
        primary: 'Motion. Music. Memory.',
        hover: 'Your story, permanently told.',
        hoverBg: 'hsl(280 12% 93%)',
        hoverColor: 'hsl(280 10% 10%)',
    },
] as const;

export default function ClipReveal() {
    return (
        <section className={styles.section}>
            <div className={styles.container}>
                {ROWS.map((row) => (
                    <p
                        key={row.primary}
                        className={styles.row}
                    >
                        {row.primary}
                        <span
                            className={styles.hoverSpan}
                            style={
                                {
                                    '--hover-bg': row.hoverBg,
                                    '--hover-color': row.hoverColor,
                                } as React.CSSProperties
                            }
                        >
                            {row.hover}
                        </span>
                    </p>
                ))}
            </div>
        </section>
    );
}
