// Auto-demo: runs on every page load for screen recording purposes.
(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    function scrollTo(y, ms = 1300) {
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
            await sleep(52 + Math.random() * 38);
        }
    }

    // Wait for scramble animations to finish
    await sleep(3800);

    // Scroll down to form
    const form = document.querySelector('.signup');
    if (form) {
        const top = form.getBoundingClientRect().top + window.scrollY;
        await scrollTo(Math.max(0, top - 80), 1400);
    }
    await sleep(700);

    const nameEl = document.getElementById('rsvp-name');
    if (nameEl) await typeInto(nameEl, 'Alex Morgan');
    await sleep(380);

    const emailEl = document.getElementById('rsvp-email');
    if (emailEl) await typeInto(emailEl, 'alex@demo.com');
    await sleep(380);

    const msgEl = document.getElementById('rsvp-message');
    if (msgEl) await typeInto(msgEl, 'I suppose I shall attend.');
    await sleep(700);

    // Click the accept button directly — bypasses the dodge hover behaviour
    const btn = document.getElementById('btn-accept');
    if (btn) btn.click();
})();
