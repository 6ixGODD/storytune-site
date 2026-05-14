'use client';

/**
 * @file components/analytics/google-analytics.tsx
 * Loads the GA4 gtag.js script and fires page_view + session_start events.
 *
 * Respects cookie consent stored in localStorage (`st_cookie_consent`).
 * GA is only loaded when the user has explicitly accepted cookies.
 * Mount this once inside RootLayout. It reads the measurement ID from the
 * NEXT_PUBLIC_STORYTUNE__GA_ID env var at build time; if the ID is empty the
 * component renders nothing and analytics is effectively disabled.
 */
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { startTransition, useEffect, useRef, useState } from 'react';

import { getConsentStatus } from '@/components/cookie-consent';
import { track } from '@/lib/analytics';

const GA_ID = process.env.NEXT_PUBLIC_STORYTUNE__GA_ID ?? '';

/** Derive a human-readable page name from the URL pathname. */
function pageNameFromPath(path: string): string {
    if (path === '/') return 'homepage';
    if (path.startsWith('/inspiration')) return 'inspiration';
    if (path.startsWith('/privacy')) return 'privacy';
    if (path.startsWith('/terms')) return 'terms';
    if (path.startsWith('/admin')) return 'admin';
    return path.replace(/^\//, '').replace(/\//g, '_') || 'unknown';
}

/** Detect broad device category from viewport width. */
function deviceType(): 'mobile' | 'tablet' | 'desktop' {
    const w = window.innerWidth;
    if (w < 768) return 'mobile';
    if (w < 1024) return 'tablet';
    return 'desktop';
}

/** Parse UTM parameters from the current URL search string. */
function utmParams(search: string) {
    const p = new URLSearchParams(search);
    return {
        traffic_source: p.get('utm_source') ?? undefined,
        traffic_medium: p.get('utm_medium') ?? undefined,
        campaign: p.get('utm_campaign') ?? undefined,
    };
}

export default function GoogleAnalytics() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const sessionFiredRef = useRef(false);
    const [consented, setConsented] = useState(false);

    // Resolve consent once on mount, then listen for consent changes
    useEffect(() => {
        const status = getConsentStatus();
        if (status === 'accepted') startTransition(() => setConsented(true));

        const onConsentEvent = (e: Event) => {
            const detail = (e as CustomEvent<string>).detail;
            startTransition(() => setConsented(detail === 'accepted'));
        };
        window.addEventListener('st:consent', onConsentEvent);
        return () => window.removeEventListener('st:consent', onConsentEvent);
    }, []);

    // Fire page_view on every route change when consented
    useEffect(() => {
        if (!GA_ID || !consented) return;

        track('page_view', {
            page_name: pageNameFromPath(pathname),
            page_path: pathname,
            referrer: document.referrer || undefined,
            device_type: deviceType(),
            viewport_width: window.innerWidth,
            viewport_height: window.innerHeight,
        });

        // session_start: fire once per browser session (not on every navigation)
        if (!sessionFiredRef.current && !sessionStorage.getItem('st_session_started')) {
            sessionStorage.setItem('st_session_started', '1');
            sessionFiredRef.current = true;
            track('session_start', {
                landing_page: pathname,
                ...utmParams(searchParams.toString()),
            });
        }
    }, [pathname, searchParams, consented]);

    if (!GA_ID || !consented) return null;

    return (
        <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy='afterInteractive' />
            <Script id='ga-init' strategy='afterInteractive'>
                {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${GA_ID}', { send_page_view: false });
                `}
            </Script>
        </>
    );
}

