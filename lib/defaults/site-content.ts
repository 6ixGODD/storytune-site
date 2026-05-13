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

export const defaultPrivacyContent: SiteContentMap['legal.privacy'] = {
    markdown: `# Privacy

*Last updated: May 2026*

Story Tune is an independent digital invitation studio operated by BoChen Shen.

This website showcases creative invitation experiences and provides custom digital invitation services. We believe in being straightforward about what we collect and why — no legalese, no surprises.

## What we collect

When you use this website, a small amount of information may be collected:

**RSVP submissions** — when a guest fills out an invitation RSVP form, we collect:

* Guest name
* Email address
* Attendance response (yes / no / maybe)
* Optional message

This information is forwarded directly to the invitation owner and is not retained for any other purpose.

**Analytics data** — we use Google Analytics to understand how people use the site. This includes:

* Pages visited and time spent
* Browser type and device information
* Approximate geographic region (country/city level)
* How you arrived at the site (referral source, UTM parameters)

We do not use advertising trackers, behavioural profiling, or sell any data.

## Why we collect it

Information is collected only to:

* Deliver RSVP responses to invitation owners
* Send service-related emails (RSVP confirmations, notifications)
* Understand traffic patterns and improve the site experience
* Diagnose and fix technical issues

## Email

RSVP submissions and service-related emails are sent using [Resend](https://resend.com), a transactional email provider. Resend processes email on our behalf and is bound by its own data processing terms.

## External platforms

Some purchases may be handled through third-party platforms such as Etsy. Transactions made there are governed by Etsy's own privacy policy, not ours.

## Your data

You can request removal of any RSVP information you submitted at any time by contacting us directly.

## Contact

BoChen Shen
[6goddddddd@gmail.com](mailto:6goddddddd@gmail.com)
`,
};

export const defaultTermsContent: SiteContentMap['legal.terms'] = {
    markdown: `# Terms

*Last updated: May 2026*

Story Tune is an independent digital invitation studio operated by BoChen Shen.

By using this website or purchasing a custom invitation through linked platforms such as Etsy, you agree to the following. We've kept it plain and honest — the way we'd want things explained to us.

## What we do

Story Tune creates custom animated digital invitation experiences.

Each project is handcrafted. Depending on the selected style and level of customisation, it may include motion design, music, interactive elements, and personalised content.

## Revisions

Standard projects include up to two rounds of revisions unless we've agreed otherwise upfront.

If you need more changes after that, we're still happy to help — it may just require a little extra time or a small additional fee, which we'll discuss openly before proceeding.

## Delivery

We provide estimated delivery windows for every project and do our best to hit them.

Timelines are given in good faith and can be affected by project complexity, how quickly we're able to exchange feedback, or things outside our control. We'll always communicate proactively if something shifts.

## External platforms

Payments and order management may happen through third-party platforms like Etsy.

We're not responsible for outages, payment disputes, policy changes, or any other issues that occur on those platforms. Their terms apply to transactions made there.

## Acceptable use

You agree not to copy, redistribute, or resell invitation experiences, designs, or any site content without our explicit permission.

The digital invitation we create for you is licensed for your personal use — specifically for the event it was made for.

## Changes to these terms

We may update these terms occasionally as the studio grows and evolves. When we do, the "Last updated" date at the top will change. Continued use of the site or our services means you accept the updated terms.

## Contact

For questions about these terms, custom projects, or anything else:

BoChen Shen
[6goddddddd@gmail.com](mailto:6goddddddd@gmail.com)
`,
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
    'legal.privacy': defaultPrivacyContent,
    'legal.terms': defaultTermsContent,
};
