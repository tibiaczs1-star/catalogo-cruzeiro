/* ============================================================
   ORCA LAB — behavior
   Parallax depth on the mascot, cursor tracking, reveals, i18n.
   ============================================================ */

(function () {
  'use strict';

  const cfg = window.SITE_CONFIG || {};
  const dict = window.I18N || {};
  const LANGS = ['pt', 'en', 'es'];
  const LANG_KEY = 'orcalab.lang';

  const state = { lang: 'pt' };

  /* ---------------- language ---------------- */

  function detect() {
    const forced = new URLSearchParams(location.search).get('lang');
    if (forced && LANGS.includes(forced)) return forced;

    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved && LANGS.includes(saved)) return saved;
    } catch (e) { /* storage blocked */ }
    const nav = (navigator.language || 'pt').toLowerCase();
    if (nav.startsWith('es')) return 'es';
    if (nav.startsWith('en')) return 'en';
    return 'pt';
  }

  function applyLang(lang) {
    if (!LANGS.includes(lang)) lang = 'pt';
    state.lang = lang;
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : lang;

    const table = dict[lang] || dict.pt || {};
    const fallback = dict.pt || {};

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const val = table[key] ?? fallback[key];
      if (typeof val === 'string') el.textContent = val;
    });

    document.querySelectorAll('.lang button').forEach((b) => {
      const on = b.dataset.lang === lang;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    updateLinks(lang);
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* ignore */ }
  }

  function updateLinks(lang) {
    const wa = document.getElementById('waBtn');
    if (wa && cfg.whatsapp) {
      const msg = (cfg.whatsappMessage?.[lang]) || cfg.whatsappMessage?.pt || '';
      wa.href = `https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(msg)}`;
    }
    const mail = document.getElementById('mailBtn');
    if (mail && cfg.email) {
      const subject = {
        pt: 'Orçamento — Orca Lab',
        en: 'Quote — Orca Lab',
        es: 'Presupuesto — Orca Lab',
      }[lang];
      mail.href = `mailto:${cfg.email}?subject=${encodeURIComponent(subject)}`;
    }
  }

  /* ---------------- mascot interaction ---------------- */

  function initMascot() {
    const stage = document.getElementById('mascotStage');
    const tilt = document.getElementById('mascotTilt');
    if (!stage || !tilt) return;

    // ?motion=1 / ?motion=0 lets the user override the OS setting
    const q = new URLSearchParams(location.search).get('motion');
    const reduced = q === '0' ? true : q === '1' ? false : window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const pupil = stage.querySelector('.pupil');
    const layers = Array.from(stage.querySelectorAll('.layer'));
    const eyeLive = stage.querySelector('.eye-live');

    let targetX = 0, targetY = 0;
    let curX = 0, curY = 0;
    let raf = null;
    let active = false;

    function onMove(e) {
      const r = stage.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) / (r.width * 0.9);
      const dy = (e.clientY - cy) / (r.height * 0.9);
      targetX = Math.max(-1, Math.min(1, dx));
      targetY = Math.max(-1, Math.min(1, dy));
      active = true;
      if (!raf) raf = requestAnimationFrame(tick);
    }

    function onLeave() {
      targetX = 0;
      targetY = 0;
    }

    function tick() {
      raf = null;
      curX += (targetX - curX) * 0.09;
      curY += (targetY - curY) * 0.09;

      // whole card rotates in 3D space
      const rotY = curX * 11;
      const rotX = -curY * 9;
      tilt.style.transform = `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;

      // each layer moves at its own depth
      layers.forEach((layer) => {
        const depth = parseFloat(layer.dataset.depth || '0') / 10;
        const tx = -curX * depth * 5;
        const ty = -curY * depth * 5;
        layer.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0)`;
      });

      // the live pupil tracks with more travel than the head
      if (pupil) {
        const px = curX * 13;
        const py = curY * 11;
        pupil.style.transform = `translate(${px.toFixed(2)}px, ${py.toFixed(2)}px)`;
      }

      // the eye squints slightly toward the light
      if (eyeLive) {
        const sc = 1 - Math.abs(curY) * 0.05;
        eyeLive.style.transform = `scaleY(${sc.toFixed(3)})`;
      }

      if (active && (Math.abs(targetX - curX) > 0.002 || Math.abs(targetY - curY) > 0.002)) {
        raf = requestAnimationFrame(tick);
      }
    }

    window.addEventListener('pointermove', onMove, { passive: true });
    stage.addEventListener('pointerleave', onLeave);

    // a soft ambient drift when the pointer has not moved yet
    let idleT = 0;
    setInterval(() => {
      if (raf) return;
      idleT += 0.02;
      const ix = Math.sin(idleT) * 0.16;
      const iy = Math.cos(idleT * 0.8) * 0.12;
      if (pupil) pupil.style.transform = `translate(${(ix * 13).toFixed(2)}px, ${(iy * 11).toFixed(2)}px)`;
    }, 60);
  }

  /* ---------------- scroll & reveal ---------------- */

  function initScroll() {
    const bar = document.querySelector('.topbar');
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        if (bar) bar.classList.toggle('is-stuck', window.scrollY > 18);

        // orbs drift with scroll for depth
        const y = window.scrollY;
        document.querySelectorAll('.orb').forEach((orb, i) => {
          orb.style.setProperty('--sy', `${y * (0.03 + i * 0.02)}px`);
        });

        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function initReveal() {
    const targets = document.querySelectorAll(
      '.sec-head, .row, .step, .plan, .big-text, .statement-meta, .contact-title, .contact-lead, .contact-actions'
    );
    targets.forEach((el) => el.classList.add('reveal'));

    if (!('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('in'));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });

    targets.forEach((el) => io.observe(el));

    // stagger siblings
    document.querySelectorAll('.rows, .steps, .plan-grid').forEach((group) => {
      Array.from(group.children).forEach((child, i) => {
        child.style.transitionDelay = `${i * 70}ms`;
      });
    });
  }

  /* ---------------- smooth anchors ---------------- */

  function initAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (!id || id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 76;
        window.scrollTo({ top, behavior: 'smooth' });
      });
    });
  }

  /* ---------------- swarm: mascot becomes code, writes, returns ---------------- */

  function initSwarm() {
    const canvas = document.getElementById('swarmLayer');
    const svg = document.getElementById('mascot');
    const stage = document.getElementById('mascotStage');
    const mouth = document.querySelector('.mouth-group');
    const mascot = document.getElementById('mascot');
    if (!canvas || !svg || !stage) return;

    const q = new URLSearchParams(location.search).get('motion');
    const reduced = q === '0' ? true : q === '1' ? false : window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const Swarm = window.SwarmMorph || window.ORCA_SWARM;
    if (!Swarm) return;

    const swarm = new Swarm(canvas, { reduced: false });
    let busy = false;
    let lastWrite = 0;

    async function resample() {
      const rect = svg.getBoundingClientRect();
      if (rect.width < 40) return;
      const pts = await swarm.sampleMascot(svg, rect);
      if (pts.length) swarm.setHomes(pts);
    }

    // first sample after layout + fonts
    setTimeout(resample, 700);
    window.addEventListener('resize', () => setTimeout(resample, 300));
    window.addEventListener('load', () => setTimeout(resample, 400), { once: true });

    /* --- breathing: open jaw, exhale particles, swallow --- */
    function breathe() {
      if (!mouth || busy) return;
      mouth.classList.add('is-breathing');
      if (mascot) mascot.classList.add('is-holding');

      const r = svg.getBoundingClientRect();
      const anchorX = r.left + r.width * 0.555;
      const anchorY = r.top + r.height * 0.665;

      setTimeout(() => swarm.burst(anchorX, anchorY, 70), 120);
      setTimeout(() => swarm.burst(anchorX, anchorY, 45), 320);

      setTimeout(() => {
        mouth.classList.remove('is-breathing');
        if (mascot) mascot.classList.remove('is-holding');
      }, 1150);
    }

    setInterval(() => {
      if (!busy && Math.random() > 0.35) breathe();
    }, 6200);

    /* --- writing a heading --- */
    async function writeHeading(el) {
      if (busy) return;
      const now = performance.now();
      if (now - lastWrite < 2600) return;
      lastWrite = now;
      busy = true;

      const pts = swarm.sampleText(el);
      if (!pts.length) { busy = false; return; }

      canvas.classList.add('is-on');
      el.classList.add('is-written');
      if (mascot) mascot.classList.add('is-holding');

      // the mascot itself dissolves into the swarm
      stage.style.transition = 'opacity 0.5s ease';
      stage.style.opacity = '0.06';

      swarm.morphTo(pts, 'writing');
      await wait(2050);

      // hold the written line, then pull it back into the body
      await wait(900);
      el.classList.remove('is-written');

      stage.style.opacity = '1';
      swarm.returnHome();
      await wait(1500);

      if (mascot) mascot.classList.remove('is-holding');
      canvas.classList.remove('is-on');
      busy = false;
      setTimeout(resample, 200);
    }

    const targets = Array.from(document.querySelectorAll('[data-swarm-target]'));
    if (!targets.length) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || busy) return;
        const el = entry.target;
        if (el.dataset.done === '1') return;
        el.dataset.done = '1';
        // let the reveal finish first
        setTimeout(() => writeHeading(el), 520);
      });
    }, { rootMargin: '0px 0px -18% 0px', threshold: 0.25 });

    targets.forEach((el) => io.observe(el));

    // expose for debugging
    window.__swarm = swarm;
  }

  function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

  /* ---------------- data face ---------------- */

  function initDataFace() {
    const canvas = document.getElementById('morphCanvas');
    const Ctor = window.MorphStage;
    if (!canvas || !Ctor) return;

    const q = new URLSearchParams(location.search).get('motion');
    const reduced = q === '0' ? true : q === '1' ? false : window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    let stage;
    try {
      stage = new Ctor(canvas, {
        reduced: false,
        onMode: (name) => {
          const el = document.getElementById('morphShape');
          if (el) el.textContent = name.toUpperCase();
        },
      });
    } catch (e) {
      console.warn('[morph]', e);
      return;
    }

    const parts = document.getElementById('morphParts');
    if (parts) parts.textContent = stage.count.toLocaleString('pt-BR').replace(/\./g, ' ');

    stage.play(['bot', 'swarm', 'car', 'plane', 'bot'], 3200);

    document.querySelectorAll('.ml').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.ml').forEach((b) => b.classList.remove('is-on'));
        btn.classList.add('is-on');
        const shape = btn.dataset.shape;
        if (shape === 'face') { stage.explode(); setTimeout(() => stage.morph('face'), 480); }
        else stage.morph(shape);
      });
    });

    window.__morph = stage;
  }

  /* ---------------- typewriter ---------------- */

  function initTyping() {
    const Terminal = window.TerminalType;
    if (!Terminal) return;

    const q = new URLSearchParams(location.search).get('motion');
    const reduced = q === '1' ? false : q === '0' ? true : window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const soundPref = new URLSearchParams(location.search).get('sound');
    const term = new Terminal({ reduced: false, sound: soundPref !== '0' });

    // the first keystroke unlocks audio in browsers
    const unlock = () => {
      if (term.audio && term.audio.state === 'suspended') term.audio.resume().catch(() => {});
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });

    const items = Array.from(document.querySelectorAll('[data-type]'));
    if (!items.length) return;

    // hero types immediately, everything else types when it enters view
    const hero = items.filter((el) => el.closest('.hero'));
    hero.forEach((el) => term.type(el));

    const rest = items.filter((el) => !el.closest('.hero'));
    if (!('IntersectionObserver' in window)) {
      rest.forEach((el) => term.type(el));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        term.type(entry.target);
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.3 });

    rest.forEach((el) => io.observe(el));

    // retype a section title when the language changes
    document.querySelectorAll('.lang button').forEach((b) => {
      b.addEventListener('click', () => {
        setTimeout(() => {
          const t = new (window.TerminalType)({ reduced: false, sound: false });
          document.querySelectorAll('[data-type]').forEach((el) => {
            const r = el.getBoundingClientRect();
            if (r.top < window.innerHeight && r.bottom > 0) t.type(el);
          });
        }, 60);
      });
    });
  }

  /* ---------------- availability ---------------- */

  // Set this to the real number of open slots. Leave null to hide the block.
  const SLOTS = null;

  function initSlots() {
    const box = document.getElementById('slotsBox');
    const count = document.getElementById('slotsCount');
    if (!box || !count) return;
    if (typeof SLOTS !== 'number') return;   // hidden until a real number exists
    count.textContent = String(SLOTS);
    box.hidden = false;
  }

  /* ---------------- reactbits effects ---------------- */

  function initEffects() {
    const RB = window.RB;
    if (!RB) return;

    const q = new URLSearchParams(location.search).get('motion');
    const reduced = q === '0' ? true : q === '1' ? false : window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    RB.clickSpark('body', { color: '#00b8c8', count: 7 });
    RB.spotlight('.plan');
    RB.shinyText(document.querySelector('.voice-tag'));

    // hero headline: letters rise, one line after another
    // run after the i18n pass so the split captures the right language
    setTimeout(() => {
      document.querySelectorAll('.hero-title .line').forEach((line, i) => {
        RB.splitText(line, { stagger: 0.022, delay: 0.12 * i });
      });
    }, 90);

    // first-person block: words resolve from blur
    RB.onEnter(document.querySelectorAll('.vline'), (el) => RB.blurText(el, { stagger: 0.05 }), { threshold: 0.35 });
    RB.variableProximity(document.querySelector('.voice-quote'), { radius: 150, maxScale: 1.08, maxWeight: 700 });

    // prices roll up
    RB.onEnter(document.querySelectorAll('.price-num'), (el) => RB.countUp(el, { duration: 1600 }), { threshold: 0.6 });

    // section titles rise behind a mask, line by line
    RB.onEnter(document.querySelectorAll('.sec-title, .face-title'), (el) => {
      RB.splitText(el, { stagger: 0.012, delay: 0.05 });
    }, { threshold: 0.4 });

    // glitch on the brand
    const brand = document.querySelector('.brand-word');
    if (brand) RB.glitchText(brand, { period: 5200, burst: 380 });
  }

  /* ---------------- boot ---------------- */

  function boot() {
    applyLang(detect());

    document.querySelectorAll('.lang button').forEach((b) => {
      b.addEventListener('click', () => applyLang(b.dataset.lang));
    });

    const y = document.getElementById('year');
    if (y) y.textContent = String(new Date().getFullYear());

    initMascot();
    initDataFace();
    initEffects();
    initTyping();
    initSwarm();
    initSlots();
    initScroll();
    initReveal();
    initAnchors();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();