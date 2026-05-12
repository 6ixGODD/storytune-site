import '@/app/styles/main.scss';

import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { ReactNode } from 'react';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
    title: 'StoryTune — Digital Invitations',
    description: 'Beautiful, animated digital invitations crafted with care. Delivered instantly.',
    openGraph: {
        title: 'StoryTune — Digital Invitations',
        description: 'Beautiful, animated digital invitations crafted with care. Delivered instantly.',
        type: 'website',
    },
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang='en' className={geist.variable}>
            <body>{children}</body>
        </html>
    );
}
