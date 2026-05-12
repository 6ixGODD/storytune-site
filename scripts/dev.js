#!/usr/bin/env node
/**
 * scripts/dev.js
 *
 * Local development launcher. Run via `pnpm dev:local`.
 *
 * Steps:
 *   1. Copy .env.dev → .env  (so Next.js and dotenv pick up dev values)
 *   2. Start backing services (MongoDB) via docker compose -f docker-compose.dev.yml up -d
 *   3. Launch `next dev` in the foreground
 *
 * Ctrl-C stops Next.js; Docker containers keep running until you run:
 *   docker compose -f docker-compose.dev.yml down
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync, spawn } = require('child_process');

const root = path.resolve(__dirname, '..');
const envDev = path.join(root, '.env.dev');
const envFile = path.join(root, '.env');

// ── 1. Copy .env.dev → .env ───────────────────────────────────────────────────
if (!fs.existsSync(envDev)) {
    console.error('[dev] ERROR: .env.dev not found. Create it from .env.example.');
    process.exit(1);
}
fs.copyFileSync(envDev, envFile);
// eslint-disable-next-line no-console
console.log('[dev] Copied .env.dev → .env');

// ── 2. Start Docker Compose dev services ──────────────────────────────────────
// eslint-disable-next-line no-console
console.log('[dev] Starting Docker Compose dev services…');
const composeFile = path.join(root, 'docker-compose.dev.yml');
const compose = spawnSync(
    'docker',
    ['compose', '-f', composeFile, 'up', '-d', '--wait'],
    { stdio: 'inherit', cwd: root, shell: true },
);

if (compose.status !== 0) {
    console.error('[dev] docker compose failed — is Docker running?');
    process.exit(1);
}
// eslint-disable-next-line no-console
console.log('[dev] Services ready.');

// ── 3. Launch Next.js dev server ──────────────────────────────────────────────
// eslint-disable-next-line no-console
console.log('[dev] Starting Next.js dev server…\n');

// Use the local next binary so we don't depend on a global install.
const isWindows = process.platform === 'win32';
const nextBin = path.join(root, 'node_modules', '.bin', isWindows ? 'next.cmd' : 'next');

const nextDev = spawn(nextBin, ['dev'], {
    stdio: 'inherit',
    cwd: root,
    shell: isWindows,
    env: { ...process.env },
});

nextDev.on('close', (code) => process.exit(code ?? 0));

// Forward Ctrl-C so Next.js can clean up gracefully.
process.on('SIGINT', () => nextDev.kill('SIGINT'));
process.on('SIGTERM', () => nextDev.kill('SIGTERM'));
