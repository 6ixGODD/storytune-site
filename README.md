# StoryTune

AI-powered digital invitation delivery platform. Admins upload self-contained HTML/CSS/JS invitation packages (ZIP); the
platform stores, serves, and tracks them. Three public surfaces: marketing landing page, inspiration gallery, per-card
delivery URL.

---

## Stack

| Layer           | Technology                                            |
| --------------- | ----------------------------------------------------- |
| Framework       | Next.js 16 (App Router), React 19, TypeScript strict  |
| Styling         | SCSS (`sass`), Tailwind CSS 4, shadcn/ui, Radix UI    |
| Database        | MongoDB 7 via `mongodb` driver (no ODM)               |
| Auth            | JWT in HTTP-only cookies (`jsonwebtoken`, `bcryptjs`) |
| Email           | Resend + Handlebars HTML templates                    |
| Validation      | Zod 4                                                 |
| Logging         | Pino + pino-pretty                                    |
| Testing         | Vitest + Testcontainers (MongoDB)                     |
| Package manager | pnpm                                                  |
| Runtime         | Node.js 22 (Alpine, Docker standalone output)         |
| Reverse proxy   | nginx (Alpine)                                        |

---

## Prerequisites

- Node.js ≥ 22, pnpm ≥ 9
- Docker + Docker Compose v2 (for any non-`next dev` workflow)

---

## Development

`pnpm dev` spins up MongoDB in Docker and starts `next dev` against your local filesystem. On first run, copy
`.env.dev` (already present, tracked) — the script copies it to `.env` automatically unless `.env` already contains
`NODE_ENV=development`.

```bash
pnpm install
pnpm dev          # wipes dev DB, starts mongo container, starts next dev on :3000
```

MongoDB is wiped on every `pnpm dev` start (volumes removed) so the seed always runs fresh. Stop Docker when done:

```bash
docker compose -f docker-compose.dev.yml down
```

**Key env vars for dev** (`.env.dev`):

| Variable                                  | Purpose                               |
| ----------------------------------------- | ------------------------------------- |
| `STORYTUNE__MONGODB_URI`                  | `mongodb://localhost:27017`           |
| `STORYTUNE__UPLOADED_CARDS_PATH`          | local path for card dist files        |
| `STORYTUNE__INSPIRATION_CARDS_PATH`       | local path for inspiration dist files |
| `STORYTUNE__JWT_SECRET`                   | any string ≥ 32 chars                 |
| `STORYTUNE__ADMIN_USERNAME` / `_PASSWORD` | seeded on first startup               |

---

## Local Docker stack

Runs the full containerised stack (app + mongo + nginx) without TLS, using `docker-compose.local.yml`:

```bash
cp .env.local.example .env.local   # first time; fill in any overrides
pnpm local                         # build image + start stack, nginx on :80, app on :3000
pnpm local:down                    # tear down
```

nginx uses `nginx/conf.d/storytune.local.conf` (HTTP only, port 80, proxy → app:3000).

---

## Production deployment

Use `pnpm pack` to build a fully interactive, self-contained deployment archive:

```bash
pnpm pack
```

The interactive CLI will:

1. Check Docker is running and SSL certificates exist under `nginx/ssl/`
2. Prompt for all secrets (MongoDB password, JWT secret, Resend API key, admin credentials)
3. Write/update `.env.prod`
4. Build the Docker image (`no-cache`)
5. Bundle everything into `storytune-deploy-<timestamp>.tar.gz`

Transfer to the server and deploy in one step:

```bash
scp storytune-deploy-*.tar.gz user@server:/opt/storytune/
ssh user@server "cd /opt/storytune && tar -xzf storytune-deploy-*.tar.gz --one-top-level=deploy && bash deploy/deploy.sh"
```

`deploy.sh` automatically detects whether the stack is already running, brings it down, loads the new image, and starts all services.

---

## Scripts reference

