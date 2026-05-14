// Auto-demo: runs on every page load for screen recording purposes.
(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    function scrollTo(y, ms = 1400) {
        const start = window.scrollY;
        const dist = y - start;
        if (Math.abs(dist) < 1) return Promise.resolve();
        const t0 = performance.now();
        return new Promise((resolve) => {
            (function step(now) {
                const t = Math.min((now - t0) / ms, 1);
                const e = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
                window.scrollTo(0, start + dist * e);
                t < 1 ? requestAnimationFrame(step) : resolve();
            })(performance.now());
        });
    }

    async function typeInto(el, text) {
        el.focus();
        for (const ch of text) {
            el.value += ch;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            await sleep(50 + Math.random() * 40);
        }
    }

    // Let hero cooking-letter animation play
    await sleep(2800);

    // § Glow
    const sGlow = document.getElementById('s-glow');
    if (sGlow) await scrollTo(sGlow.offsetTop, 1400);
    await sleep(2400);

    // § Date
    const sDate = document.getElementById('s-date');
    if (sDate) await scrollTo(sDate.offsetTop, 1400);
    await sleep(2400);

    // § Details
    const sDetails = document.getElementById('s-details');
    if (sDetails) await scrollTo(sDetails.offsetTop, 1400);
    await sleep(2400);

    // § RSVP
    const sRsvp = document.getElementById('s-rsvp');
    if (sRsvp) await scrollTo(sRsvp.offsetTop, 1400);
    await sleep(1000);

    // Fill form
    const nameEl = document.getElementById('rsvp-name');
    if (nameEl) await typeInto(nameEl, 'Jordan Blake');
    await sleep(400);

    const emailEl = document.getElementById('rsvp-email');
    if (emailEl) await typeInto(emailEl, 'jordan@demo.com');
    await sleep(400);

    const msgEl = document.getElementById('rsvp-message');
    if (msgEl) await typeInto(msgEl, 'Looking forward to the summit!');
    await sleep(700);

    // Accept
    const btn = document.getElementById('btn-accept');
    if (btn) btn.click();
})();
