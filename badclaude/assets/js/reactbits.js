/* ============================================================
   REACTBITS EFFECTS — adapted to vanilla JS
   Source patterns from reactbits.dev (SplitText, BlurText,
   CountUp, DecryptedText, ShinyText, VariableProximity,
   GlitchText, SpotlightCard, ClickSpark).
   No React, no build step: same mechanics, plain DOM.
   ============================================================ */

/* ---------------- SplitText: letters rise from a mask ---------------- */

export function splitText(el, opts = {}) {
  if (!el || el.dataset.split === '1') return Promise.resolve();
  el.dataset.split = '1';

  const stagger = opts.stagger ?? 0.026;
  const delay = opts.delay ?? 0;
  const text = el.textContent || '';
  const parts = [];

  el.textContent = '';
  el.classList.add('rb-split');

  [...text].forEach((ch, i) => {
    const wrap = document.createElement('span');
    wrap.className = 'rb-char';
    wrap.style.setProperty('--i', i);
    if (ch === ' ') {
      wrap.innerHTML = '&nbsp;';
      wrap.classList.add('rb-space');
      el.appendChild(wrap);
      return;
    }
    const inner = document.createElement('span');
    inner.className = 'rb-char-i';
    inner.textContent = ch;
    wrap.appendChild(inner);
    el.appendChild(wrap);
    parts.push(inner);
  });

  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      parts.forEach((p, i) => {
        p.style.transitionDelay = `${delay + i * stagger}s`;
        p.classList.add('rb-in');
      });
      setTimeout(resolve, (delay + parts.length * stagger) * 1000 + 520);
    });
  });
}

/* ---------------- BlurText: words resolve from a soft cross-blur ---------------- */

export function blurText(el, opts = {}) {
  if (!el || el.dataset.blur === '1') return Promise.resolve();
  el.dataset.blur = '1';

  const stagger = opts.stagger ?? 0.045;
  const html = el.innerHTML;
  const words = [];
  const tmp = document.createElement('div');
  tmp.innerHTML = html;

  el.textContent = '';
  el.classList.add('rb-blur');

  const walk = (node, parent) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        (child.textContent || '').split(/(\s+)/).forEach((part) => {
          if (!part.trim()) {
            parent.appendChild(document.createTextNode(part));
            return;
          }
          const span = document.createElement('span');
          span.className = 'rb-word';
          span.style.setProperty('--i', words.length);
          span.textContent = part;
          parent.appendChild(span);
          words.push(span);
          parent.appendChild(document.createTextNode(' '));
        });
      } else if (child.nodeType === 1) {
        const clone = document.createElement(child.tagName);
        [...child.attributes].forEach((a) => clone.setAttribute(a.name, a.value));
        parent.appendChild(clone);
        walk(child, clone);
      }
    });
  };

  walk(tmp, el);

  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      words.forEach((w, i) => {
        w.style.transitionDelay = `${i * stagger}s`;
        w.classList.add('rb-in');
      });
      setTimeout(resolve, words.length * stagger * 1000 + 700);
    });
  });
}

/* ---------------- CountUp: numbers roll to target with easing ---------------- */

export function countUp(el, opts = {}) {
  if (!el) return;
  const to = Number(el.dataset.count || opts.to || 0);
  const from = opts.from ?? 0;
  const duration = opts.duration ?? 1500;
  const sep = opts.separator ?? '.';
  const start = performance.now();

  const fmt = (v) => Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, sep);

  function frame(now) {
    const p = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - p, 3);       // cubic ease-out
    el.textContent = fmt(from + (to - from) * eased);
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/* ---------------- DecryptedText: scramble that resolves to the word ---------------- */

export function decryptedText(el, opts = {}) {
  if (!el || el.dataset.decrypt === '1') return Promise.resolve();
  el.dataset.decrypt = '1';

  const full = el.textContent || '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\<>{}[]#$%&*';
  const speed = opts.speed ?? 26;
  const revealEvery = opts.revealEvery ?? 52;

  return new Promise((resolve) => {
    let revealed = 0;
    const start = performance.now();

    const tick = () => {
      const elapsed = performance.now() - start;
      const target = Math.floor(elapsed / revealEvery);

      let out = '';
      for (let i = 0; i < full.length; i++) {
        if (i < target) out += full[i];
        else if (full[i] === ' ') out += ' ';
        else out += chars[Math.floor(Math.random() * chars.length)];
      }
      el.textContent = out;

      if (target >= full.length) {
        el.textContent = full;
        resolve();
        return;
      }
      setTimeout(tick, speed);
    };
    tick();
  });
}

