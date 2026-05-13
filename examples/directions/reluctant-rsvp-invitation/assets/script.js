import { animate, createTimeline, scrambleText, $ } from './vendor/animejs.js';

// ── Slug derivation (works under /card/{slug}/ or as standalone preview) ─────
const parts = window.location.pathname.split('/').filter(Boolean);
const slug = parts[0] === 'card' && parts[1] ? parts[1] : 'preview';

// ── Dynamic Event Date ─────────────────────────────────────────────────────
// Generate a future date 30-180 days from now with a random evening time.
// Must be patched into the DOM BEFORE intro.init() so the scramble animation
// picks up the correct text (it scrambles from empty → textContent).
const MONTHS = ['January','February','March','April','May','June',
    'July','August','September','October','November','December'];
const DAYS_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const HOURS_12 = [4, 5, 6, 7]; // 4-7 PM
const MINUTES = [0, 15, 30];

const partyDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 30 + Math.floor(Math.random() * 151));
    const hr = 16 + HOURS_12[Math.floor(Math.random() * HOURS_12.length)]; // 20-23 h
    const min = MINUTES[Math.floor(Math.random() * MINUTES.length)];
    d.setHours(hr, min, 0, 0);
    return d;
})();

const evDayName  = DAYS_FULL[partyDate.getDay()];
const evDay      = partyDate.getDate();
const evMonth    = MONTHS[partyDate.getMonth()];
const evYear     = partyDate.getFullYear();
const evHour12   = partyDate.getHours() > 12 ? partyDate.getHours() - 12 : partyDate.getHours();
const evMinStr   = partyDate.getMinutes() === 0 ? '00' : String(partyDate.getMinutes());
const evTimeStr  = `${evHour12}:${evMinStr} PM`;
const evDateStr  = `${evDayName}, ${evMonth} ${evDay}, ${evYear} · ${evTimeStr}`;

// Patch the "WHEN" span before the scramble intro fires
const whenEl = document.querySelector('.details-list span.scramble');
if (whenEl) whenEl.textContent = evDateStr;


// Exactly mirrors the anime-js-scramble-text-playground pattern:
//   · All .scramble elements enter via the intro timeline (from empty)
//   · pointerenter + pointerdown replay the scramble on hover/tap

const scrambleParams = {
    chars: 'lowercase',
    cursor: '░▒▓█',
    duration: 600,
    perturbation: 0.3,
    settleDuration: 200,
};

const intro = createTimeline({ delay: 500 });

$('.scramble').forEach(($el) => {
    const replay = () => animate($el, { innerHTML: scrambleText(scrambleParams) });
    intro.add(
        $el,
        {
            innerHTML: scrambleText({
                override: '',
                duration: 750,
                settleDuration: 250,
                perturbation: 0.2,
                cursor: '░▒▓█',
            }),
        },
        '-=620',
    );
    $el.addEventListener('pointerenter', replay);
    $el.addEventListener('pointerdown', replay);
});

intro.init();

// ── Tag cycling ───────────────────────────────────────────────────────────────
const tagText = document.querySelector('.tag-text');
const tagProgression = [
    'Happening regardless',
    'RSVPs optional, attendance mandatory',
    'Cake confirmed (allegedly)',
    'Your presence has been assumed',
    'Please do not make this weird',
];
let tagIdx = 0;
tagText.style.transition = 'opacity 0.4s';
setInterval(() => {
    tagIdx = (tagIdx + 1) % tagProgression.length;
    tagText.style.opacity = '0';
    setTimeout(() => {
        tagText.textContent = tagProgression[tagIdx];
        tagText.style.opacity = '1';
    }, 400);
}, 5500);

// ── Counters ──────────────────────────────────────────────────────────────────
// STILL DECLINING: live seconds-until-event countdown, updated every second.
const decliningEl = document.querySelector('[data-counter="declining"]');
const dreadEl = document.getElementById('dread-counter');

const updateCounters = () => {
    const now = Date.now();
    const secsLeft = Math.max(0, Math.floor((partyDate - now) / 1000));
    const daysLeft = Math.max(0, Math.ceil((partyDate - now) / 86400000));
    if (decliningEl) decliningEl.textContent = secsLeft.toLocaleString();
    if (dreadEl) dreadEl.textContent = daysLeft.toLocaleString();
};
updateCounters();
setInterval(updateCounters, 1000);

