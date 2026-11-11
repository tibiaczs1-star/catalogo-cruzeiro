/* ============================================================
   BADCLAUDE — language switch (PT / EN / ES)
   Reads the shared dictionary in i18n.js (window.I18N), applies it
   to any element with [data-i18n="key"], remembers the choice and
   injects a minimal, stylable switcher (.bc-lang).
   Purely optional: pages without window.I18N still load fine.
   ============================================================ */

(function () {
  const STORAGE_KEY = 'badclaude-lang';
  const LANGS = [
    { code: 'pt', label: 'PT' },
    { code: 'en', label: 'EN' },
    { code: 'es', label: 'ES' },
  ];
  const CSS = `
    .bc-lang{position:fixed;right:18px;bottom:18px;z-index:9999;display:flex;gap:2px;
      padding:4px;border-radius:999px;background:rgba(10,10,12,.72);backdrop-filter:blur(10px);
      border:1px solid rgba(255,255,255,.14);font:600 10.5px/1 'JetBrains Mono',ui-monospace,monospace;
      letter-spacing:.08em;box-shadow:0 8px 28px rgba(0,0,0,.35)}
    .bc-lang button{appearance:none;border:0;background:transparent;color:rgba(255,255,255,.55);
      padding:7px 10px;border-radius:999px;cursor:pointer;transition:color .2s,background .2s}
    .bc-lang button:hover{color:#fff}
    .bc-lang button[aria-pressed="true"]{background:#fff;color:#09090b}
    .bc-lang button:focus-visible{outline:2px solid currentColor;outline-offset:2px}
    @media print{.bc-lang{display:none}}
    @media (prefers-reduced-motion:reduce){.bc-lang button{transition:none}}
  `;

  let current = 'pt';

  function store(lang) {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
  }

  function read() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && LANGS.some((l) => l.code === saved)) return saved;
    } catch (e) {}
    const nav = (navigator.language || 'pt').slice(0, 2).toLowerCase();
    return nav === 'en' || nav === 'es' ? nav : 'pt';
  }

  function apply(lang) {
    const dict = (window.I18N && window.I18N[lang]) || {};
    const fallback = (window.I18N && window.I18N.pt) || {};
    current = lang;
    store(lang);
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : lang;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const text = dict[key] ?? fallback[key];
      if (text == null) return;
      if (el.hasAttribute('data-i18n-html')) el.innerHTML = text;
      else el.textContent = text;
    });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      const key = el.getAttribute('data-i18n-aria');
      const text = dict[key] ?? fallback[key];
      if (text != null) el.setAttribute('aria-label', text);
    });
    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const key = el.getAttribute('data-i18n-title');
      const text = dict[key] ?? fallback[key];
      if (text != null) el.setAttribute('title', text);
    });
    document.querySelectorAll('.bc-lang button').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
    });
    if (window.SITE_CONFIG) {
      document.querySelectorAll('[data-wa]').forEach((a) => {
        const msg = window.SITE_CONFIG.whatsappMessage;
        const text = typeof msg === 'string' ? msg : (msg && msg[lang]) || '';
        a.href = 'https://wa.me/' + window.SITE_CONFIG.whatsapp + '?text=' + encodeURIComponent(text);
      });
    }
    document.dispatchEvent(new CustomEvent('badclaude:lang', { detail: { lang } }));
  }

  function buildSwitcher() {
    if (document.querySelector('.bc-lang') || document.body.hasAttribute('data-no-lang-ui')) return;
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    const box = document.createElement('div');
    box.className = 'bc-lang';
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', 'Idioma / Language / Idioma');
    LANGS.forEach((l) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.lang = l.code;
      b.textContent = l.label;
      b.addEventListener('click', () => apply(l.code));
      box.appendChild(b);
    });
    document.body.appendChild(box);
  }

  window.BadLang = {
    get: () => current,
    set: apply,
    langs: LANGS.slice(),
    refresh: () => apply(current),
  };

  function boot() {
    buildSwitcher();
    apply(read());
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
