export function ArrowUpRight({ size = 12 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox='0 0 12 12'
            fill='none'
            aria-hidden='true'
            style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '0.35em', flexShrink: 0 }}
        >
            <path
                d='M2.5 9.5L9.5 2.5M9.5 2.5H4.5M9.5 2.5V7.5'
                stroke='currentColor'
                strokeWidth='1.5'
                strokeLinecap='round'
                strokeLinejoin='round'
            />
        </svg>
    );
}
