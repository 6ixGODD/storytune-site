#!/usr/bin/env node
/**
 * scripts/pack.mjs — Interactive deployment packager for StoryTune
 *
 * Usage: pnpm pack
 *
 * What it does:
 *   1. Checks prerequisites (Docker daemon, SSL certificates)
 *   2. Loads existing .env.prod (or seeds from .env.example)
 *   3. Interactively prompts for the four critical secrets:
 *        • MONGO_PASSWORD  — auto-generate or manual (syncs MONGODB_URI)
 *        • JWT_SECRET      — auto-generate or manual (≥ 32 chars)
 *        • RESEND_API_KEY  — required, must start with re_
 *        • Admin username / password
 *   4. Writes .env.prod
 *   5. Builds Docker image, saves to tar
 *   6. Assembles staging directory with all deployment artifacts
 *   7. Embeds a deploy.sh that detects running containers and acts accordingly
 *   8. Compresses everything into a timestamped storytune-deploy-*.tar.gz
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
    cancel,
    confirm,
    intro,
    isCancel,
    log,
    note,
    outro,
    password,
    select,
    spinner,
    text,
} from '@clack/prompts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const ENV_PROD = path.join(root, '.env.prod');
const ENV_EXAMPLE = path.join(root, '.env.example');

// ── Env helpers ───────────────────────────────────────────────────────────────

/** Parse a .env file into a plain key→value map. Values are stored verbatim. */
function parseEnvFile(filePath) {
    if (!fs.existsSync(filePath)) return {};
    const out = {};
    for (const raw of fs.readFileSync(filePath, 'utf8').split('\n')) {
        const line = raw.trim();
        if (!line || line.startsWith('#')) continue;
        const eq = line.indexOf('=');
        if (eq === -1) continue;
        out[line.slice(0, eq).trim()] = line.slice(eq + 1); // preserve value as-is
    }
    return out;
}

/**
 * Write back an env file, patching only the keys in `patches`.
 * If the file already exists its structure and comments are preserved.
 * If it doesn't, the .env.example template is used for structure.
 */
function writeEnvFile(destPath, patches) {
    const templatePath = fs.existsSync(destPath) ? destPath : ENV_EXAMPLE;
    const lines = fs.readFileSync(templatePath, 'utf8').split('\n');
    const written = new Set();

    const out = lines.map((raw) => {
        const line = raw.trim();
        if (!line || line.startsWith('#')) return raw;
        const eq = line.indexOf('=');
        if (eq === -1) return raw;
        const key = line.slice(0, eq).trim();
        if (key in patches) {
            written.add(key);
            return `${key}=${patches[key]}`;
        }
        return raw;
    });

    // Append any keys that were not found in the template
    for (const [key, value] of Object.entries(patches)) {
        if (!written.has(key)) out.push(`${key}=${value}`);
    }

    fs.writeFileSync(destPath, out.join('\n'), 'utf8');
}

/** Returns true if the value is an obvious placeholder (empty, CHANGE_ME, re_xxx…). */
function isPlaceholder(v) {
    if (!v || !v.trim()) return true;
    const t = v.trim();
    return t.startsWith('CHANGE_ME') || t === 're_xxxxxxxxxx' || t === 'CHANGE_ME_STRONG_PASSWORD';
}

// ── Interactive helpers ───────────────────────────────────────────────────────

function bail(msg = 'Cancelled.') {
    cancel(msg);
    process.exit(0);
}

/** Wrap any @clack call: bail on Ctrl-C, otherwise return the value. */
function g(value) {
    if (isCancel(value)) bail();
    return value;
}

// ── Main ──────────────────────────────────────────────────────────────────────

intro('📦  StoryTune — Deployment Packager');

// ── 1. Prerequisite checks ────────────────────────────────────────────────────

// Docker
const dockerCheck = spawnSync('docker', ['info'], { stdio: 'pipe', shell: true });
if (dockerCheck.status !== 0) {
    cancel('Docker is not running or not available. Start Docker and retry.');
    process.exit(1);
}

