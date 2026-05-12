/**
 * @file lib/infra/mail.ts
 * Transactional email sending via [Resend](https://resend.com).
 *
 * Email bodies are rendered from Handlebars templates stored in
 * `config.mail.templateDir` (default: `emails/templates/`). Each email type has
 * two template files: `<name>.html.hbs` (HTML body) and `<name>.subject.hbs`
 * (subject line).
 *
 * @example
 * ```ts
 * import { sendRsvpNotification } from '@/lib/infra/mail';
 * await sendRsvpNotification({ clientName, clientEmail, ... });
 * ```
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import handlebars from 'handlebars';
import { Resend } from 'resend';

import { config } from '@/lib/config';
import { createLogger } from '@/lib/logger';

const log = createLogger('infra.mail');

function getResend(): Resend {
    if (!config.resend.apiKey) {
        throw new Error('Resend API key is not configured (STORYTUNE__RESEND_API_KEY)');
    }
    return new Resend(config.resend.apiKey);
}

/**
 * Read a Handlebars template file from the configured template directory and
 * render it with the provided data context.
 *
 * @param name - Template file name relative to `config.mail.templateDir`.
 * @param data - Key-value context passed to the template compiler.
 * @returns Rendered string output.
 */
async function renderTemplate(name: string, data: Record<string, unknown>): Promise<string> {
    const templatePath = path.join(config.mail.templateDir, name);
    const source = await readFile(templatePath, 'utf-8');
    return handlebars.compile(source)(data);
}

/** Data required to generate an RSVP notification email. */
export interface RsvpEmailData {
    /** Name of the card owner who will receive this notification. */
    clientName: string;
    /** Email address of the card owner. */
    clientEmail: string;
    /** Human-readable title of the invitation card. */
    cardTitle?: string;
    /** Relative URL path of the card, e.g. `/card/my-wedding`. */
    cardUrl: string;
    /** Name of the guest who submitted the RSVP. */
    guestName: string;
    /** Email address of the guest. */
    guestEmail: string;
    /** Guest's attendance response. */
    attending: 'yes' | 'no' | 'maybe';
    /** Number of additional guests the respondent is bringing. */
    guests: number;
    /** Optional free-text message from the guest. */
    message?: string;
}

/**
 * Send an RSVP notification email to the card owner.
 *
 * Renders `rsvp-notification.html.hbs` and `rsvp-notification.subject.hbs`
 * from the configured template directory, then dispatches via Resend.
 *
 * @param data - RSVP and card metadata used to populate the email templates.
 * @throws If Resend returns an error or a template file cannot be read.
 */
export async function sendRsvpNotification(data: RsvpEmailData): Promise<void> {
    const attendingLabel = { yes: '✅ Attending', no: '❌ Not Attending', maybe: '🤔 Maybe' }[data.attending];
    const attendingVerb = { yes: 'Attending', no: 'Not Attending', maybe: 'Maybe' }[data.attending];
    const cardUrl = `${config.app.baseUrl}${data.cardUrl}`;

    const templateData = {
        clientName: data.clientName,
        cardTitle: data.cardTitle ?? 'Your Invitation',
        guestName: data.guestName,
        guestEmail: data.guestEmail,
        attendingLabel,
        attendingVerb,
        extraGuests: data.guests > 0 ? data.guests : 0,
        multipleGuests: data.guests > 1,
        message: data.message,
        cardUrl,
    };

    const [html, subject] = await Promise.all([
        renderTemplate('rsvp-notification.html.hbs', templateData),
        renderTemplate('rsvp-notification.subject.hbs', templateData),
    ]);

    await getResend().emails.send({
        from: `${config.resend.fromName} <${config.resend.fromEmail}>`,
        to: data.clientEmail,
        subject: subject.trim(),
        html,
    });

    log.info({ to: data.clientEmail, guestName: data.guestName }, 'RSVP notification sent');
}
