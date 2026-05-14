import '@/app/styles/main.scss';

import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { ReactNode, Suspense } from 'react';

import GoogleAnalytics from '@/components/analytics/google-analytics';
import { CookieConsent } from '@/components/cookie-consent';

const geist = localFont({
    src: [
        {
            path: '../public/fonts/geist-latin.woff2',
            weight: '100 900',
            style: 'normal',
        },
        {
            path: '../public/fonts/geist-latin-ext.woff2',
            weight: '100 900',
            style: 'normal',
        },
    ],
    variable: '--font-sans',
    display: 'swap',
});

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
            <body>
                <Suspense>
                    <GoogleAnalytics />
                </Suspense>
                {children}
                <CookieConsent />
            </body>
        </html>
    );
}
