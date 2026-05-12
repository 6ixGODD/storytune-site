// Resolve card slug from URL: /card/{slug}/... or local fallback
const pathParts = window.location.pathname.split('/').filter(Boolean);
const slug = pathParts[1] || 'wedding-01';

// ── RSVP form ──────────────────────────────────────────────────────────────

const form = /** @type {HTMLFormElement} */ (document.getElementById('rsvp-form'));
const statusEl = document.getElementById('form-status');
const btnDecline = document.getElementById('btn-decline');

/**
 * @param {boolean} attending
 */
async function submitRsvp(attending) {
  const nameVal = /** @type {HTMLInputElement} */ (form.elements.namedItem('name')).value.trim();
  const emailVal = /** @type {HTMLInputElement} */ (form.elements.namedItem('email')).value.trim();

  if (!nameVal || !emailVal) {
    statusEl.textContent = 'Please enter your name and email.';
    statusEl.className = 'form-status error';
    return;
  }

  statusEl.textContent = 'Sending…';
  statusEl.className = 'form-status';

  // Demo: simulate success after short delay
  await new Promise((r) => setTimeout(r, 800));
  statusEl.textContent = attending
    ? 'We look forward to celebrating with you! ♡'
    : 'We are sorry you cannot make it. Thank you for letting us know.';
  statusEl.className = 'form-status success';
  form.reset();
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  submitRsvp(true);
});

btnDecline.addEventListener('click', () => submitRsvp(false));

// ── GSAP fallback for browsers without CSS scroll-driven animations ─────────

if (!CSS.supports('animation-timeline: view()') && window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
  import('./vendor/gsap.js').then(({ default: gsap }) => {
    import('./vendor/gsap.js').then(({ ScrollTrigger }) => {
      gsap.registerPlugin(ScrollTrigger);

      // Blanket structural styles
      gsap.set('.fixed', { position: 'fixed', inset: 0 });
      gsap.set('.static', { position: 'absolute', inset: 0, zIndex: 6 });
      gsap.set('.filler', { display: 'block', position: 'absolute', bottom: '30vh', padding: '1rem 4rem' });

      // ── Hero: scale-and-move + fade out on exit ──
      gsap.set('.s-hero .fixed', { transformOrigin: '50% 0%' });
      gsap.to('.s-hero .fixed', {
        scaleX: 0.35,
        scaleY: 0.5,
        yPercent: -10,
        scrollTrigger: { scrub: 0.5, trigger: '.s-hero', start: 'top top', end: 'bottom 50%' },
      });
      gsap.to('.s-hero .fixed', {
        opacity: 0,
        scrollTrigger: { scrub: 0.5, trigger: '.s-hero', start: 'top top', end: 'bottom 75%' },
      });

      // ── a-story: clip-path reveal + image scale-down + text slide-up ──
      gsap.set('.a-story .fixed', { clipPath: 'ellipse(220% 200% at 50% 300%)', zIndex: 3 });
      gsap.to('.a-story .fixed', {
        clipPath: 'ellipse(220% 200% at 50% 175%)',
        scrollTrigger: { scrub: 0.5, trigger: '.a-story', start: 'top bottom', end: 'top top' },
      });
      gsap.from('.a-story img', {
        scale: 5,
        scrollTrigger: { scrub: 0.5, trigger: '.a-story', start: 'top bottom', end: 'top top' },
      });
      gsap.set('.loud-wrap', {
        clipPath: 'inset(0 0 0 0)',
        mask: 'linear-gradient(white 50%, transparent) 0 100% / 100% 200% no-repeat',
      });
      gsap.set('.text-wrap', { position: 'sticky', bottom: '4rem', transformOrigin: '50% 0' });
      gsap.from('.a-story h2', {
        yPercent: 100,
        scrollTrigger: { scrub: 0.5, trigger: '.a-story', start: 'top 50%', end: 'top 0%' },
      });
      gsap.to('.loud-wrap', {
        maskPosition: '0 0',
        scrollTrigger: { scrub: 0.5, trigger: '.a-story', start: 'top 50%', end: 'top 0%' },
      });
      gsap.to('.text-wrap', {
        filter: 'blur(4rem)',
        opacity: 0,
        scrollTrigger: { scrub: 0.5, trigger: '.a-story', start: 'bottom 60%', end: 'bottom 25%' },
      });

      // ── a-details: fade in + h2 slide+fade ──
      gsap.set('.a-details .fixed', { zIndex: 3 });
      gsap.from('.a-details .fixed', {
        opacity: 0,
        scrollTrigger: { scrub: 0.5, trigger: '.a-details', start: 'top 50%', end: 'top -30%' },
      });
      gsap.from('.a-details h2', {
        yPercent: 100,
        opacity: 0,
        scrollTrigger: { scrub: 0.5, trigger: '.a-details', start: 'top 50%', end: 'top 25%' },
      });
      gsap.to('.a-details h2', {
        filter: 'blur(4rem)',
        color: 'transparent',
        scrollTrigger: { scrub: 0.5, trigger: '.a-details', start: 'bottom bottom', end: 'bottom 50%' },
      });

      // ── a-vows: 400 vh + staggered text blocks ──
      gsap.set('.a-vows', { height: '400vh' });
      gsap.set('.a-vows .fixed', { zIndex: 3 });
      gsap.set('.a-vows h2', { marginTop: '80vh' });
      gsap.from('.a-vows .fixed', {
        opacity: 0,
        scrollTrigger: { trigger: '.a-vows', scrub: 0.5, start: 'top 80%', end: 'top top' },
      });
      gsap.to('.a-vows img', {
        opacity: 0,
        scrollTrigger: { trigger: '.a-vows', scrub: 0.5, start: 'bottom bottom', end: 'bottom 85%' },
      });

      document.querySelectorAll('.text-blocks p').forEach((line, i) => {
        gsap.from(line, {
          yPercent: 100,
          opacity: 0,
          scrollTrigger: {
            trigger: '.a-vows',
            scrub: 0.5,
            start: `top -=${90 + i * 10}%`,
            end: `top -=${100 + i * 10}%`,
          },
        });
      });

      gsap.to('.text-blocks', {
        opacity: 0,
        scrollTrigger: { trigger: '.a-vows', scrub: 0.5, start: 'bottom 130%', end: 'bottom 110%' },
      });
      gsap.to('.filler h2', {
        opacity: 0,
        filter: 'blur(4rem)',
        scrollTrigger: { trigger: '.a-vows', scrub: 0.5, start: 'bottom 55%', end: 'bottom 30%' },
      });

      // ── a-final: clip-path reveal + fade out on exit ──
      gsap.set('.a-final .fixed', { clipPath: 'ellipse(220% 200% at 50% 300%)', zIndex: 5 });
      gsap.to('.a-final .fixed', {
        clipPath: 'ellipse(220% 200% at 50% 175%)',
        scrollTrigger: { trigger: '.a-final', scrub: 0.5, start: 'top 80%', end: 'top 20%' },
      });
      gsap.to('.a-final .fixed', {
        opacity: 0,
        scrollTrigger: { trigger: '.a-final', scrub: 0.5, start: 'bottom bottom', end: 'bottom 40%' },
      });
    });
  });
}
