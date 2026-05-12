// ── Slug ──────────────────────────────────────────────────
// Live copy: replace 'annual-summit-2026' with the real card slug from your DB
const slug = (() => {
    const parts = location.pathname.replace(/\/$/, '').split('/');
    const i = parts.indexOf('card');
    return i !== -1 ? parts[i + 1] : 'annual-summit-2026';
})();

// ── Cooking Letters (Splitting.js) ────────────────────────
// Dynamic import so the canvas still works if the CDN is unavailable.
// Splitting runs immediately (not inside fonts.ready) to prevent a late
// DOM restructure that would cause a layout reflow and make the eyebrow jump.
import('./vendor/splitting.js')
    .then((mod) => {
        mod.default({ target: '[data-splitting]', by: 'chars' });
    })
    .catch(() => {
        /* cooking animation unavailable — rest of page unaffected */
    });

// ── Canvas Concentric Circles (colorful) ──────────────────
// Mirrors the codepen approach: draw rings onto an off-screen ringCanvas,
// fill it with a dark background first so the text area is always fully
// visible, then composite onto the main canvas with source-in (text mask).
const initCanvas = () => {
    const wrap = document.querySelector('.text-block');
    if (!wrap) return;

    const canvas = wrap.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Off-screen canvases (same pattern as codepen)
    const textCanvas = document.createElement('canvas');
    const tCtx = textCanvas.getContext('2d');
    const ringCanvas = document.createElement('canvas');
    const rCtx = ringCanvas.getContext('2d');

    const resize = () => {
        const rect = wrap.getBoundingClientRect();
        const W = rect.width,
            H = rect.height;
        canvas.width = textCanvas.width = ringCanvas.width = W * dpr;
        canvas.height = textCanvas.height = ringCanvas.height = H * dpr;
        return { W, H };
    };

    document.fonts.ready.then(() => {
        const { W, H } = resize();
        const cW = W * dpr,
            cH = H * dpr;
        const cx = cW / 2,
            cy = cH / 2;

        // Draw text mask onto textCanvas once
        const str = wrap.querySelector('.date-str')?.textContent ?? '15 JUNE';
        const fontSize = H * 0.92 * dpr;
        tCtx.fillStyle = 'white';
        tCtx.textAlign = 'center';
        tCtx.textBaseline = 'middle';
        tCtx.font = `120 ${fontSize}px 'Geist Sans', sans-serif`;
        if ('letterSpacing' in tCtx) tCtx.letterSpacing = `${(fontSize * 0.04).toFixed(1)}px`;
        tCtx.fillText(str, cW / 2, cH / 2);

        // Stamp text mask onto main canvas, then lock to source-in composite
        ctx.drawImage(textCanvas, 0, 0);
        ctx.globalCompositeOperation = 'source-in';

        // Rings state — max radius must reach the farthest text corner
        const maxR  = Math.hypot(cW / 2, cH / 2);
        const baseR = maxR * 0.04;
        const rings = Array.from({ length: 48 }, (_, i) => ({
            id: i,
            r: baseR + i * ((maxR - baseR) / 47),
            arc: Math.random() * Math.PI * 2,
            speed: 0.003 + i * 0.00015,
            dir: i % 2 === 0 ? 1 : -1,
        }));

        const draw = () => {
            // Build ring frame on off-screen canvas
            rCtx.clearRect(0, 0, cW, cH);
            // Dark background fill — ensures text area is always visible
            rCtx.fillStyle = '#0d0d0d';
            rCtx.fillRect(0, 0, cW, cH);

            rings.forEach((ring) => {
                ring.arc += ring.speed * ring.dir;
                const hue = (ring.id * 2.4 + ring.arc * 30) % 360;
                rCtx.beginPath();
                rCtx.arc(cx, cy, ring.r, ring.arc, ring.arc + Math.PI * 1.85);
                rCtx.strokeStyle = `hsl(${hue}, 50%, 58%)`;
                rCtx.lineWidth = 1.6 * dpr;
                rCtx.stroke();
            });

            // Composite onto main canvas — source-in clips to text shape
            ctx.drawImage(ringCanvas, 0, 0);
            requestAnimationFrame(draw);
        };

        requestAnimationFrame(draw);
    });

    window.addEventListener('resize', () => {
        resize();
        // Re-stamp text mask on resize
        document.fonts.ready.then(() => {
            const rect = wrap.getBoundingClientRect();
            const cW = rect.width * dpr,
                cH = rect.height * dpr;
            const fontSize = rect.height * 0.92 * dpr;
            tCtx.clearRect(0, 0, cW, cH);
            tCtx.font = `120 ${fontSize}px 'Geist Sans', sans-serif`;
            if ('letterSpacing' in tCtx) tCtx.letterSpacing = `${(fontSize * 0.04).toFixed(1)}px`;
            const str = wrap.querySelector('.date-str')?.textContent ?? '15 JUNE';
            tCtx.fillText(str, cW / 2, cH / 2);
            ctx.globalCompositeOperation = 'color';
            ctx.clearRect(0, 0, cW, cH);
            ctx.drawImage(textCanvas, 0, 0);
            ctx.globalCompositeOperation = 'source-in';
        });
    });
};

initCanvas();

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
    const guests = parseInt(document.querySelector('#rsvp-guests')?.value ?? '1', 10);
    const message = document.querySelector('#rsvp-message')?.value.trim() ?? '';

    if (!name) return showNote('Please enter your name.');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showNote('Please enter a valid email address.');

    btnOk.setAttribute('data-adding', 'true');

    try {
        const res = await fetch('http://localhost:3000/api/rsvps', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug, name, email, attending: 'yes', guests, message }),
        });
        const json = await res.json().catch(() => ({}));

        if (json.success) {
            btnOk.removeAttribute('data-adding');
            btnOk.setAttribute('data-complete', 'true');
            showNote("You're confirmed! See you on June 15 ✦", true);
            disableForm();
        } else {
            throw new Error(json.error ?? 'Server error');
        }
    } catch (err) {
        btnOk.removeAttribute('data-adding');
        showNote(err.message ?? 'Something went wrong. Please try again.');
    }
});

// Decline
btnNo?.addEventListener('click', async () => {
    if (btnNo.getAttribute('disabled')) return;

    const name = document.querySelector('#rsvp-name')?.value.trim() ?? '';
    const email = document.querySelector('#rsvp-email')?.value.trim() ?? '';

    try {
        await fetch('http://localhost:3000/api/rsvps', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug, name, email, attending: 'no', guests: 0, message: '' }),
        });
    } catch (_) {
        /* silent */
    }

    showNote("We'll miss you. Thank you for letting us know.", true);
    disableForm();
});
