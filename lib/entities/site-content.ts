export interface NavLink {
    id: string;
    label: string;
    href: string;
}

export interface NavContent {
    links: NavLink[];
}

export interface HeroContent {
    heading1: string;
    heading2: string;
    sub: string;
    primaryBtnLabel: string;
    primaryBtnHref: string;
    secondaryBtnLabel: string;
    secondaryBtnHref: string;
}

export interface CtaContent {
    heading1: string;
    heading2: string;
    sub: string;
    btnLabel: string;
    btnHref: string;
}

export interface ProcessStep {
    id: string;
    title: string;
    body: string;
}

export interface ProcessContent {
    eyebrow: string;
    heading: string;
    steps: ProcessStep[];
}

export interface PricingTier {
    id: string;
    label: string;
    price: string;
    desc: string;
    features: string[];
}

export interface PricingContent {
    eyebrow: string;
    heading: string;
    etsyHref: string;
    tiers: PricingTier[];
}

export interface GalleryContent {
    eyebrow: string;
    heading: string;
    viewAllLabel: string;
    viewAllHref: string;
}

export interface TextRevealContent {
    taglines: string[];
}

export interface ScrollVerb {
    text: string;
    color: string;
}

export interface ScrollVerbContent {
    prefix: string;
    verbs: ScrollVerb[];
}

export interface ClipRevealRow {
    primary: string;
    hover: string;
    hoverBg: string;
    hoverColor: string;
}

export interface ClipRevealContent {
    rows: ClipRevealRow[];
}

export interface LegalContent {
    markdown: string;
}

export const SITE_CONTENT_KEYS = [
    'nav',
    'home.hero',
    'home.cta',
    'home.process',
    'home.pricing',
    'home.gallery',
    'home.text_reveal',
    'home.scroll_verb',
    'home.clip_reveal',
    'legal.privacy',
    'legal.terms',
] as const;

export type SiteContentKey = (typeof SITE_CONTENT_KEYS)[number];

export interface SiteContentMap {
    nav: NavContent;
    'home.hero': HeroContent;
    'home.cta': CtaContent;
    'home.process': ProcessContent;
    'home.pricing': PricingContent;
    'home.gallery': GalleryContent;
    'home.text_reveal': TextRevealContent;
    'home.scroll_verb': ScrollVerbContent;
    'home.clip_reveal': ClipRevealContent;
    'legal.privacy': LegalContent;
    'legal.terms': LegalContent;
}
