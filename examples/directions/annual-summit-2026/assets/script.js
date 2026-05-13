// ── Slug ──────────────────────────────────────────────────
const slug = (() => {
    const parts = location.pathname.replace(/\/$/, '').split('/');
    const i = parts.indexOf('card');
    return i !== -1 ? parts[i + 1] : 'business-01';
})();

// ── Dynamic Event Date ─────────────────────────────────────
// Generate a future date 45-150 days from today at 7 PM.
// Refreshing always produces a new date that is always in the future.
const MONTHS_UPPER = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE',
    'JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
const MONTHS_TITLE = ['January','February','March','April','May','June',
    'July','August','September','October','November','December'];

const eventDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 45 + Math.floor(Math.random() * 105));
    d.setHours(19, 0, 0, 0);
    return d;
})();

const evDay   = eventDate.getDate();
const evMonth = eventDate.getMonth();
const evYear  = eventDate.getFullYear();
// "15 JUNE" style for canvas
const evCanvasStr  = `${evDay} ${MONTHS_UPPER[evMonth]}`;
// "June 15, 2026" style for details
const evDateLong   = `${MONTHS_TITLE[evMonth]} ${evDay}, ${evYear}`;
// Deadline = 2 weeks before event
const evDeadline = (() => {
    const d = new Date(eventDate);
    d.setDate(d.getDate() - 14);
    return `${MONTHS_TITLE[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
})();

// Patch DOM with dynamic date before any painting
const dateStrEl = document.querySelector('.date-str');
if (dateStrEl) dateStrEl.textContent = evCanvasStr;

const dateYearEl = document.querySelector('.date-year');
if (dateYearEl) dateYearEl.textContent = String(evYear);

document.querySelectorAll('.detail').forEach((detail) => {
    const label = detail.querySelector('.label');
    if (label?.textContent.trim() === 'WHEN') {
        const strong = detail.querySelector('strong');
        if (strong) strong.textContent = evDateLong;
    }
});

const rsvpDeadlineEl = document.querySelector('.rsvp-note strong');
if (rsvpDeadlineEl) rsvpDeadlineEl.textContent = `${evDeadline}.`;

// ── Cooking Letters (Splitting.js) ────────────────────────
// Run Splitting immediately so the DOM is restructured before
// initCanvas() reads getBoundingClientRect().
const splittingReady = import('./vendor/splitting.js')
    .then((mod) => { mod.default({ target: '[data-splitting]', by: 'chars' }); })
    .catch(() => { /* cooking animation unavailable — rest of page unaffected */ });

// ── Canvas Concentric Circles (colorful) ──────────────────
const initCanvas = () => {
    const wrap = document.querySelector('.text-block');
    if (!wrap) return;

    const canvas = wrap.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const textCanvas = document.createElement('canvas');
    const tCtx = textCanvas.getContext('2d');
    const ringCanvas = document.createElement('canvas');
    const rCtx = ringCanvas.getContext('2d');

    // Ring animation state (persists across resizes)
    let rings = null;

    const stampTextMask = (cW, cH) => {
        // Stamp text onto tCtx and then onto ctx (resets ctx state after resize)
        const fontSize = (cH / dpr) * 0.92 * dpr;
        tCtx.clearRect(0, 0, cW, cH);
        tCtx.fillStyle = 'white';
        tCtx.textAlign = 'center';
        tCtx.textBaseline = 'middle';
        tCtx.font = `120 ${fontSize}px 'Geist Sans', sans-serif`;
        if ('letterSpacing' in tCtx) tCtx.letterSpacing = `${(fontSize * 0.04).toFixed(1)}px`;
        const str = wrap.querySelector('.date-str')?.textContent ?? evCanvasStr;
        tCtx.fillText(str, cW / 2, cH / 2);

        // Resize() already reset ctx state to source-over — stamp text normally
        ctx.drawImage(textCanvas, 0, 0);
        ctx.globalCompositeOperation = 'source-in';
    };

    const resize = () => {
        const rect = wrap.getBoundingClientRect();
        const W = rect.width, H = rect.height;
        canvas.width = textCanvas.width = ringCanvas.width = W * dpr;
        canvas.height = textCanvas.height = ringCanvas.height = H * dpr;
        // Setting canvas.width resets all canvas state (composite mode → source-over)
        return { cW: W * dpr, cH: H * dpr };
    };

    const buildRings = (cW, cH) => {
        const maxR = Math.hypot(cW / 2, cH / 2);
        const baseR = maxR * 0.04;
        return Array.from({ length: 48 }, (_, i) => ({
            id: i,
            r: baseR + i * ((maxR - baseR) / 47),
            arc: Math.random() * Math.PI * 2,
            speed: 0.003 + i * 0.00015,
            dir: i % 2 === 0 ? 1 : -1,
        }));
    };

    const { cW, cH } = resize();
    stampTextMask(cW, cH);
    rings = buildRings(cW, cH);

    let animating = true;
    const draw = () => {
        if (!animating) return;
        rCtx.clearRect(0, 0, canvas.width, canvas.height);
        rCtx.fillStyle = '#0d0d0d';
        rCtx.fillRect(0, 0, canvas.width, canvas.height);

        const cx = canvas.width / 2, cy = canvas.height / 2;
        rings.forEach((ring) => {
            ring.arc += ring.speed * ring.dir;
            const hue = (ring.id * 2.4 + ring.arc * 30) % 360;
            rCtx.beginPath();
            rCtx.arc(cx, cy, ring.r, ring.arc, ring.arc + Math.PI * 1.85);
            rCtx.strokeStyle = `hsl(${hue}, 50%, 58%)`;
            rCtx.lineWidth = 1.6 * dpr;
            rCtx.stroke();
        });

        ctx.drawImage(ringCanvas, 0, 0);
        requestAnimationFrame(draw);
    };

    requestAnimationFrame(draw);

    window.addEventListener('resize', () => {
        const { cW: nW, cH: nH } = resize();
        // resize() reset ctx — re-stamp text and rebuild rings for new size
        stampTextMask(nW, nH);
        rings = buildRings(nW, nH);
    });
};

// Wait for both font AND Splitting DOM restructure to settle before
// sizing the canvas — prevents off-center text caused by timing races.
Promise.all([document.fonts.ready, splittingReady]).then(() => {
    requestAnimationFrame(() => initCanvas());
});

// ── Glow Section — IntersectionObserver ───────────────────
const glowSection = document.querySelector('.s-glow');
if (glowSection) {
    const obs = new IntersectionObserver(
        ([entry]) => {
            if (entry.isIntersecting) {
                glowSection.classList.add('in-view');
                obs.disconnect();
            }
        },
        { threshold: 0.45 },
    );
    obs.observe(glowSection);
}

// ── RSVP Form ─────────────────────────────────────────────
const form = document.querySelector('.rsvp-form');
const btnOk = document.querySelector('#btn-accept');
const btnNo = document.querySelector('#btn-decline');
const noteEl = document.querySelector('.form-note');

const showNote = (msg, ok = false) => {
    if (!noteEl) return;
    noteEl.textContent = msg;
    noteEl.style.color = ok ? 'rgba(100,255,150,0.7)' : 'rgba(255,100,100,0.7)';
};

const disableForm = () => {
    if (form) form.classList.add('submitted');
    if (btnOk) btnOk.setAttribute('disabled', '');
    if (btnNo) btnNo.setAttribute('disabled', '');
};

// Accept
btnOk?.addEventListener('click', async () => {
    if (btnOk.getAttribute('data-adding') === 'true') return;

    const name = document.querySelector('#rsvp-name')?.value.trim() ?? '';
    const email = document.querySelector('#rsvp-email')?.value.trim() ?? '';

    if (!name) return showNote('Please enter your name.');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showNote('Please enter a valid email address.');

    btnOk.setAttribute('data-adding', 'true');

    // Demo: simulate success after short delay
    await new Promise((r) => setTimeout(r, 800));
    btnOk.removeAttribute('data-adding');
    btnOk.setAttribute('data-complete', 'true');
    showNote(`You're confirmed! See you on ${evDateLong} ✦`, true);
    disableForm();
});

// Decline
btnNo?.addEventListener('click', async () => {
    if (btnNo.getAttribute('disabled')) return;

    // Demo: simulate success after short delay
    await new Promise((r) => setTimeout(r, 500));
    showNote("We'll miss you. Thank you for letting us know.", true);
    disableForm();
});

