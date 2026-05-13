'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import styles from './navbar.module.scss';

const NAV_LINKS = [
    { label: 'Directions', href: '/inspiration', id: 'nav-directions' },
    { label: 'Pricing', href: '/#pricing', id: 'nav-pricing' },
    { label: 'Process', href: '/#process', id: 'nav-process' },
    { label: 'Etsy', href: 'https://etsy.com', id: 'nav-etsy' },
];

export default function Navbar() {
    const navRef = useRef<HTMLElement>(null);
    const ulRef = useRef<HTMLUListElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const hamburgerRef = useRef<HTMLButtonElement>(null);
    const [isOpen, setIsOpen] = useState(false);

    // Close mobile menu on outside click, but not when clicking the hamburger itself
    // (the hamburger's own onClick handles toggling)
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            const inMenu = menuRef.current?.contains(target) ?? false;
            const inHamburger = hamburgerRef.current?.contains(target) ?? false;
            if (!inMenu && !inHamburger) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Desktop anchor-position hover effect
    useEffect(() => {
        const nav = navRef.current;
        const ul = ulRef.current;
        if (!nav || !ul) return;

        const supportsAnchorPos = 'anchorName' in document.documentElement.style;
        if (!supportsAnchorPos) {
            document.documentElement.dataset.noAnchor = 'true';
        }

        const anchors = Array.from(ul.querySelectorAll('a'));

        const calibrate = () => {
            anchors.forEach((anchor, i) => {
                anchor.style.setProperty('view-transition-name', `nav-item-${i + 1}`);
            });
        };
        calibrate();

        const setActiveVars = (anchor: HTMLAnchorElement) => {
            const b = anchor.getBoundingClientRect();
            ul.style.setProperty('--item-active-y', String(b.top));
            ul.style.setProperty('--item-active-x', String(b.left));
            ul.style.setProperty('--item-active-width', String(b.width));
            ul.style.setProperty('--item-active-height', String(b.height));
        };

        const handlers: Array<() => void> = [];
        anchors.forEach((anchor) => {
            const fn = () => {
                if (!supportsAnchorPos) setActiveVars(anchor);
                ul.style.setProperty('--intent', '1');
            };
            anchor.addEventListener('pointerenter', fn);
            handlers.push(fn);
        });

        const deactivate = () => {
            ul.style.removeProperty('--intent');
        };

        nav.addEventListener('pointerleave', deactivate);
        nav.addEventListener('blur', deactivate, true);

        if (!supportsAnchorPos) {
            window.addEventListener('resize', calibrate);
        }

        return () => {
            anchors.forEach((anchor, i) => anchor.removeEventListener('pointerenter', handlers[i]));
            nav.removeEventListener('pointerleave', deactivate);
            nav.removeEventListener('blur', deactivate, true);
            window.removeEventListener('resize', calibrate);
        };
    }, []);

    return (
        <header className={styles.header}>
            <nav ref={navRef} className={styles.nav} data-magnetic>
                <Link href='/' className={styles.logo} aria-label='StoryTune home'>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src='/logo.svg' alt='StoryTune' height={42} />
                </Link>

                {/* Desktop nav links */}
                <ul ref={ulRef} className={styles.list}>
                    {NAV_LINKS.map((link) => (
                        <li key={link.id} className={styles.item}>
                            <Link href={link.href} id={link.id} className={styles.link}>
                                {link.label}
                            </Link>
                        </li>
                    ))}
                </ul>

                {/* Mobile hamburger button */}
                <button
                    ref={hamburgerRef}
                    className={styles.hamburger}
                    aria-label={isOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={isOpen}
                    onClick={() => setIsOpen((v) => !v)}
                >
                    <span className={styles.bar} />
                    <span className={styles.bar} />
                    <span className={styles.bar} />
                </button>
            </nav>

            {/* Mobile menu panel */}
            <div
                ref={menuRef}
                className={`${styles.mobileMenu} ${isOpen ? styles.mobileMenuOpen : ''}`}
                aria-hidden={!isOpen}
            >
                <ul className={styles.mobileList}>
                    {NAV_LINKS.map((link) => (
                        <li key={link.id}>
                            <Link href={link.href} className={styles.mobileLink} onClick={() => setIsOpen(false)}>
                                {link.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </header>
    );
}