// SSL certificates
const sslDir = path.join(root, 'nginx', 'ssl');
const keyFile = path.join(sslDir, 'www.story-tune.com.key');
const pemFile = path.join(sslDir, 'www.story-tune.com.pem');
const keyOk = fs.existsSync(keyFile);
const pemOk = fs.existsSync(pemFile);

if (!keyOk || !pemOk) {
    cancel(
        'SSL certificates missing — cannot build a production package without them.\n\n' +
            `  nginx/ssl/www.story-tune.com.key  ${keyOk ? '✔' : '✖  MISSING'}\n` +
            `  nginx/ssl/www.story-tune.com.pem  ${pemOk ? '✔' : '✖  MISSING'}\n\n` +
            'Add both files under nginx/ssl/ and re-run.',
    );
    process.exit(1);
}

log.success('Docker is running. SSL certificates found.');

// ── 2. Load current env ───────────────────────────────────────────────────────

const envProdExists = fs.existsSync(ENV_PROD);
const current = parseEnvFile(envProdExists ? ENV_PROD : ENV_EXAMPLE);

if (envProdExists) {
    log.info('.env.prod found — existing values will be reused where not overwritten.');
} else {
    log.info('No .env.prod found — seeding from .env.example.');
}

// patches: only keys the user explicitly sets during this run
const patches = {};

// ── 3. MongoDB password ───────────────────────────────────────────────────────

const existingMongo = current['MONGO_PASSWORD'];
const mongoIsSet = !isPlaceholder(existingMongo);
let mongoPassword = existingMongo;

const updateMongo = mongoIsSet
    ? g(await confirm({ message: 'MONGO_PASSWORD is already set. Overwrite?', initialValue: false }))
    : true;

if (updateMongo) {
    const choice = g(
        await select({
            message: 'MongoDB password',
            options: [
                {
                    value: 'auto',
                    label: 'Auto-generate (recommended)',
                    hint: 'random 48-char hex string',
                },
                { value: 'manual', label: 'Enter manually' },
            ],
        }),
    );

    if (choice === 'auto') {
        mongoPassword = crypto.randomBytes(24).toString('hex');
        log.success('MongoDB password generated.');
    } else {
        mongoPassword = g(
            await text({
                message: 'MongoDB password (min 12 chars)',
                validate: (v) => (v.length < 12 ? 'Must be at least 12 characters' : undefined),
            }),
        );
    }

    patches['MONGO_PASSWORD'] = mongoPassword;
    // Keep the URI in sync — docker-compose.prod.yml overrides it at runtime too,
    // but having it here keeps .env.prod self-documenting.
    patches['STORYTUNE__MONGODB_URI'] =
        `mongodb://storytune:${mongoPassword}@mongo:27017/storytune?authSource=admin`;
}

// ── 4. JWT secret ─────────────────────────────────────────────────────────────

const existingJwt = current['STORYTUNE__JWT_SECRET'];
const jwtIsSet = !isPlaceholder(existingJwt);
let jwtSecret = existingJwt;

const updateJwt = jwtIsSet
    ? g(await confirm({ message: 'JWT_SECRET is already set. Overwrite?', initialValue: false }))
    : true;

if (updateJwt) {
    const choice = g(
        await select({
            message: 'JWT secret',
            options: [
                {
                    value: 'auto',
                    label: 'Auto-generate (recommended)',
                    hint: 'random 64-char hex string',
                },
                { value: 'manual', label: 'Enter manually (min 32 chars)' },
            ],
        }),
    );

    if (choice === 'auto') {
        jwtSecret = crypto.randomBytes(32).toString('hex');
        log.success('JWT secret generated.');
    } else {
        jwtSecret = g(
            await password({
                message: 'JWT secret',
                validate: (v) =>
                    v.length < 32 ? 'Must be at least 32 characters — try auto-generate' : undefined,
            }),
        );
    }

    patches['STORYTUNE__JWT_SECRET'] = jwtSecret;
}