// ── Nav links ─────────────────────────────────────────────────────────────────
document.querySelectorAll('.nav-links a').forEach((link) => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        link.classList.add('fading');
        setTimeout(() => (link.style.display = 'none'), 400);
    });
});

// ── Dodge button ──────────────────────────────────────────────────────────────
// Mirrors the exclusive codepen's dodge mechanic:
//   · pointermove pushes the button away when cursor is within DODGE_RADIUS
//   · setInterval settles the button back toward origin (× 0.92 decay)
//   · Label cycles: "I'll Be There" → "no" (fleeing) → "fine..." (cornered)

const form = document.querySelector('.signup');
const btnAccept = document.getElementById('btn-accept');
const btnDecline = document.getElementById('btn-decline');
const acceptLabel = btnAccept.querySelector('span');
const note = document.querySelector('.form-note');

const DODGE_RADIUS = 140;
const MAX_OFFSET = 220;
let offsetX = 0;
let offsetY = 0;
let labelState = 'still';
let formReady = false;

// stop dodging once name + email are both filled
const nameInput = document.getElementById('rsvp-name');
const emailInput = document.getElementById('rsvp-email');
const checkReady = () => {
    const ready = nameInput.value.trim().length > 0 && emailInput.value.trim().length > 0;
    if (ready !== formReady) {
        formReady = ready;
        btnAccept.classList.toggle('ready', ready);
        if (ready) {
            // snap back to original position
            offsetX = 0;
            offsetY = 0;
            btnAccept.style.transform = '';
            setAcceptLabel('still');
        }
    }
};
nameInput.addEventListener('input', checkReady);
emailInput.addEventListener('input', checkReady);

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const setAcceptLabel = (state) => {
    if (btnAccept.disabled || state === labelState) return;
    labelState = state;
    acceptLabel.style.opacity = '0';
    const labels = { still: "I'll Be There", fleeing: 'no', cornered: 'fine...' };
    setTimeout(() => {
        acceptLabel.textContent = labels[state] ?? labels.still;
        acceptLabel.style.opacity = '1';
    }, 180);
};

const dodgeBtn = (e) => {
    if (formReady || btnAccept.disabled) return;
    const rect = btnAccept.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.hypot(dx, dy);

    if (dist < DODGE_RADIUS) {
        const force = (DODGE_RADIUS - dist) / DODGE_RADIUS;
        const angle = Math.atan2(dy, dx);
        const push = force * 90;
        offsetX = clamp(offsetX - Math.cos(angle) * push, -MAX_OFFSET, MAX_OFFSET);
        offsetY = clamp(offsetY - Math.sin(angle) * push, -MAX_OFFSET, MAX_OFFSET);
        btnAccept.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        const cornered = Math.hypot(offsetX, offsetY) >= MAX_OFFSET * 0.85;
        setAcceptLabel(cornered ? 'cornered' : 'fleeing');
    }
};

const settleBtn = () => {
    if (formReady) return;
    if (Math.abs(offsetX) < 0.5 && Math.abs(offsetY) < 0.5) {
        setAcceptLabel('still');
        return;
    }
    offsetX *= 0.92;
    offsetY *= 0.92;
    btnAccept.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    if (Math.hypot(offsetX, offsetY) < 4) setAcceptLabel('still');
};

window.addEventListener('pointermove', dodgeBtn);
setInterval(settleBtn, 60);

// ── RSVP submit ───────────────────────────────────────────────────────────────
const submitRSVP = async (attending) => {
    const name = document.getElementById('rsvp-name').value.trim();
    const email = document.getElementById('rsvp-email').value.trim();

    if (!name || !email) {
        note.textContent = 'At minimum, your name and email. We insist.';
        return;
    }

    note.textContent =
        attending === 'yes'
            ? "You caught it. Submitting... we're mildly impressed."
            : 'Noted. Sending your regrets…';

    // Demo: simulate success after short delay
    await new Promise((r) => setTimeout(r, 800));

    form.classList.add('removed');
    btnAccept.classList.add('caught');
    btnAccept.disabled = true;
    btnDecline.disabled = true;

    if (attending === 'yes') {
        acceptLabel.textContent = 'Caught.';
        note.textContent = "You caught it. We're impressed. See you Saturday.";
    } else {
        note.textContent = 'Understood. We expected this. Have a good life.';
    }
};

btnAccept.addEventListener('click', () => submitRSVP('yes'));
btnDecline.addEventListener('click', () => submitRSVP('no'));