| Command              | Description                                                      |
| -------------------- | ---------------------------------------------------------------- |
| `pnpm dev`           | Start dev server (MongoDB in Docker + `next dev`)                |
| `pnpm build`         | Build Docker image via `docker compose build`                    |
| `pnpm local`         | Start full local stack (app + mongo + nginx, HTTP)               |
| `pnpm local:down`    | Tear down local stack                                            |
| `pnpm lint`          | Run ESLint (flat config, typescript-eslint, simple-import-sort)  |
| `pnpm format`        | Run Prettier on all source files (write mode)                    |
| `pnpm format:check`  | Run Prettier in check mode (no writes, CI-friendly)              |
| `pnpm test`          | Run Vitest unit tests (Testcontainers spins real MongoDB)        |
| `pnpm test:watch`    | Vitest in watch mode                                             |
| `pnpm test:coverage` | Vitest coverage via v8                                           |
| `pnpm pack`          | Interactive deployment packager → `storytune-deploy-*.tar.gz`    |
| `pnpm release`       | Interactive version bump → VERSION + package.json + git tag/push |
| `pnpm clean`         | Remove `.next` build cache                                       |
| `pnpm clean:dev`     | Tear down dev Docker stack and volumes                           |
| `pnpm clean:local`   | Tear down local Docker stack, remove images and volumes          |
| `pnpm clean:images`  | Remove all `storytune-app*` Docker images                        |
| `pnpm clean:all`     | Run all of the above clean targets                               |

---

## Environment variables

All variables are prefixed `STORYTUNE__`. See `.env.example` for the full list. Variables that must change from
defaults:

| Variable                            | Notes                                             |
| ----------------------------------- | ------------------------------------------------- |
| `STORYTUNE__JWT_SECRET`             | ≥ 32 random chars                                 |
| `STORYTUNE__ADMIN_PASSWORD`         | initial admin password, seeded once               |
| `STORYTUNE__RESEND_API_KEY`         | from resend.com                                   |
| `STORYTUNE__RESEND_FROM_EMAIL`      | verified sender domain                            |
| `STORYTUNE__UPLOADED_CARDS_PATH`    | writable host path for card ZIPs                  |
| `STORYTUNE__INSPIRATION_CARDS_PATH` | writable host path for inspiration ZIPs           |
| `MONGO_PASSWORD`                    | Compose-level secret, injected into `MONGODB_URI` |

Config is centralised in `lib/config.ts` — never access `process.env` elsewhere.

---

## Storage layout

Card and inspiration content is stored **outside the repo** at configurable paths (Docker volumes in production):

```
{UPLOADED_CARDS_PATH}/
  {slug}/
    index.html
    assets/…

{INSPIRATION_CARDS_PATH}/
  {slug}/
    index.html
    assets/
      cover.{png,jpg,webp,gif}   # or path specified at upload time
```

Files are served by Next.js Route Handlers (`/card/[slug]/[[...path]]`, `/inspiration/[slug]/[[...path]]`) with MongoDB
status check before serving. Cards are **soft-deleted only** — no documents or files are removed.

---

## Project structure

```
app/
  page.tsx                              # landing page
  inspiration/page.tsx                  # inspiration gallery
  inspiration/[slug]/[[...path]]/       # serves inspiration dist
  card/[slug]/[[...path]]/              # serves card dist
  admin/                                # admin UI (JWT-gated)
  api/admin/                            # admin API routes
  api/rsvps/route.ts                    # public RSVP endpoint

components/
  home/                                 # landing page sections
  inspiration/                          # gallery components
  admin/                                # admin UI components
  layout/                               # navbar, footer

lib/
  config.ts                             # centralised env config
  db/client.ts                          # MongoDB connection pool
  repositories/                         # data access (cards, inspirations, admins)
  services/                             # business logic
  infra/                                # zip extraction, storage helpers
  validators/                           # Zod schemas

emails/templates/                       # Handlebars HTML email templates
nginx/conf.d/
  local/storytune.conf                  # HTTP-only, port 80 (docker-compose.local.yml)
  prod/storytune.conf                   # HTTPS, TLS 1.2/1.3, HSTS (docker-compose.prod.yml)
nginx/ssl/                              # certs (gitignored; .gitkeep tracks dir)
scripts/
  dev.js                                # pnpm dev launcher
  pack.mjs                              # interactive deployment packager
  release.mjs                           # interactive version release helper
```

