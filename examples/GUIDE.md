# StoryTune — Card & Direction Development Guide

This guide documents the standards for building **Cards** and **Directions** distributed through StoryTune.

---

## What are Cards and Directions?

| Type          | Purpose                                                                                                            | Distribution  |
| ------------- | ------------------------------------------------------------------------------------------------------------------ | ------------- |
| **Direction** | Design template / showcase — no live backend required. Submitted in `/examples/directions/`.                       | ZIP or folder |
| **Card**      | Personalised invitation for a specific event — calls the live RSVP API. Stored at `{UPLOADED_CARDS_PATH}/{slug}/`. | ZIP only      |

Cards are served by the platform's route handler at `/card/{slug}/` (and sub-paths for assets). Directions live under `/inspiration/{slug}/`.

---

## File Structure

Every card or direction is a **self-contained static package**:

```text
{slug}/
  index.html          ← entry point (must be exactly this name)
  assets/
    style.css
    script.js
    fonts.css         ← (optional) @font-face declarations pointing to local files
    vendor/           ← ALL third-party JS bundled locally (no CDN imports)
    *.webp / *.png    ← media at quality 85 WebP whenever possible
```

### Rules

1. **No external network requests for assets.** No CDN links in `<script src>`, `<link href>`, or CSS `url()`. Bundle or download all dependencies into `assets/vendor/`.
2. **Fonts must be self-hosted.** Use `@font-face` with relative paths inside `assets/fonts.css`. Google Fonts CDN is forbidden.
3. **Images must be WebP** at quality ≤ 85 wherever possible. PNG is acceptable only when the source has transparency that cannot survive WebP conversion with acceptable visual quality.
4. `index.html` must load without a build step — plain HTML + vanilla JS (`type="module"` ES modules are fine).
5. Keep the total unzipped size under **10 MB**. Aim for ≤ 5 MB.
6. The card **must work offline** (after the initial load) — no fetch calls for content, fonts, or scripts at runtime.

---

## Event Dates

**Never hardcode event dates.** All dates are dynamically generated on each page load so that the invitation is always set in the future.

### Pattern

```js
// Generate a date N–M days from today
const eventDate = (() => {
  const d = new Date();
  d.setDate(d.getDate() + MIN_DAYS + Math.floor(Math.random() * (MAX_DAYS - MIN_DAYS)));
  d.setHours(HOUR, MINUTE, 0, 0);
  return d;
})();
```

### Recommended offsets by card type

| Type             | Min days | Max days | Notes                    |
| ---------------- | -------- | -------- | ------------------------ |
| Wedding / formal | 60       | 180      | Advance to next Saturday |
| Business summit  | 45       | 150      | Any weekday              |
| Party / casual   | 30       | 120      | Any day                  |

Generate the date **before** any DOM manipulation or animation initialization so that text patches reach the DOM before animations read `textContent`.

---

## RSVP Form

### Endpoint

```
POST /api/rsvps
Content-Type: application/json
```

For direction previews (no backend), simulate a successful response with `setTimeout`.

### Request body

```json
{
  "slug": "string", // card slug (from URL: /card/{slug}/...)
  "name": "string", // guest's full name
  "email": "string", // guest's email address
  "attending": "yes|no", // acceptance or decline
  "guests": 1, // integer ≥ 1 (for 'yes') or 0 (for 'no')
  "message": "string" // optional note, may be empty string
}
```

### Response

```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": "Validation failed", "details": { "field": ["message"] } }
```

### Slug derivation

Always derive the slug from the current URL so the same HTML works when the platform serves it at `/card/{slug}/`:

```js
const parts = window.location.pathname.split('/').filter(Boolean);
const slug = parts[0] === 'card' && parts[1] ? parts[1] : 'fallback-slug';
```

### Validation (client-side minimum)

- `name`: non-empty
- `email`: must pass basic regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- `attending`: `'yes'` or `'no'`
- `guests`: integer, 1–10 for `'yes'`, 0 for `'no'`

---

## Mobile & Cross-Browser Compatibility

Target: **iOS Safari 16+**, Chrome Android, desktop Chrome/Firefox/Safari.

### CSS

- Avoid `transform-style: preserve-3d` on global `*` rules — it breaks flex layout and canvas positioning on iOS Safari.
- Wrap hover-triggered CSS animations in `@media (hover: hover) and (pointer: fine)` to prevent flash-then-snap on iOS tap events.
- Use `font-size: clamp(...)` on numeric counters that can display large values (e.g. seconds-to-event).
- Prefer `@supports` guards for CSS scroll-driven animations (`animation-timeline: view()`) — they are not yet universally supported. Provide a GSAP or IntersectionObserver fallback.

### JavaScript

- Eagerly load all images (`loading="eager" fetchpriority="high"`) when the scroll animation depends on all images being in memory simultaneously.
- When using Splitting.js (or other libs that restructure the DOM), wait for both `document.fonts.ready` **and** the Splitting promise before sizing canvases:

  ```js
  const splittingReady = import('./vendor/splitting.js').then((mod) =>
    mod.default({ target: '[data-splitting]', by: 'chars' }),
  );

  Promise.all([document.fonts.ready, splittingReady]).then(() => {
    requestAnimationFrame(() => initCanvas());
  });
  ```

- Setting `canvas.width` resets **all** canvas state (including `globalCompositeOperation`). Do not rely on composite mode surviving a resize.

---

## Packaging as ZIP

When submitting a Card to the platform, package the entire `{slug}/` folder:

```bash
# macOS / Linux
zip -r slug-name.zip slug-name/

# Windows (PowerShell)
Compress-Archive -Path .\slug-name -DestinationPath .\slug-name.zip
```

The platform extracts the ZIP and expects `index.html` at the root of the extracted folder (i.e. `{slug}/index.html`).

---

## Checklist Before Submission

- [ ] `index.html` present at root
- [ ] All assets self-hosted (no CDN links)
- [ ] Fonts self-hosted via `assets/fonts.css`
- [ ] Images converted to WebP (≤ quality 85)
- [ ] Total unzipped size ≤ 10 MB
- [ ] Event date is dynamically generated (no hardcoded past or future date)
- [ ] RSVP form points to `/api/rsvps` with correct body shape
- [ ] Slug derived from URL (not hardcoded)
- [ ] Hover animations guarded with `@media (hover: hover) and (pointer: fine)`
- [ ] Tested on iOS Safari and Chrome Android
