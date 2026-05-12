# AI Invitation Studio - MVP Requirements v2

## 1. Project Overview

Build a lightweight AI-powered digital invitation delivery platform.

The platform has three parts:

1. Public landing page
2. Inspiration gallery
3. Admin-managed customer card delivery system

Each invitation card is still an independent frontend dist package.

The platform does not render invitation content with React components. It only hosts uploaded dist projects and provides APIs.

The codebase must prioritize:

* Type safety
* Elegant architecture
* Maintainability
* Clear separation of concerns
* Config-driven filesystem paths
* Strict runtime validation using Zod

---

# 2. Tech Stack

## Frontend

* Next.js App Router
* TypeScript
* TailwindCSS
* SCSS Modules

## Backend

* Next.js Route Handlers
* MongoDB
* JWT authentication
* Node.js filesystem APIs
* Zod for request validation and schema typing

## Email

* Resend API only
* HTML email templates required

## Deployment

* VPS / Docker / PM2 preferred
* Runtime filesystem access required
* Do not use static export

---

# 3. Configuration System

All environment-sensitive values must be configurable.

Do not hardcode filesystem paths.

Use centralized configuration management.

Example:

```ts
config.storage.uploadedCardsPath
config.storage.inspirationCardsPath
config.jwt.secret
config.mongo.uri
config.resend.apiKey
config.resend.fromEmail
config.app.baseUrl
```

The application must support deployment to arbitrary filesystem locations such as:

```text
/opt/ai-invitation-studio/
/data/cards/
/srv/storage/
```

Recommended structure:

```text
lib/
  config.ts
```

Example:

```ts
export const config = {
  storage: {
    uploadedCardsPath: process.env.UPLOADED_CARDS_PATH,
    inspirationCardsPath: process.env.INSPIRATION_CARDS_PATH,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
  },
  mongo: {
    uri: process.env.MONGODB_URI,
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.RESEND_FROM_EMAIL,
  },
};
```

All filesystem access must use config-driven absolute paths.

---

# 4. Directory Structure

```text
app/
  page.tsx
  page.module.scss

  inspiration/
    page.tsx
    page.module.scss

  card/
    [slug]/
      [[...path]]/
        route.ts

  inspiration-card/
    [slug]/
      [[...path]]/
        route.ts

  admin/
    login/
      page.tsx
      page.module.scss

    cards/
      page.tsx
      page.module.scss

    cards/
      upload/
        page.tsx
        page.module.scss

    cards/
      [slug]/
        page.tsx
        page.module.scss

  api/
    auth/
      login/
        route.ts
      me/
        route.ts

    cards/
      route.ts

    cards/
      upload/
        route.ts

    cards/
      [slug]/
        route.ts

    rsvp/
      route.ts

lib/
  auth.ts
  mongodb.ts
  card-storage.ts
  zip.ts
  mail.ts
  config.ts
  validators/
    auth.ts
    cards.ts
    rsvp.ts

emails/
  rsvp-notification.tsx
```

Filesystem storage directories are configurable and should NOT be assumed to exist inside the repository.

Configured runtime directories:

```text
{UPLOADED_CARDS_PATH}/
  {slug}/
    index.html
    assets/

{INSPIRATION_CARDS_PATH}/
  {slug}/
    index.html
    assets/
      cover.png
```

---

# 5. Validation and Type Safety

All API inputs must use Zod validation.

Requirements:

* No untyped request bodies
* No `any`
* Infer TypeScript types directly from Zod schemas
* Validate:

    * request body
    * query params
    * route params
    * multipart form fields
    * environment variables

Example:

```ts
const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

type LoginInput = z.infer<typeof LoginSchema>;
```

Validation failures must return structured JSON errors.

Example:

```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "clientEmail": ["Invalid email"]
  }
}
```

---

# 6. Database Design

Use MongoDB.

## admins Collection

```ts
type Admin = {
  _id: ObjectId;
  username: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};
```

Only one admin account is required for MVP.

Password must be hashed using bcrypt.

---

## cards Collection

```ts
type CardInvitee = {
  name?: string;
  email: string;
};

type Card = {
  _id: ObjectId;

  slug: string;

  clientName: string;
  clientEmail: string;

  title?: string;
  eventType?: string;
  notes?: string;

  cardUrl: string;

  inviteeCount: number;

  invitees: CardInvitee[];

  status: "active" | "deleted";

  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
};
```

Notes:

* `slug` must be unique.
* `cardUrl` should be generated as `/card/{slug}`.
* Deletion should be soft delete only.
* Invitee information must be stored for future system expansion.
* Invitee data should support future RSVP analytics and segmentation.

---

# 7. Authentication

## JWT Required for Admin

Admin pages and admin APIs must require JWT.

No session auth.

No third-party auth.

JWT should be stored in an HTTP-only cookie after login.

## Login Page

Route:

```text
/admin/login
```

Fields:

* username
* password

On success:

* call `/api/auth/login`
* set JWT cookie
* redirect to `/admin/cards`

---

## Auth APIs

### POST /api/auth/login

Request:

