# StoryTune

AI-powered digital invitation delivery platform. Admins upload self-contained HTML/CSS/JS invitation packages (ZIP); the platform stores, serves, and tracks them. Three public surfaces: marketing landing page, inspiration gallery, per-card delivery URL.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript strict |
| Styling | SCSS (`sass`), Tailwind CSS 4, shadcn/ui, Radix UI |
| Database | MongoDB 7 via `mongodb` driver (no ODM) |
| Auth | JWT in HTTP-only cookies (`jsonwebtoken`, `bcryptjs`) |
| Email | Resend + Handlebars HTML templates |
| Validation | Zod 4 |
| Logging | Pino + pino-pretty |
| Testing | Vitest + Testcontainers (MongoDB) |
| Package manager | pnpm |
| Runtime | Node.js 22 (Alpine, Docker standalone output) |
| Reverse proxy | nginx (Alpine) |

---

## Prerequisites

- Node.js ≥ 22, pnpm ≥ 9
- Docker + Docker Compose v2 (for any non-`next dev` workflow)

---

## Development

`pnpm dev` spins up MongoDB in Docker and starts `next dev` against your local filesystem. On first run, copy `.env.dev` (already present, tracked) — the script copies it to `.env` automatically unless `.env` already contains `NODE_ENV=development`.

```bash
pnpm install
pnpm dev          # wipes dev DB, starts mongo container, starts next dev on :3000
```

MongoDB is wiped on every `pnpm dev` start (volumes removed) so the seed always runs fresh. Stop Docker when done:

```bash
docker compose -f docker-compose.dev.yml down
```

**Key env vars for dev** (`.env.dev`):

| Variable | Purpose |
|---|---|
| `STORYTUNE__MONGODB_URI` | `mongodb://localhost:27017` |
| `STORYTUNE__UPLOADED_CARDS_PATH` | local path for card dist files |
| `STORYTUNE__INSPIRATION_CARDS_PATH` | local path for inspiration dist files |
| `STORYTUNE__JWT_SECRET` | any string ≥ 32 chars |
| `STORYTUNE__ADMIN_USERNAME` / `_PASSWORD` | seeded on first startup |

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

Use `scripts/pack.js` to build a self-contained deployment archive:

```bash
pnpm pack
```

This builds the Docker image, saves it as a `.tar`, and bundles all deployment files into `storytune-deploy-<timestamp>.tar.gz`. Transfer to the server:

```bash
scp storytune-deploy-*.tar.gz user@server:/opt/storytune/
```

On the server:

```bash
tar -xzf storytune-deploy-*.tar.gz
cd storytune-deploy/

docker load -i images/storytune-app.tar

# Fill in secrets (MONGO_PASSWORD, JWT_SECRET, RESEND_API_KEY, …)
nano .env

# Place SSL certificates
cp /path/to/fullchain.pem nginx/ssl/story-tune.com.pem
cp /path/to/privkey.pem   nginx/ssl/story-tune.com.key

docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

To update without downtime:

```bash
docker load -i images/storytune-app.tar
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --no-deps app
```

nginx config: `nginx/conf.d/storytune.conf` — HTTP→HTTPS redirect, www→apex, TLS 1.2/1.3, HSTS, gzip, `/_next/static/` immutable cache, proxy → app:3000.

---

## Environment variables

All variables are prefixed `STORYTUNE__`. See `.env.example` for the full list. Variables that must change from defaults:

| Variable | Notes |
|---|---|
| `STORYTUNE__JWT_SECRET` | ≥ 32 random chars |
| `STORYTUNE__ADMIN_PASSWORD` | initial admin password, seeded once |
| `STORYTUNE__RESEND_API_KEY` | from resend.com |
| `STORYTUNE__RESEND_FROM_EMAIL` | verified sender domain |
| `STORYTUNE__UPLOADED_CARDS_PATH` | writable host path for card ZIPs |
| `STORYTUNE__INSPIRATION_CARDS_PATH` | writable host path for inspiration ZIPs |
| `MONGO_PASSWORD` | Compose-level secret, injected into `MONGODB_URI` |

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

Files are served by Next.js Route Handlers (`/card/[slug]/[[...path]]`, `/inspiration/[slug]/[[...path]]`) with MongoDB status check before serving. Cards are **soft-deleted only** — no documents or files are removed.

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
nginx/conf.d/                           # storytune.conf (prod), storytune.local.conf (local)
nginx/ssl/                              # certs (gitignored; .gitkeep tracks dir)
scripts/
  dev.js                                # pnpm dev launcher
  pack.js                               # deployment packager
```

---

## API overview

All responses: `{ success: true, data: … }` or `{ success: false, error: "…", details?: … }`.

| Method | Path | Description |
|---|---|---|
| POST | `/api/admin/auth/login` | Login, sets JWT cookie |
| GET | `/api/admin/auth/me` | Verify session |
| GET | `/api/admin/cards` | List cards |
| POST | `/api/admin/cards/upload` | Upload card ZIP |
| GET/PATCH/DELETE | `/api/admin/cards/[slug]` | Get / update / soft-delete card |
| GET | `/api/admin/inspirations` | List inspirations |
| POST | `/api/admin/inspirations/upload` | Upload inspiration ZIP |
| GET/PATCH/DELETE | `/api/admin/inspirations/[slug]` | Get / update / soft-delete inspiration |
| POST | `/api/rsvps` | Public RSVP submission |

---

## Code quality

```bash
pnpm lint          # ESLint (flat config, typescript-eslint, simple-import-sort)
pnpm test          # Vitest unit tests (Testcontainers spins real MongoDB)
pnpm test:coverage # coverage via v8
```

Pre-commit hooks (husky + lint-staged): ESLint `--fix` on JS/TS, Prettier on CSS/SCSS/JSON/YAML/MD.

Rules enforced: no `any`, no `console.log`, imports sorted, Prettier formatting (single quotes, 4-space indent, 120-char line width).
