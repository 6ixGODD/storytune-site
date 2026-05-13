'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { defaultNavContent } from '@/lib/defaults/site-content';
import { NavContent } from '@/lib/entities/site-content';

import styles from './navbar.module.scss';

interface NavbarProps {
    content?: NavContent;
}

export default function Navbar({ content = defaultNavContent }: NavbarProps) {
    const navRef = useRef<HTMLElement>(null);
    const ulRef = useRef<HTMLUListElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const hamburgerRef = useRef<HTMLButtonElement>(null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const inMenu = menuRef.current?.contains(target) ?? false;
            const inHamburger = hamburgerRef.current?.contains(target) ?? false;
            if (!inMenu && !inHamburger) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

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
            anchors.forEach((anchor, index) => {
                anchor.style.setProperty('view-transition-name', `nav-item-${index + 1}`);
            });
        };
        calibrate();

        const setActiveVars = (anchor: HTMLAnchorElement) => {
            const bounds = anchor.getBoundingClientRect();
            ul.style.setProperty('--item-active-y', String(bounds.top));
            ul.style.setProperty('--item-active-x', String(bounds.left));
            ul.style.setProperty('--item-active-width', String(bounds.width));
            ul.style.setProperty('--item-active-height', String(bounds.height));
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
            anchors.forEach((anchor, index) => anchor.removeEventListener('pointerenter', handlers[index]));
            nav.removeEventListener('pointerleave', deactivate);
            nav.removeEventListener('blur', deactivate, true);
            window.removeEventListener('resize', calibrate);
        };
    }, [content.links]);

    return (
        <header className={styles.header}>
            <nav ref={navRef} className={styles.nav} data-magnetic>
                <Link href='/' className={styles.logo} aria-label='StoryTune home'>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src='/logo.svg' alt='StoryTune' height={42} />
                </Link>

                <ul ref={ulRef} className={styles.list}>
                    {content.links.map((link) => (
                        <li key={link.id} className={styles.item}>
                            <Link href={link.href} id={link.id} className={styles.link}>
                                {link.label}
                            </Link>
                        </li>
                    ))}
                </ul>

                <button
                    ref={hamburgerRef}
                    className={styles.hamburger}
                    aria-label={isOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={isOpen}
                    onClick={() => setIsOpen((open) => !open)}
                >
                    <span className={styles.bar} />
                    <span className={styles.bar} />
                    <span className={styles.bar} />
                </button>
            </nav>

            <div
                ref={menuRef}
                className={`${styles.mobileMenu} ${isOpen ? styles.mobileMenuOpen : ''}`}
                aria-hidden={!isOpen}
            >
                <ul className={styles.mobileList}>
                    {content.links.map((link) => (
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