```json
{
  "username": "admin",
  "password": "password"
}
```

Behavior:

1. Validate request using Zod
2. Find admin by username
3. Compare password hash
4. Generate JWT
5. Set HTTP-only cookie
6. Return success

---

### GET /api/auth/me

Behavior:

1. Read JWT cookie
2. Verify token
3. Return current admin info

---

# 8. Admin Card Management

## Admin Cards List Page

Route:

```text
/admin/cards
```

Functionality:

* Show paginated card list
* Show slug
* Show client name
* Show client email
* Show invitee count
* Show card URL
* Show status
* Show created time
* Provide links:

    * View card
    * Edit card
    * Upload new card
    * Delete card

Pagination:

* page
* pageSize
* default pageSize: 20

---

## Cards List API

### GET /api/cards

Protected by JWT.

Query params:

```text
page=1
pageSize=20
includeDeleted=false
```

Response:

```json
{
  "items": [
    {
      "slug": "abc123",
      "clientName": "Alice",
      "clientEmail": "alice@example.com",
      "inviteeCount": 120,
      "cardUrl": "/card/abc123",
      "status": "active",
      "createdAt": "..."
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 100
}
```

---

# 9. Upload Card

## Upload Page

Route:

```text
/admin/cards/upload
```

Protected by JWT.

Fields:

* optional slug
* clientName
* clientEmail
* title
* eventType
* notes
* invitees JSON or CSV upload
* ZIP file

Behavior:

* If slug is empty, backend generates a UUID as slug.
* If slug is provided and exists, replace existing dist files.
* If slug is provided and does not exist, create new card with this slug.
* Upload API should return the final slug and card URL.

---

## Upload API

### POST /api/cards/upload

Protected by JWT.

Content-Type:

```text
multipart/form-data
```

Fields:

```text
slug?           optional
clientName      required
clientEmail     required
title?          optional
eventType?      optional
notes?          optional
invitees?       optional
zip             required
```

Behavior:

1. Validate JWT
2. Validate request using Zod
3. If no slug, generate UUID
4. Extract ZIP into temporary directory
5. Validate extracted dist contains `index.html`
6. Replace target directory:

    * `{UPLOADED_CARDS_PATH}/{slug}`
7. Create or update cards collection
8. Store invitee metadata
9. Return card metadata

Response:

```json
{
  "success": true,
  "card": {
    "slug": "generated-or-provided-slug",
    "clientName": "Alice",
    "clientEmail": "alice@example.com",
    "inviteeCount": 120,
    "cardUrl": "/card/generated-or-provided-slug",
    "status": "active"
  }
}
```

Important:

* Replacing an existing slug should overwrite old dist files.
* Metadata should also be updated.
* If extraction or validation fails, do not overwrite existing card files.
* File operations must be atomic whenever possible.

---

# 10. Single Card APIs

## GET /api/cards/[slug]

Protected by JWT.

Returns basic card metadata.

Response:

```json
{
  "slug": "abc123",
  "clientName": "Alice",
  "clientEmail": "alice@example.com",
  "title": "Alice Wedding Invitation",
  "eventType": "Wedding",
  "notes": "",
  "inviteeCount": 120,
  "invitees": [
    {
      "name": "John Doe",
      "email": "john@example.com"
    }
  ],
  "cardUrl": "/card/abc123",
  "status": "active",
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

## PATCH /api/cards/[slug]

Protected by JWT.

Updates metadata only.

Allowed fields:

```
{
  clientName?: string;
  clientEmail?: string;
  title?: string;
  eventType?: string;
  notes?: string;
  invitees?: {
    name?: string;
    email: string;
  }[];
}
```

Should not update dist files.

---

## DELETE /api/cards/[slug]

Protected by JWT.

Soft delete only.

Behavior:

* Set status to `"deleted"`
* Set deletedAt
* Do not remove files from disk for MVP

---

# 11. Public Card Serving

## Route

```text
/card/[slug]/[[...path]]
```

This route serves uploaded customer dist files.

Examples:

```text
/card/abc123
-> {UPLOADED_CARDS_PATH}/abc123/index.html

/card/abc123/style.css
-> {UPLOADED_CARDS_PATH}/abc123/style.css

/card/abc123/assets/bg.png
-> {UPLOADED_CARDS_PATH}/abc123/assets/bg.png
```

Behavior:

1. Check card exists in MongoDB
2. Check card status is active
3. Serve matching file from configured storage path
4. If no path, serve index.html
5. Serve correct MIME type
6. Return 404 if card is missing, deleted, or file does not exist

Important:

* Uploaded dist files should use relative asset paths.
* Example: `./assets/bg.png`, not `/assets/bg.png`

---

# 12. RSVP API

The RSVP UI is provided by the uploaded dist itself.

The platform only provides API.

## POST /api/rsvp

Public endpoint.

Request:

```json
{
  "slug": "abc123",
  "name": "John Doe",
  "email": "john@example.com",
  "attending": "yes",
  "guests": 2,
  "message": "Looking forward to it"
}
```

Behavior:

1. Validate payload using Zod
2. Find card by slug
3. Ensure card status is active
4. Send RSVP notification email to `card.clientEmail`
5. Optionally BCC platform owner
6. Return success JSON

No RSVP database storage required for MVP.

Response:

```json
{
  "success": true
}
```

---

# 13. Email Requirements

Use:

* Resend API only

Requirements:

* HTML email required
* Styled email layout required
* Dynamic rendering required
* Email templates should be reusable and componentized

Recommended:

```text
emails/
  rsvp-notification.tsx
