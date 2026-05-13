/**
 * @file lib/analytics.ts
 * Unified analytics wrapper.
 *
 * All analytics tracking calls go through `track()`. This decouples components
 * from any specific provider (GA, Clarity, PostHog, etc.) and keeps event
 * definitions in one place.
 *
 * @example
 * ```ts
 * import { track } from '@/lib/analytics';
 * track('inspiration_card_click', { template_id: 'tpl_001', position_index: 3 });
 * ```
 */

/** GA4 gtag function signature (window.gtag). */
type GTag = (...args: unknown[]) => void;

declare global {
    // noinspection JSUnusedGlobalSymbols
    interface Window {
        gtag?: GTag;
        dataLayer?: unknown[];
    }
}

// ── Event payload types ───────────────────────────────────────────────────────

export interface PageViewPayload {
    page_name: string;
    page_path: string;
    referrer?: string;
    device_type?: 'mobile' | 'tablet' | 'desktop';
    viewport_width?: number;
    viewport_height?: number;
}

export interface SessionStartPayload {
    landing_page: string;
    traffic_source?: string;
    traffic_medium?: string;
    campaign?: string;
    country?: string;
}

export interface HomeSectionViewPayload {
    section_name: 'hero' | 'featured_templates' | 'showcase_video' | 'features' | 'testimonials' | 'footer';
    visible_duration_ms?: number;
}

export interface HomeCtaClickPayload {
    cta_name: 'explore_templates' | 'use_template' | 'create_invitation' | 'contact' | 'start_now';
    section_name: string;
}

export interface HomeVideoEngagementPayload {
    action: 'start' | 'complete';
    video_id: string;
    progress_percent: number;
}

export interface InspirationCardViewPayload {
    template_id: string;
    template_title: string;
    category?: string;
    tags?: string[];
}

export interface InspirationCardClickPayload {
    template_id: string;
    template_title: string;
    category?: string;
    tags?: string[];
    position_index?: number;
}

export interface InspirationFilterChangePayload {
    filter_type: 'category' | 'tag' | 'search';
    filter_value: string;
}

// ── Event map ─────────────────────────────────────────────────────────────────

export interface AnalyticsEventMap {
    page_view: PageViewPayload;
    session_start: SessionStartPayload;
    home_section_view: HomeSectionViewPayload;
    home_cta_click: HomeCtaClickPayload;
    home_video_engagement: HomeVideoEngagementPayload;
    inspiration_card_view: InspirationCardViewPayload;
    inspiration_card_click: InspirationCardClickPayload;
    inspiration_filter_change: InspirationFilterChangePayload;
}

// ── Core track function ───────────────────────────────────────────────────────

/**
 * Send a tracking event to all configured analytics providers.
 *
 * Safe to call on the server (no-op) or before the analytics script has loaded
 * (gtag queues events via dataLayer).
 *
 * @param eventName - The event name defined in `AnalyticsEventMap`.
 * @param payload   - Typed payload specific to the event.
 */
export function track<K extends keyof AnalyticsEventMap>(eventName: K, payload: AnalyticsEventMap[K]): void {
    if (typeof window === 'undefined') return;
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', eventName, payload);
}