// ── 5. Resend API key ─────────────────────────────────────────────────────────

const existingResend = current['STORYTUNE__RESEND_API_KEY'];
const resendIsSet = !isPlaceholder(existingResend);

const updateResend = resendIsSet
    ? g(await confirm({ message: 'RESEND_API_KEY is already set. Overwrite?', initialValue: false }))
    : true;

if (updateResend) {
    const resendKey = g(
        await text({
            message: 'Resend API key  (required — get one at resend.com)',
            placeholder: 're_xxxxxxxxxxxxxxxxxxxx',
            validate: (v) => {
                const t = v.trim();
                if (!t) return 'Resend API key is required — the platform cannot send email without it';
                if (!t.startsWith('re_')) return 'Key must start with re_';
                if (t.length < 12) return 'Key looks too short';
            },
        }),
    );
    patches['STORYTUNE__RESEND_API_KEY'] = resendKey.trim();
}

// ── 6. Admin credentials ──────────────────────────────────────────────────────

const existingAdminPass = current['STORYTUNE__ADMIN_PASSWORD'];
const adminIsSet = !isPlaceholder(existingAdminPass);

const updateAdmin = adminIsSet
    ? g(await confirm({ message: 'Admin credentials are already set. Overwrite?', initialValue: false }))
    : true;

if (updateAdmin) {
    const adminUser = g(
        await text({
            message: 'Admin username',
            placeholder: 'admin',
            defaultValue: 'admin',
            validate: (v) => (!v.trim() ? 'Username is required' : undefined),
        }),
    );

    const adminPass = g(
        await password({
            message: 'Admin password (min 8 chars)',
            validate: (v) => (v.length < 8 ? 'Must be at least 8 characters' : undefined),
        }),
    );

    patches['STORYTUNE__ADMIN_USERNAME'] = adminUser.trim();
    patches['STORYTUNE__ADMIN_PASSWORD'] = adminPass;
}

// ── 7. Log targets ────────────────────────────────────────────────────────────

const existingLogTargets = current['STORYTUNE__LOG_TARGETS'];
const existingLogLevel = current['STORYTUNE__LOG_LEVEL'];

const configLogs = g(
    await confirm({
        message: 'Configure log targets?',
        initialValue: !existingLogTargets || existingLogTargets.includes('stdout'),
    }),
);

