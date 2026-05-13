import type { Metadata } from 'next';

import MarkdownPage from '@/components/legal/markdown-page';

export const metadata: Metadata = {
    title: 'Privacy Policy — StoryTune',
    description: 'How StoryTune collects and uses your information.',
};

const PRIVACY_MARKDOWN = `# Privacy

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
`;

export default function PrivacyPage() {
    return <MarkdownPage markdown={PRIVACY_MARKDOWN} />;
}
