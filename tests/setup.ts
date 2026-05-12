/**
 * Global test setup — runs before every test file.
 * Sets env vars that the config module reads at import time.
 */
import os from 'node:os';
import path from 'node:path';

// Must be set before any @/lib/config import happens in tests.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
process.env['NODE_ENV'] = 'test';
process.env['STORYTUNE__JWT_SECRET'] = 'test-secret-32-chars-long-for-hs256';
process.env['STORYTUNE__JWT_EXPIRES_IN'] = '1h';
process.env['STORYTUNE__JWT_ALGORITHM'] = 'HS256';
process.env['STORYTUNE__UPLOADED_CARDS_PATH'] = path.join(os.tmpdir(), 'storytune-test', 'cards');
process.env['STORYTUNE__INSPIRATION_CARDS_PATH'] = path.join(os.tmpdir(), 'storytune-test', 'inspiration');
process.env['STORYTUNE__SITE_URL'] = 'http://localhost:3000';
process.env['STORYTUNE__RESEND_API_KEY'] = 're_test_key';
process.env['STORYTUNE__RESEND_FROM_EMAIL'] = 'test@example.com';
process.env['STORYTUNE__RESEND_FROM_NAME'] = 'Test';
// z.coerce.boolean() coerces the string "false" → Boolean("false") → true (non-empty string).
// Explicitly set to empty string so dotenv cannot inject the problematic "false" string from .env,
// and z.coerce.boolean('') → Boolean('') → false (disabled).
process.env['STORYTUNE__MONGODB_TLS'] = '';