/* ---------------- ShinyText: a masked gradient sweeps the text ---------------- */

export function shinyText(el, opts = {}) {
  if (!el) return;
  el.classList.add('rb-shiny');
  el.style.setProperty('--shine-speed', `${opts.speed ?? 3.2}s`);
}

/* ---------------- GlitchText: RGB split on a schedule ---------------- */

export function glitchText(el, opts = {}) {
  if (!el || el.dataset.glitch === '1') return;
  el.dataset.glitch = '1';
  el.classList.add('rb-glitch');
  el.setAttribute('data-text', el.textContent || '');

  const period = opts.period ?? 4200;
  const burst = opts.burst ?? 420;

  const fire = () => {
    el.classList.add('is-glitching');
    setTimeout(() => el.classList.remove('is-glitching'), burst);
    setTimeout(fire, period + Math.random() * 2600);
  };
  setTimeout(fire, 1600 + Math.random() * 2000);
}

/* ---------------- VariableProximity: letters swell near the cursor ---------------- */

export function variableProximity(el, opts = {}) {
  if (!el || el.dataset.prox === '1') return;
  el.dataset.prox = '1';

  const radius = opts.radius ?? 130;
  const maxScale = opts.maxScale ?? 1.22;
  const maxWeight = opts.maxWeight ?? 800;

  // wrap characters (keeps existing inline markup by walking text nodes)
  const chars = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  nodes.forEach((node) => {
    const frag = document.createDocumentFragment();
    [...node.textContent].forEach((ch) => {
      if (ch === ' ') { frag.appendChild(document.createTextNode(' ')); return; }
      const s = document.createElement('span');
      s.textContent = ch;
      s.style.display = 'inline-block';
      s.style.willChange = 'transform, font-weight';
      frag.appendChild(s);
      chars.push(s);
    });
    node.parentNode.replaceChild(frag, node);
  });

  let raf = null;
  let mx = -9999, my = -9999;

  const update = () => {
    raf = null;
    chars.forEach((c) => {
      const r = c.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const d = Math.hypot(mx - cx, my - cy);
      const t = Math.max(0, 1 - d / radius);
      const scale = 1 + (maxScale - 1) * t * t;
      const weight = Math.round(400 + (maxWeight - 400) * t);
      c.style.transform = `scale(${scale.toFixed(3)})`;
      c.style.fontWeight = String(weight);
    });
  };

  window.addEventListener('pointermove', (e) => {
    mx = e.clientX; my = e.clientY;
    if (!raf) raf = requestAnimationFrame(update);
  }, { passive: true });
}

/* ---------------- SpotlightCard: a light follows the pointer ---------------- */

export function spotlight(els) {
  document.querySelectorAll(els).forEach((el) => {
    el.classList.add('rb-spot');
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--sx', `${((e.clientX - r.left) / r.width) * 100}%`);
      el.style.setProperty('--sy', `${((e.clientY - r.top) / r.height) * 100}%`);
    }, { passive: true });
  });
}

/* ---------------- ClickSpark: particles on click ---------------- */

export function clickSpark(selector = 'body', opts = {}) {
  const color = opts.color || '#00b8c8';
  const count = opts.count || 8;
  const root = document.querySelector(selector) || document.body;

  root.addEventListener('click', (e) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      s.className = 'rb-spark';
      s.style.left = `${e.clientX}px`;
      s.style.top = `${e.clientY}px`;
      s.style.background = color;

      const a = (i / count) * Math.PI * 2;
      const d = 18 + Math.random() * 26;
      s.style.setProperty('--dx', `${Math.cos(a) * d}px`);
      s.style.setProperty('--dy', `${Math.sin(a) * d}px`);

      document.body.appendChild(s);
      setTimeout(() => s.remove(), 620);
    }
  });
}

/* ---------------- observe helpers ---------------- */

export function onEnter(elements, cb, opts = {}) {
  const list = Array.from(elements);
  if (!list.length) return;

  if (!('IntersectionObserver' in window)) {
    list.forEach(cb);
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      cb(e.target);
      io.unobserve(e.target);
    });
  }, { rootMargin: opts.rootMargin || '0px 0px -10% 0px', threshold: opts.threshold ?? 0.2 });

  list.forEach((el) => io.observe(el));
}

try {
  window.RB = {
    splitText, blurText, countUp, decryptedText,
    shinyText, glitchText, variableProximity,
    spotlight, clickSpark, onEnter,
  };
} catch (e) { /* ignore */ }