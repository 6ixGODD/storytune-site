import { SiteContentMap } from '@/lib/entities/site-content';

export const defaultNavContent: SiteContentMap['nav'] = {
    links: [
        { label: 'Directions', href: '/inspiration', id: 'nav-directions' },
        { label: 'Pricing', href: '/#pricing', id: 'nav-pricing' },
        { label: 'Process', href: '/#process', id: 'nav-process' },
        { label: 'Etsy', href: 'https://etsy.com', id: 'nav-etsy' },
    ],
};

export const defaultHeroContent: SiteContentMap['home.hero'] = {
    heading1: 'Not just an invitation.',
    heading2: 'An experience.',
    sub: 'Animated digital invitations crafted with motion, atmosphere and emotion.',
    primaryBtnLabel: 'Browse Directions',
    primaryBtnHref: '/inspiration',
    secondaryBtnLabel: 'Order on Etsy',
    secondaryBtnHref: 'https://etsy.com',
};

export const defaultCtaContent: SiteContentMap['home.cta'] = {
    heading1: 'Your event deserves',
    heading2: 'something unforgettable.',
    sub: 'Every invitation we make is a unique, animated digital experience — Designed to be opened slowly. Remembered long after the event ends.',
    btnLabel: 'Start on Etsy',
    btnHref: 'https://etsy.com',
};

export const defaultProcessContent: SiteContentMap['home.process'] = {
    eyebrow: 'Process',
    heading: 'From Idea to Atmosphere',
    steps: [
        {
            id: '01',
            title: 'Choose a direction',
            body: 'Browse the inspiration gallery and pick a template, or describe your vision from scratch. All orders placed through our Etsy shop.',
        },
        {
            id: '02',
            title: 'Share your story',
            body: "After ordering, fill in the event details — names, date, venue, any special notes. We'll use them to personalise every element.",
        },
        {
            id: '03',
            title: 'We craft the experience',
            body: 'Our team builds your animated digital invitation — motion, sound, personalised content. Light and deep custom orders include two revision rounds.',
        },
        {
            id: '04',
            title: 'Delivered as a living invitation',
            body: 'You receive a private link. Share it directly with guests — no app needed, works on every device. Template orders ship within 24 hours.',
        },
    ],
};

export const defaultPricingContent: SiteContentMap['home.pricing'] = {
    eyebrow: 'Pricing',
    heading: 'Choose your style',
    etsyHref: 'https://etsy.com',
    tiers: [
        {
            id: 'template',
            label: 'Directions',
            price: '$9.99',
            desc: 'Pick a ready-made design from the inspiration gallery and swap in your details. Delivered within 24h.',
            features: ['Choose from gallery', 'Text & date swap', '24h delivery', 'Digital send link'],
        },
        {
            id: 'light',
            label: 'Tailored',
            price: '$19.99',
            desc: 'Start from an inspiration template, then we adjust elements, palette, and typography to match your vision.',
            features: ['Based on a template', 'Element adjustments', 'Custom colour & font', '2 revisions included'],
        },
        {
            id: 'deep',
            label: 'Fully Bespoke',
            price: '$39.99',
            desc: 'Built from scratch to your brief. Full motion, custom music, bespoke interactions — no limits.',
            features: ['From zero brief', 'Full motion design', 'Custom soundtrack', '2 revisions included'],
        },
    ],
};

export const defaultGalleryContent: SiteContentMap['home.gallery'] = {
    eyebrow: 'Directions',
    heading: 'Browse directions',
    viewAllLabel: 'View all directions',
    viewAllHref: '/inspiration',
};

export const defaultTextRevealContent: SiteContentMap['home.text_reveal'] = {
    taglines: ['Every invitation is a world of its own.', 'Not a link. An experience.'],
};

export const defaultScrollVerbContent: SiteContentMap['home.scroll_verb'] = {
    prefix: 'we help you',
    verbs: [
        { text: 'design.', color: 'hsl(38 18% 72%)' },
        { text: 'animate.', color: 'hsl(162 22% 62%)' },
        { text: 'delight.', color: 'hsl(338 24% 68%)' },
        { text: 'personalise.', color: 'hsl(252 22% 72%)' },
        { text: 'surprise.', color: 'hsl(18 22% 66%)' },
        { text: 'remember.', color: 'hsl(207 22% 66%)' },
    ],
};

export const defaultClipRevealContent: SiteContentMap['home.clip_reveal'] = {
    rows: [
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
    ],
};

export const defaultSiteContent: SiteContentMap = {
    nav: defaultNavContent,
    'home.hero': defaultHeroContent,
    'home.cta': defaultCtaContent,
    'home.process': defaultProcessContent,
    'home.pricing': defaultPricingContent,
    'home.gallery': defaultGalleryContent,
    'home.text_reveal': defaultTextRevealContent,
    'home.scroll_verb': defaultScrollVerbContent,
    'home.clip_reveal': defaultClipRevealContent,
};
