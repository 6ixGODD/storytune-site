import type { Metadata } from 'next';

import MarkdownPage from '@/components/legal/markdown-page';

export const metadata: Metadata = {
    title: 'Terms of Service — StoryTune',
    description: 'Terms and conditions for using StoryTune.',
};

const TERMS_MARKDOWN = `# Terms

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
`;

export default function TermsPage() {
    return <MarkdownPage markdown={TERMS_MARKDOWN} />;
}