---

## API overview

All responses: `{ success: true, data: … }` or `{ success: false, error: "…", details?: … }`.

| Method           | Path                             | Description                            |
| ---------------- | -------------------------------- | -------------------------------------- |
| POST             | `/api/admin/auth/login`          | Login, sets JWT cookie                 |
| GET              | `/api/admin/auth/me`             | Verify session                         |
| GET              | `/api/admin/cards`               | List cards                             |
| POST             | `/api/admin/cards/upload`        | Upload card ZIP                        |
| GET/PATCH/DELETE | `/api/admin/cards/[slug]`        | Get / update / soft-delete card        |
| GET              | `/api/admin/inspirations`        | List inspirations                      |
| POST             | `/api/admin/inspirations/upload` | Upload inspiration ZIP                 |
| GET/PATCH/DELETE | `/api/admin/inspirations/[slug]` | Get / update / soft-delete inspiration |
| POST             | `/api/rsvps`                     | Public RSVP submission                 |

---

## Commit conventions

This project follows **Conventional Commits** (`type(scope): description`).

### Types

| Type       | When to use                                                              |
| ---------- | ------------------------------------------------------------------------ |
| `feat`     | A new user-facing feature                                                |
| `fix`      | A bug fix                                                                |
| `docs`     | Documentation only (README, comments, GUIDE.md, etc.)                    |
| `style`    | Formatting, whitespace — no logic change                                 |
| `refactor` | Code restructuring that neither adds a feature nor fixes a bug           |
| `perf`     | A change that improves performance                                       |
| `test`     | Adding or updating tests                                                 |
| `chore`    | Build process, dependency updates, tooling, scripts (no production code) |
| `ci`       | CI/CD workflow changes                                                   |
| `revert`   | Reverts a previous commit                                                |

### Scopes (optional but recommended)

Use the area of the codebase: `admin`, `api`, `auth`, `cards`, `inspirations`, `rsvp`, `gallery`, `landing`,
`email`, `db`, `config`, `scripts`, `examples`, `docker`, `nginx`.

### Examples

```
feat(cards): add soft-delete with status=deleted
fix(auth): refresh JWT cookie expiry on activity
docs: update deployment instructions in README
chore(deps): bump next to 16.2.3
refactor(db): extract repository layer from route handlers
test(rsvp): add integration test for duplicate submission
perf(gallery): compress inspiration images to WebP
chore(release): bump version to 1.1.0
style: run prettier on all source files
```

### Breaking changes

Append `!` after the type/scope and add a `BREAKING CHANGE:` footer:

```
feat(api)!: change RSVP response body shape

BREAKING CHANGE: `data.id` renamed to `data.rsvpId` in POST /api/rsvps response.
```

### Co-authored-by trailer

Always include the Copilot trailer on AI-assisted commits:

```
Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
```

---

## Code quality

```bash
pnpm lint          # ESLint (flat config, typescript-eslint, simple-import-sort)
pnpm format        # Prettier (write)
pnpm test          # Vitest unit tests (Testcontainers spins real MongoDB)
pnpm test:coverage # coverage via v8
```

Pre-commit hooks (husky + lint-staged): ESLint `--fix` on JS/TS, Prettier on CSS/SCSS/JSON/YAML/MD.

Rules enforced: no `any`, no `console.log`, imports sorted, Prettier formatting (single quotes, 4-space indent, 120-char
line width).
