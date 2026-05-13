/**
 * @file tests/infra/mail.test.ts
 * Unit tests for `sendRsvpNotification` in `lib/infra/mail.ts`.
 *
 * Both the Resend SDK and `node:fs/promises` are mocked so no real HTTP calls
 * or filesystem access occur. Handlebars still runs against the mock template
 * strings, exercising the template-rendering path.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Module mocks ──────────────────────────────────────────────────────────────
// vi.mock() factories are hoisted to the top of the file by Vitest's AST transform,
// so any variables they reference must also be hoisted via vi.hoisted().

const { mockEmailsSend, MockResend, mockReadFile } = vi.hoisted(() => {
    const mockEmailsSend = vi.fn().mockResolvedValue({ data: { id: 'email-id-001' }, error: null });
    const mockReadFile = vi.fn();
    // Use a class so that `new Resend()` works correctly — arrow functions cannot
    // be used as constructors and Vitest 4.x warns/ignores their return value.
    class MockResend {
        emails = { send: mockEmailsSend };
    }
    return { mockEmailsSend, MockResend, mockReadFile };
});

vi.mock('resend', () => ({ Resend: MockResend }));

// readFile is called twice per sendRsvpNotification: once for .html.hbs, once for .subject.hbs
vi.mock('node:fs/promises', () => ({ readFile: mockReadFile }));

import { sendRsvpNotification } from '@/lib/infra/mail';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Default readFile mock: returns a minimal Handlebars template for each file type. */
function defaultReadFile(filePath: string): Promise<string> {
    if (String(filePath).endsWith('.subject.hbs')) {
        return Promise.resolve('RSVP from {{guestName}} ({{attendingVerb}})');
    }
    return Promise.resolve('<p>Hi {{clientName}}, {{guestName}} is {{attendingLabel}}.</p>');
}

const BASE_DATA = {
    clientName: 'Alice',
    clientEmail: 'alice@example.com',
    cardTitle: 'Alice & Bob Wedding',
    cardUrl: '/card/alice-bob-wedding',
    guestName: 'Charlie',
    guestEmail: 'charlie@guest.com',
    attending: 'yes' as const,
    guests: 0,
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('sendRsvpNotification()', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Re-apply default implementations after clearAllMocks (which only clears call history,
        // but per-test mockImplementation overrides persist across tests otherwise).
        mockReadFile.mockImplementation(defaultReadFile);
        mockEmailsSend.mockResolvedValue({ data: { id: 'email-id-001' }, error: null });
    });

    it('calls Resend emails.send with the card owner email as recipient', async () => {
        await sendRsvpNotification(BASE_DATA);

        expect(mockEmailsSend).toHaveBeenCalledOnce();
        const call = mockEmailsSend.mock.calls[0][0];
        expect(call.to).toBe('alice@example.com');
    });

    it('reads both the HTML body and subject templates', async () => {
        await sendRsvpNotification(BASE_DATA);

        expect(mockReadFile).toHaveBeenCalledTimes(2);
        const paths = mockReadFile.mock.calls.map((c: unknown[]) => String(c[0]));
        expect(paths.some((p: string) => p.endsWith('rsvp-notification.html.hbs'))).toBe(true);
        expect(paths.some((p: string) => p.endsWith('rsvp-notification.subject.hbs'))).toBe(true);
    });

    it('renders the guest name into the subject line', async () => {
        await sendRsvpNotification(BASE_DATA);

        const call = mockEmailsSend.mock.calls[0][0];
        expect(call.subject).toContain('Charlie');
    });

    it('trims whitespace from the rendered subject', async () => {
        mockReadFile.mockImplementation((filePath: string) => {
            if (String(filePath).endsWith('.subject.hbs')) {
                return Promise.resolve('  Subject with leading/trailing space  ');
            }
            return Promise.resolve('<p>body</p>');
        });

        await sendRsvpNotification(BASE_DATA);

        const call = mockEmailsSend.mock.calls[0][0];
        expect(call.subject).toBe('Subject with leading/trailing space');
    });

    it('renders "✅ Attending" label for attending=yes', async () => {
        await sendRsvpNotification({ ...BASE_DATA, attending: 'yes' });

        const call = mockEmailsSend.mock.calls[0][0];
        expect(call.html).toContain('✅ Attending');
    });

    it('renders "❌ Not Attending" label for attending=no', async () => {
        await sendRsvpNotification({ ...BASE_DATA, attending: 'no' });

        const call = mockEmailsSend.mock.calls[0][0];
        expect(call.html).toContain('❌ Not Attending');
    });

    it('renders "🤔 Maybe" label for attending=maybe', async () => {
        await sendRsvpNotification({ ...BASE_DATA, attending: 'maybe' });

        const call = mockEmailsSend.mock.calls[0][0];
        expect(call.html).toContain('🤔 Maybe');
    });

    it('uses "Your Invitation" as the default card title when none is provided', async () => {
        // The template mock renders {{clientName}} not {{cardTitle}}, but we can verify
        // via subject template that data context is correct by using a custom subject template.
        mockReadFile.mockImplementation((filePath: string) => {
            if (String(filePath).endsWith('.subject.hbs')) {
                return Promise.resolve('{{cardTitle}}');
            }
            return Promise.resolve('');
        });

        const dataWithoutTitle = { ...BASE_DATA };
        delete (dataWithoutTitle as Record<string, unknown>)['cardTitle'];

        await sendRsvpNotification(dataWithoutTitle);

        const call = mockEmailsSend.mock.calls[0][0];
        expect(call.subject).toBe('Your Invitation');
    });

    it('includes the full card URL with the site base URL', async () => {
        mockReadFile.mockImplementation((filePath: string) => {
            if (String(filePath).endsWith('.subject.hbs')) return Promise.resolve('subj');
            return Promise.resolve('{{cardUrl}}');
        });

        await sendRsvpNotification(BASE_DATA);

        const call = mockEmailsSend.mock.calls[0][0];
        // config.app.baseUrl is 'http://localhost:3000' (set in tests/setup.ts)
        expect(call.html).toContain('http://localhost:3000/card/alice-bob-wedding');
    });

    it('constructs the From header from resend config', async () => {
        await sendRsvpNotification(BASE_DATA);

        const call = mockEmailsSend.mock.calls[0][0];
        // config.resend.fromName='Test', config.resend.fromEmail='test@example.com' (setup.ts)
        expect(call.from).toMatch(/Test <test@example\.com>/);
    });

    it('propagates the error when Resend rejects', async () => {
        mockEmailsSend.mockRejectedValueOnce(new Error('Resend API down'));

        await expect(sendRsvpNotification(BASE_DATA)).rejects.toThrow('Resend API down');
    });

    it('propagates the error when a template file cannot be read', async () => {
        mockReadFile.mockRejectedValueOnce(new Error('ENOENT: no such file'));

        await expect(sendRsvpNotification(BASE_DATA)).rejects.toThrow('ENOENT');
    });
});
