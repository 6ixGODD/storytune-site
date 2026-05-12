# Copilot Instructions

## Project Overview

StoryTune is an AI-powered digital invitation delivery platform. It has three surfaces:

1. **Public landing page** — marketing one-pager
2. **Inspiration gallery** — browseable showcase of invitation templates
3. **Admin card management** — upload, manage, and track customer invitation cards

Invitation cards are **independent frontend dist packages** (uploaded as ZIPs). The platform serves them as static files; it does NOT render invitation content via React components.

Full product specification is in `REQUIREMENTS.md`.

## Commands

```bash
pnpm dev           # start development server
pnpm build         # production build
pnpm lint          # run ESLint (flat config)
pnpm preview:build # build + serve static output locally
```

There is no test suite yet. Pre-commit hooks run lint-staged automatically (ESLint --fix + Prettier on staged files).

## Tech Stack

- **Next.js 16** App Router, **TypeScript** strict mode
- **SCSS** via `sass` package — no Tailwind, no CSS Modules yet
- **Bootstrap 5**, AOS, Swiper, GLightbox, isotope-layout, react-countup (UI/animation libs)
- **MongoDB** for persistence, **JWT** in HTTP-only cookies for admin auth
- **Resend** for transactional email (HTML templates only)
- **Zod** for all API input validation
- **pnpm** as package manager

## Architecture

### Directory Layout

```text
app/
  page.tsx                          # public landing page
  layout.tsx
  inspiration/page.tsx              # inspiration gallery
  inspiration/[slug]/route.ts       # serves inspiration dist files
  card/[slug]/[[...path]]/route.ts  # serves uploaded customer dist files
  admin/                            # admin UI pages (JWT-protected)
  api/admin/auth/login/route.ts
  api/admin/auth/me/route.ts
  api/admin/cards/route.ts
  api/admin/cards/upload/route.ts
  api/admin/cards/[slug]/route.ts
  api/rsvps/route.ts                # public RSVP endpoint

lib/
  config.ts       # centralized env/config — always import from here
  auth.ts         # JWT helpers
  mongodb.ts      # MongoDB connection
  card-storage.ts # filesystem helpers for card dist files
  zip.ts          # ZIP extraction
  mail.ts         # Resend email sending
  validators/     # Zod schemas (auth.ts, cards.ts, rsvp.ts)

emails/
  rsvp-notification.tsx  # React Email template

.codepen/          # standalone vanilla HTML/CSS/JS experiments (UI inspiration only, not part of Next.js build)
```

### Config System

All env-sensitive values are accessed through `lib/config.ts` — never access `process.env` directly elsewhere:

```ts
// lib/config.ts
export const config = {
  storage: {
    uploadedCardsPath: process.env.UPLOADED_CARDS_PATH,
    inspirationCardsPath: process.env.INSPIRATION_CARDS_PATH,
  },
  jwt: { secret: process.env.JWT_SECRET },
  mongo: { uri: process.env.MONGODB_URI },
  resend: {
    apiKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.RESEND_FROM_EMAIL,
  },
  app: { baseUrl: process.env.NEXT_PUBLIC_SITE_URL },
};
```

Card dist files are stored outside the repo at configurable paths (e.g. `/opt/cards/`). The filesystem structure:

```text
{UPLOADED_CARDS_PATH}/{slug}/index.html
{UPLOADED_CARDS_PATH}/{slug}/assets/...

{INSPIRATION_CARDS_PATH}/{slug}/index.html
{INSPIRATION_CARDS_PATH}/{slug}/assets/cover.{png,jpg,webp,gif}
```

### API Response Format

All API routes return consistent structured JSON:

```ts
// success
{ success: true, data: ... }

// error
{ success: false, error: "Validation failed", details: { field: ["message"] } }
```

### Card Serving Routes

`/card/[slug]/[[...path]]` and `/inspiration/[slug]/[[...path]]` are Next.js **Route Handlers** that read files from the configured filesystem paths and stream them with the correct MIME type. They are not static file serving — they validate card status from MongoDB before serving.

## Key Conventions

### Zod Validation

Every API route handler validates its input with Zod before any business logic. Infer TypeScript types from schemas:

```ts
const LoginSchema = z.object({ username: z.string().min(1), password: z.string().min(1) });
type LoginInput = z.infer<typeof LoginSchema>;
```

### Path Alias

`@/*` maps to the repo root. Use it for all cross-directory imports:

```ts
import { config } from '@/lib/config';
```

### Import Order

Imports must be sorted — enforced by `simple-import-sort` ESLint plugin. Groups: external → internal (`@/...`) → relative. The linter auto-fixes on commit.

### TypeScript

- Strict mode is on; no `any` (ESLint warns)
- Unused vars prefixed with `_` are exempt from the `no-unused-vars` rule
- `console.log` is forbidden — use `console.warn` / `console.error`

### Formatting

Prettier config (`.prettierrc`): single quotes, JSX single quotes, 4-space indent, 120-char line width, trailing commas. JSON/YAML/Markdown use 2-space indent.

### Card Deletion

Cards are **soft-deleted only**: set `status: "deleted"` and `deletedAt`. Never remove MongoDB documents or dist files for deleted cards.

### Static Export vs. Server

`next.config.ts` currently has `output: 'export'`. This must be **removed** before implementing any Route Handlers, MongoDB access, or JWT cookies — the full platform requires a Node.js server runtime.

## MongoDB Schema

```ts
// admins collection
type Admin = { _id: ObjectId; username: string; passwordHash: string; createdAt: Date; updatedAt: Date };

// cards collection
type Card = {
  _id: ObjectId;
  slug: string; // unique
  clientName: string;
  clientEmail: string;
  title?: string;
  eventType?: string;
  notes?: string;
  cardUrl: string; // always "/card/{slug}"
  inviteeCount: number;
  invitees: { name?: string; email: string }[];
  status: 'active' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
};
```

## Out of Scope (MVP)

Do not build: online editor, drag-and-drop builder, payment system, RSVP dashboard/analytics, multi-admin roles, customer login, file manager.
