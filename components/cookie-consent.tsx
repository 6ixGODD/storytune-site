'use client';

import Link from 'next/link';
import { startTransition, useEffect, useState } from 'react';

import styles from './cookie-consent.module.scss';

const STORAGE_KEY = 'st_cookie_consent';

export type ConsentStatus = 'accepted' | 'declined' | null;

export function getConsentStatus(): ConsentStatus {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'accepted' || stored === 'declined') return stored;
    return null;
}

interface CookieConsentProps {
    onConsent?: (status: 'accepted' | 'declined') => void;
}

export function CookieConsent({ onConsent }: CookieConsentProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (getConsentStatus() === null) {
            startTransition(() => setVisible(true));
        }
    }, []);

    function handleChoice(status: 'accepted' | 'declined') {
        localStorage.setItem(STORAGE_KEY, status);
        setVisible(false);
        // Dispatch a custom event so same-page listeners (GoogleAnalytics) can react
        window.dispatchEvent(new CustomEvent('st:consent', { detail: status }));
        onConsent?.(status);
    }

    if (!visible) return null;

    return (
        <div className={styles.banner} role='dialog' aria-label='Cookie preferences'>
            <div className={styles.inner}>
                <p className={styles.text}>
                    We use cookies to understand how people find and use StoryTune — nothing more.{' '}
                    <Link href='/privacy'>Privacy policy</Link>
                </p>
                <div className={styles.actions}>
                    <button className={styles.decline} onClick={() => handleChoice('declined')}>
                        Decline
                    </button>
                    <button className={styles.accept} onClick={() => handleChoice('accepted')}>
                        Accept
                    </button>
                </div>
            </div>
        </div>
    );
}
