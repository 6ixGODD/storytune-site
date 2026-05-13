#!/usr/bin/env node
/**
 * scripts/release.mjs — Interactive version release helper
 *
 * Usage:
 *   pnpm release           # prompts for version
 *   pnpm release 1.2.3     # uses given semver directly
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { cancel, confirm, intro, isCancel, log, outro, text } from '@clack/prompts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const SEMVER_RE = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/;

function bail(msg = 'Cancelled.') {
    cancel(msg);
    process.exit(0);
}

function g(value) {
    if (isCancel(value)) bail();
    return value;
}

function run(cmd, args, opts = {}) {
    const result = spawnSync(cmd, args, { cwd: root, shell: false, stdio: 'pipe', ...opts });
    if (result.status !== 0) {
        const stderr = result.stderr?.toString().trim();
        throw new Error(stderr || `Command failed: ${cmd} ${args.join(' ')}`);
    }
    return result.stdout?.toString().trim() ?? '';
}

// ── Main ──────────────────────────────────────────────────────────────────────

intro('🏷️   StoryTune — Release');

// ── 1. Resolve version ────────────────────────────────────────────────────────

const pkgPath = path.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const currentVersion = pkg.version;

log.info(`Current version: ${currentVersion}`);

let newVersion = process.argv[2]?.trim();

if (newVersion) {
    if (!SEMVER_RE.test(newVersion)) {
        cancel(`"${newVersion}" is not a valid semver string (e.g. 1.2.3 or 1.2.3-beta.1).`);
        process.exit(1);
    }
} else {
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    newVersion = g(
        await text({
            message: 'New version (semver)',
            placeholder: `${major}.${minor}.${patch + 1}`,
            defaultValue: `${major}.${minor}.${patch + 1}`,
            validate: (v) => (!SEMVER_RE.test(v.trim()) ? 'Must be a valid semver string (e.g. 1.2.3)' : undefined),
        }),
    );
    newVersion = newVersion.trim();
}

if (newVersion === currentVersion) {
    cancel(`Version is already ${currentVersion} — no change needed.`);
    process.exit(0);
}

log.step(`Releasing  ${currentVersion}  →  ${newVersion}`);

// ── 2. Write VERSION file ─────────────────────────────────────────────────────

fs.writeFileSync(path.join(root, 'VERSION'), newVersion + '\n', 'utf8');
log.success(`VERSION → ${newVersion}`);

// ── 3. Update package.json version ───────────────────────────────────────────

pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
log.success(`package.json version → ${newVersion}`);

// ── 4. Git commit ─────────────────────────────────────────────────────────────

const doCommit = g(
    await confirm({
        message: 'Commit VERSION + package.json?',
        initialValue: true,
    }),
);

if (doCommit) {
    try {
        run('git', ['add', 'VERSION', 'package.json']);
        run('git', [
            'commit',
            '-m', `chore(release): bump version to ${newVersion}`,
            '-m', 'Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>',
        ]);
        log.success('Committed.');
    } catch (err) {
        log.error(`Commit failed: ${err.message}`);
    }
}

// ── 5. Git tag ────────────────────────────────────────────────────────────────

const tagName = `v${newVersion}`;
const doTag = g(
    await confirm({
        message: `Create git tag ${tagName}?`,
        initialValue: true,
    }),
);

if (doTag) {
    try {
        run('git', ['tag', '-a', tagName, '-m', `Release ${tagName}`]);
        log.success(`Tagged ${tagName}`);

        const doPush = g(
            await confirm({
                message: `Push ${tagName} to remote?`,
                initialValue: true,
            }),
        );

        if (doPush) {
            // Detect remote
            let remote = 'origin';
            try {
                remote = run('git', ['remote']).split('\n')[0].trim() || 'origin';
            } catch {
                // fall back to origin
            }

            try {
                run('git', ['push', remote, tagName], { stdio: 'inherit' });
                log.success(`Pushed ${tagName} to ${remote}.`);

                if (doCommit) {
                    const doPushCommit = g(
                        await confirm({
                            message: `Also push the version commit to ${remote}?`,
                            initialValue: true,
                        }),
                    );
                    if (doPushCommit) {
                        run('git', ['push', remote], { stdio: 'inherit' });
                        log.success('Commit pushed.');
                    }
                }
            } catch (err) {
                log.error(`Push failed: ${err.message}`);
            }
        }
    } catch (err) {
        log.error(`Tag failed: ${err.message}`);
    }
}

outro(`🎉  v${newVersion} ready!`);