```

Email to card owner should include:

* Client name greeting
* Card title
* RSVP guest name
* Guest email
* Attendance status
* Guest count
* Message
* Card URL

Email should feel polished and ceremonial, not just a plain log dump.

Example content:

```html
<h1>New RSVP Received</h1>
<p>Hello Alice,</p>
<p>You received a new RSVP for your invitation card.</p>
```

---

# 14. Inspiration Gallery

Each inspiration item is also an independent dist project.

Configured directory:

```text
{INSPIRATION_CARDS_PATH}/
  luxury-wedding-01/
    index.html
    assets/
      cover.png

  cyber-party-01/
    index.html
    assets/
      cover.gif
```

## Cover Asset Convention

Each inspiration dist must provide one of:

```text
assets/cover.png
assets/cover.jpg
assets/cover.webp
assets/cover.gif
```

Recommended standard size:

```text
1200 x 800
```

---

## Inspiration Page

Route:

```text
/inspiration
```

Behavior:

1. Scan configured inspiration directory
2. For each subdirectory:

    * Find cover asset
    * Generate preview URL
3. Display as gallery cards

Each card should show:

* Cover image
* Slug/name
* Preview button
* Etsy order CTA

---

## Inspiration Dist Serving

Route:

```text
/inspiration-card/[slug]/[[...path]]
```

Examples:

```text
/inspiration-card/luxury-wedding-01
-> {INSPIRATION_CARDS_PATH}/luxury-wedding-01/index.html

/inspiration-card/luxury-wedding-01/assets/cover.png
-> {INSPIRATION_CARDS_PATH}/luxury-wedding-01/assets/cover.png
```

Behavior:

* Serve static dist files from configured inspiration directory
* No database required for inspiration items
* Directory scan is enough for MVP

---

# 15. Public Landing Page

Route:

```text
/
```

Single-page scrolling landing page.

Sections:

1. Hero
2. What We Create
3. Customization Tiers
4. Inspiration Preview
5. How It Works
6. Revision Policy
7. Etsy CTA

Business model:

1. Inspiration-based customization
2. Partial customization
3. Fully custom invitation

Revision policy:

* Partial customization: includes up to 2 revisions
* Fully custom invitation: includes up to 2 revisions
* Extra revisions may require additional fee

---

# 16. Code Quality Requirements

Requirements:

* Strong TypeScript typing everywhere
* No duplicated business logic
* Reusable utility abstractions
* Clean service-layer architecture
* Elegant filesystem handling
* Proper error boundaries
* Consistent API response format
* SCSS Modules for styling
* Avoid overengineering while maintaining extensibility

Recommended architecture:

```text
services/
repositories/
validators/
lib/
```

---

# 17. Do Not Build in MVP

Do not build:

* Online invitation editor
* Drag-and-drop builder
* Payment system
* Etsy API integration
* RSVP dashboard
* Full RSVP analytics system
* User registration
* Multi-admin role system
* Customer login
* Complex analytics
* File manager
* Visual template editor

---

# 18. Development Priority

Build in this order:

1. Config system
2. MongoDB connection
3. Zod validation layer
4. Admin model and JWT login
5. Card model
6. Card upload API
7. Dynamic card dist serving
8. Admin card list page with pagination
9. Admin card detail/edit/delete
10. RSVP API with Resend HTML email forwarding
11. Inspiration directory scan
12. Inspiration page
13. Inspiration dist serving
14. Landing page

---

# 19. Acceptance Criteria

## Admin

* Admin can log in with username/password
* JWT cookie is set after login
* Protected pages redirect unauthenticated users to login
* Admin can upload ZIP for a new card
* Backend generates slug if not provided
* Admin can replace existing card by providing slug
* Admin can list cards with pagination
* Admin can view card metadata
* Admin can update card metadata
* Admin can soft delete a card
* Admin can manage invitee metadata

## Public Card

* `/card/{slug}` serves uploaded index.html
* `/card/{slug}/assets/...` serves uploaded assets
* Deleted cards return 404
* Missing files return 404

## RSVP

* Uploaded dist can POST to `/api/rsvp`
* RSVP email is forwarded using Resend
* RSVP email is rendered as HTML
* RSVP email includes client name and card title
* API returns success JSON

## Inspiration

* `/inspiration` lists dist folders from configured inspiration directory
* Cover image is loaded from `assets/cover.*`
* Each inspiration item has a preview link
* `/inspiration-card/{slug}` serves the inspiration dist

## Landing Page

* `/` is a polished one-page scroll landing page
* Includes CTA to Etsy and inspiration page
