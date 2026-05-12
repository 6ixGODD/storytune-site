/**
 * @file lib/services/rsvp.service.ts
 * RSVP submission service.
 *
 * Validates that the target card exists and is active, then dispatches an RSVP
 * notification email to the card owner via `lib/infra/mail.ts`. All functionality
 * is exposed on the `rsvpService` module singleton.
 */
import { sendRsvpNotification } from '@/lib/infra/mail';
import { createLogger } from '@/lib/logger';
import { cardRepository } from '@/lib/repositories/card.repository';

const logger = createLogger('rsvp.service');

/** Validated input from a guest RSVP form submission. */
export interface RsvpInput {
    slug: string;
    name: string;
    email: string;
    attending: 'yes' | 'no' | 'maybe';
    guests: number;
    message?: string;
}

/** Discriminated union returned by `rsvpService.submit`. */
export type RsvpResult = { success: true } | { success: false; error: string; status: number };

export const rsvpService = {
    /**
     * Process a guest RSVP submission.
     *
     * Looks up the card by slug, rejects if inactive, then sends a notification email
     * to the card owner.
     *
     * @param input - Guest RSVP data including slug, attendance status, and contact info.
     * @returns `{ success: true }` on success, or `{ success: false, error, status }` on failure.
     */
    async submit(input: RsvpInput): Promise<RsvpResult> {
        const card = await cardRepository.findActiveBySlug(input.slug);
        if (!card) {
            return { success: false, error: 'Invitation not found', status: 404 };
        }

        await sendRsvpNotification({
            clientName: card.clientName,
            clientEmail: card.clientEmail,
            cardTitle: card.title,
            cardUrl: card.cardUrl,
            guestName: input.name,
            guestEmail: input.email,
            attending: input.attending,
            guests: input.guests,
            message: input.message,
        });

        logger.info({ slug: input.slug, email: input.email, attending: input.attending }, 'RSVP submitted');
        return { success: true };
    },
};
