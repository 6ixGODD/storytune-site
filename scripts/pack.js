#!/usr/bin/env node
/**
 * scripts/pack.js
 *
 * Creates a self-contained deployment archive that can be transferred to any
 * server and launched with a single `docker compose` command.
 *
 * Steps:
 *   1. Build the Docker image via `docker compose build`
 *   2. Save the image to a .tar file with `docker save`
 *   3. Assemble all deployment artifacts in a temp staging directory
 *   4. Compress everything into a timestamped tar.gz
 *   5. Clean up the staging directory
 *
 * Output: storytune-deploy-<YYYYMMDD-HHmmss>.tar.gz (in the repo root)
 *
 * On the target server:
 *   tar -xzf storytune-deploy-*.tar.gz
 *   cd storytune-deploy/
 *   docker load -i images/storytune-app.tar
 *   cp .env.example .env && nano .env   # fill in secrets + MONGO_PASSWORD
 *   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const timestamp = new Date()
    .toISOString()
    .replace(/[-:T]/g, (c) => ({ '-': '', ':': '', T: '-' }[c] ?? c))
    .slice(0, 15); // YYYYMMDD-HHmmss
const archiveName = `storytune-deploy-${timestamp}.tar.gz`;
const stagingDir = path.join(root, '.pack-staging');
const outputFile = path.join(root, archiveName);

function run(cmd, args, opts = {}) {
    console.log(`\n▶ ${cmd} ${args.join(' ')}`);
    const result = spawnSync(cmd, args, { stdio: 'inherit', cwd: root, shell: true, ...opts });
    if (result.status !== 0) {
        console.error(`✖ Command failed (exit ${result.status})`);
        process.exit(result.status ?? 1);
    }
}

function copyFileToStaging(relSrc, relDest) {
    const src = path.join(root, relSrc);
    const dest = path.join(stagingDir, relDest ?? relSrc);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
}

function copyDirToStaging(relSrc, relDest) {
    const src = path.join(root, relSrc);
    const dest = path.join(stagingDir, relDest ?? relSrc);
    fs.cpSync(src, dest, { recursive: true });
}

// ── Cleanup helper ────────────────────────────────────────────────────────────
function cleanup() {
    if (fs.existsSync(stagingDir)) {
        fs.rmSync(stagingDir, { recursive: true, force: true });
    }
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log('📦 StoryTune deployment packager\n');

// Guard: make sure Docker is available.
const dockerCheck = spawnSync('docker', ['info'], { stdio: 'pipe', shell: true });
if (dockerCheck.status !== 0) {
    console.error('✖ Docker is not running or not available. Please start Docker and retry.');
    process.exit(1);
}

// 1. Build
console.log('\n── Step 1: Build Docker image ─────────────────────────────────');
run('docker', ['compose', 'build', '--no-cache']);

// 2. Prepare staging area
console.log('\n── Step 2: Prepare staging directory ──────────────────────────');
cleanup();
fs.mkdirSync(path.join(stagingDir, 'images'), { recursive: true });

// 3. Save image
console.log('\n── Step 3: Save Docker image ───────────────────────────────────');
const imageTar = path.join(stagingDir, 'images', 'storytune-app.tar');
run('docker', ['save', 'storytune-app:latest', '-o', imageTar]);

// 4. Copy deployment files
console.log('\n── Step 4: Copy deployment files ───────────────────────────────');

copyFileToStaging('docker-compose.yml');
copyFileToStaging('docker-compose.prod.yml');
copyFileToStaging('.env.example', '.env');       // server fills this in
copyDirToStaging('nginx');
copyDirToStaging('emails/templates', 'emails/templates');

// Write a quick-start README into the archive.
const readme = `# StoryTune — Deployment Package

Built: ${new Date().toISOString()}

## Quick Start

\`\`\`bash
# 1. Load the pre-built app image
docker load -i images/storytune-app.tar

# 2. Configure environment
#    Fill in all CHANGE_ME values, especially:
#      - MONGO_PASSWORD
#      - STORYTUNE__JWT_SECRET
#      - STORYTUNE__RESEND_API_KEY
#      - STORYTUNE__SITE_URL
nano .env

# 3. (Optional) Place SSL certificates in nginx/ssl/
#    fullchain.pem + privkey.pem, then uncomment the HTTPS block in
#    nginx/conf.d/storytune.conf

# 4. Start
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
\`\`\`

## Updates

Re-upload a new package, load the new image, then restart:

\`\`\`bash
docker load -i images/storytune-app.tar
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --no-deps app
\`\`\`
`;
fs.writeFileSync(path.join(stagingDir, 'README.md'), readme);

// 5. Create archive
console.log('\n── Step 5: Create archive ──────────────────────────────────────');
run('tar', ['-czf', outputFile, '-C', stagingDir, '.']);

// 6. Cleanup
cleanup();

const sizeMB = (fs.statSync(outputFile).size / 1024 / 1024).toFixed(1);
console.log(`\n✔ Done! Archive: ${archiveName} (${sizeMB} MB)\n`);
console.log('Transfer to server:');
console.log(`  scp ${archiveName} user@server:/opt/storytune/\n`);
