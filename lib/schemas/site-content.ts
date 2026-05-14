import { z } from 'zod';

import { SITE_CONTENT_KEYS, SiteContentKey, SiteContentMap } from '@/lib/entities/site-content';

const NavLinkSchema = z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    href: z.string().min(1),
});

const HeroContentSchema = z.object({
    heading1: z.string().min(1),
    heading2: z.string().min(1),
    sub: z.string().min(1),
    primaryBtnLabel: z.string().min(1),
    primaryBtnHref: z.string().min(1),
    secondaryBtnLabel: z.string().min(1),
    secondaryBtnHref: z.string().min(1),
});

const CtaContentSchema = z.object({
    heading1: z.string().min(1),
    heading2: z.string().min(1),
    sub: z.string().min(1),
    btnLabel: z.string().min(1),
    btnHref: z.string().min(1),
});

const ProcessStepSchema = z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    body: z.string().min(1),
});

const ProcessContentSchema = z.object({
    eyebrow: z.string().min(1),
    heading: z.string().min(1),
    steps: z.array(ProcessStepSchema),
});

const PricingTierSchema = z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    price: z.string().min(1),
    desc: z.string().min(1),
    features: z.array(z.string().min(1)),
});

const PricingContentSchema = z.object({
    eyebrow: z.string().min(1),
    heading: z.string().min(1),
    etsyHref: z.string().min(1),
    tiers: z.array(PricingTierSchema),
});

const GalleryContentSchema = z.object({
    eyebrow: z.string().min(1),
    heading: z.string().min(1),
    viewAllLabel: z.string().min(1),
    viewAllHref: z.string().min(1),
});

const TextRevealContentSchema = z.object({
    taglines: z.array(z.string().min(1)),
});

const ScrollVerbSchema = z.object({
    text: z.string().min(1),
    color: z.string().min(1),
});

const ScrollVerbContentSchema = z.object({
    prefix: z.string().min(1),
    verbs: z.array(ScrollVerbSchema),
});

const ClipRevealRowSchema = z.object({
    primary: z.string().min(1),
    hover: z.string().min(1),
    hoverBg: z.string().min(1),
    hoverColor: z.string().min(1),
});

const ClipRevealContentSchema = z.object({
    rows: z.array(ClipRevealRowSchema),
});

const LegalContentSchema = z.object({
    markdown: z.string(),
});

export const SiteContentKeySchema = z.enum(SITE_CONTENT_KEYS);

export const siteContentValueSchemas: { [K in SiteContentKey]: z.ZodType<SiteContentMap[K]> } = {
    nav: z.object({ links: z.array(NavLinkSchema) }),
    'home.hero': HeroContentSchema,
    'home.cta': CtaContentSchema,
    'home.process': ProcessContentSchema,
    'home.pricing': PricingContentSchema,
    'home.gallery': GalleryContentSchema,
    'home.text_reveal': TextRevealContentSchema,
    'home.scroll_verb': ScrollVerbContentSchema,
    'home.clip_reveal': ClipRevealContentSchema,
    'legal.privacy': LegalContentSchema,
    'legal.terms': LegalContentSchema,
};