if (configLogs) {
    // Log level
    const logLevel = g(
        await select({
            message: 'Minimum log level',
            options: [
                { value: 'info', label: 'info', hint: 'recommended for production' },
                { value: 'warn', label: 'warn', hint: 'errors and warnings only' },
                { value: 'debug', label: 'debug', hint: 'verbose — use for troubleshooting' },
                { value: 'error', label: 'error', hint: 'errors only' },
            ],
            initialValue: existingLogLevel?.trim() || 'info',
        }),
    );
    patches['STORYTUNE__LOG_LEVEL'] = logLevel;

    // Build targets array interactively
    /** @type {Array<{type:string, path?:string, maxSizeMb?:number}>} */
    const targets = [];
    let addingTargets = true;

    log.info('Add one or more log targets. Choose "Done" when finished.');

    while (addingTargets) {
        const currentList =
            targets.length === 0
                ? '(none yet)'
                : targets.map((t) => (t.type === 'file' ? `file → ${t.path} (${t.maxSizeMb} MB)` : t.type)).join(', ');

        const targetType = g(
            await select({
                message: `Add target  [current: ${currentList}]`,
                options: [
                    { value: 'stdout', label: 'stdout', hint: 'write to standard output' },
                    { value: 'stderr', label: 'stderr', hint: 'write to standard error' },
                    { value: 'file', label: 'file', hint: 'write to a file with size-based rotation' },
                    { value: 'done', label: '✓ Done', hint: 'finish adding targets' },
                ],
            }),
        );

        if (targetType === 'done') {
            if (targets.length === 0) {
                log.warn('No targets added — defaulting to stdout.');
                targets.push({ type: 'stdout' });
            }
            addingTargets = false;
        } else if (targetType === 'stdout' || targetType === 'stderr') {
            const already = targets.some((t) => t.type === targetType);
            if (already) {
                log.warn(`${targetType} is already in the list — skipped.`);
            } else {
                targets.push({ type: targetType });
                log.success(`Added: ${targetType}`);
            }
        } else if (targetType === 'file') {
            const filePath = g(
                await text({
                    message: 'Log file path (absolute)',
                    placeholder: '/var/log/storytune/app.log',
                    defaultValue: '/var/log/storytune/app.log',
                    validate: (v) => {
                        const t = v.trim();
                        if (!t) return 'Path is required';
                        if (!t.startsWith('/')) return 'Path must be absolute (start with /)';
                    },
                }),
            );

            const maxSizeRaw = g(
                await text({
                    message: 'Rotate when file exceeds (MB)',
                    placeholder: '100',
                    defaultValue: '100',
                    validate: (v) => {
                        const n = parseInt(v, 10);
                        if (isNaN(n) || n < 1) return 'Must be a positive integer';
                    },
                }),
            );

            const maxSizeMb = parseInt(maxSizeRaw, 10);
            targets.push({ type: 'file', path: filePath.trim(), maxSizeMb });
            log.success(`Added: file → ${filePath.trim()} (rotate at ${maxSizeMb} MB)`);
        }
    }

    patches['STORYTUNE__LOG_TARGETS'] = JSON.stringify(targets);
    log.success(`Log targets set: ${patches['STORYTUNE__LOG_TARGETS']}`);
}

// ── 8. Write .env.prod ────────────────────────────────────────────────────────

if (Object.keys(patches).length > 0) {
    writeEnvFile(ENV_PROD, patches);
    log.success('.env.prod written.');
} else {
    log.info('No secrets changed — .env.prod left untouched.');
}

note(
    'Review or edit .env.prod now for any other settings\n' +
        '(e.g. STORYTUNE__SITE_URL, STORYTUNE__RESEND_FROM_EMAIL).\n\n' +
        'Press Enter here when ready to continue.',
    'Optional review',
);

g(await text({ message: 'Press Enter to start building…', defaultValue: '' }));

// ── 9. Build Docker image ─────────────────────────────────────────────────────

log.step('Building Docker image (no-cache) — this may take a few minutes…');
console.log();

const buildResult = spawnSync('docker', ['compose', 'build', '--no-cache'], {
    stdio: 'inherit',
    cwd: root,
    shell: true,
});
if (buildResult.status !== 0) {
    cancel(`Docker build failed (exit ${buildResult.status}).`);
    process.exit(1);
}

log.success('Docker image built.');

// ── 10. Staging area ──────────────────────────────────────────────────────────

const timestamp = new Date()
    .toISOString()
    .replace(/[-:T]/g, (c) => ({ '-': '', ':': '', T: '-' }[c] ?? c))
    .slice(0, 15);
const archiveName = `storytune-deploy-${timestamp}.tar.gz`;
const stagingDir = path.join(root, '.pack-staging');
const outputFile = path.join(root, archiveName);

if (fs.existsSync(stagingDir)) fs.rmSync(stagingDir, { recursive: true, force: true });
fs.mkdirSync(path.join(stagingDir, 'images'), { recursive: true });

// Save image
const saveSpin = spinner();
saveSpin.start('Saving Docker image to tar…');

const imageTar = path.join(stagingDir, 'images', 'storytune-app.tar');
const saveResult = spawnSync('docker', ['save', 'storytune-app:latest', '-o', imageTar], {
    stdio: 'pipe',
    cwd: root,
    shell: true,
});
if (saveResult.status !== 0) {
    saveSpin.stop('Image save failed.');
    process.exit(1);
}
saveSpin.stop('Docker image saved.');

// ── 11. Copy deployment artifacts ─────────────────────────────────────────────
const copyArtifact = (relSrc, relDest) => {
    const src = path.join(root, relSrc);
    const dst = path.join(stagingDir, relDest ?? relSrc);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
        fs.cpSync(src, dst, { recursive: true });
    } else {
        fs.copyFileSync(src, dst);
    }
};

copyArtifact('docker-compose.yml');
copyArtifact('docker-compose.prod.yml');
copyArtifact('.env.prod', '.env'); // bake .env.prod as .env in the archive
copyArtifact('nginx');
copyArtifact('emails/templates', 'emails/templates');

// ── 12. deploy.sh ─────────────────────────────────────────────────────────────

const deployScript = `#!/usr/bin/env bash
# StoryTune — one-shot deployment script
# Generated: ${new Date().toISOString()}
#
# Run from the extracted directory on the target server:
#   bash deploy.sh

set -euo pipefail

COMPOSE_BASE="docker-compose.yml"
COMPOSE_PROD="docker-compose.prod.yml"
IMAGE_TAR="images/storytune-app.tar"
COMPOSE="docker compose -f $COMPOSE_BASE -f $COMPOSE_PROD"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   StoryTune — Deploy                 ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Detect running containers from this compose stack
RUNNING=$(docker compose -f "$COMPOSE_BASE" -f "$COMPOSE_PROD" ps -q 2>/dev/null | head -1 || true)

if [ -n "$RUNNING" ]; then
    echo "⚠  Running containers detected — bringing stack down first…"
    $COMPOSE down
    echo ""
fi

echo "📦  Loading image…"
docker load -i "$IMAGE_TAR"
echo ""

echo "🚀  Starting stack…"
$COMPOSE up -d

echo ""
echo "✔  Deployment complete!"
echo ""
echo "  Status : $COMPOSE ps"
echo "  Logs   : $COMPOSE logs -f app"
echo ""
`;

fs.writeFileSync(path.join(stagingDir, 'deploy.sh'), deployScript, { mode: 0o755 });

// ── 13. README ────────────────────────────────────────────────────────────────

const readme = `# StoryTune — Deployment Package

Built: ${new Date().toISOString()}

## Deploy

\`\`\`bash
bash deploy.sh
\`\`\`

The script automatically detects whether the stack is already running,
brings it down if needed, loads the new image, and starts all services.

## Manual steps (if preferred)

\`\`\`bash
docker load -i images/storytune-app.tar
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
\`\`\`

## Update

Re-upload the new package, extract, and run \`bash deploy.sh\` again.
`;

fs.writeFileSync(path.join(stagingDir, 'README.md'), readme);

// ── 14. Create archive ────────────────────────────────────────────────────────

const archiveSpin = spinner();
archiveSpin.start('Creating archive…');

const tarResult = spawnSync('tar', ['-czf', outputFile, '-C', stagingDir, '.'], {
    stdio: 'pipe',
    cwd: root,
    shell: true,
});
if (tarResult.status !== 0) {
    archiveSpin.stop('Archive creation failed.');
    process.exit(1);
}
archiveSpin.stop('Archive created.');

// Cleanup staging
fs.rmSync(stagingDir, { recursive: true, force: true });

// ── Done ──────────────────────────────────────────────────────────────────────

const sizeMB = (fs.statSync(outputFile).size / 1024 / 1024).toFixed(1);

outro(
    `✔  ${archiveName}  (${sizeMB} MB)\n\n` +
        `  Transfer:  scp ${archiveName} user@server:/opt/storytune/\n` +
        `  Deploy:    ssh user@server "cd /opt/storytune && tar -xzf ${archiveName} -C storytune-deploy --one-top-level && bash storytune-deploy/deploy.sh"`,
);
