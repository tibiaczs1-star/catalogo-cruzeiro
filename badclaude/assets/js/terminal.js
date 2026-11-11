/* ============================================================
   TERMINAL — the page types itself like a command prompt.
   Headings and leads reveal character by character at the same
   time, with a caret and a soft keystroke sound.
   ============================================================ */

export class Terminal {
  constructor(opts = {}) {
    this.reduced = opts.reduced || false;
    this.sound = opts.sound ?? false;
    this.audio = null;
    this.running = new Set();
    this.done = new WeakSet();

    this.cps = 46;          // characters per second
    this.jitter = 0.55;     // rhythm variation

    if (this.sound) this._initAudio();
  }

  _initAudio() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      this.audio = new Ctx();
    } catch (e) {
      this.audio = null;
    }
  }

  /** A short, soft mechanical click. */
  _click() {
    if (!this.audio) return;
    const ctx = this.audio;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1500 + Math.random() * 700, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.02);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.012, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * Type an element's text. The element keeps its original text hidden
   * while a caret and the growing string are drawn in its place.
   */
  type(el) {
    if (this.reduced) return Promise.resolve();
    if (!el || this.done.has(el)) return Promise.resolve();

    const full = el.textContent || '';
    if (!full.trim()) return Promise.resolve();
    if (this.running.has(el)) return Promise.resolve();

    this.running.add(el);
    el.classList.add('typing');
    el.setAttribute('aria-label', full);

    // preserve line breaks from the original markup
    const lineBreaks = [];
    el.querySelectorAll('br').forEach((br) => {
      const before = br.previousSibling;
      if (before && before.nodeType === 3) {
        lineBreaks.push((before.textContent || '').length);
      }
    });

    const caret = document.createElement('span');
    caret.className = 'caret';
    caret.setAttribute('aria-hidden', 'true');

    const out = document.createElement('span');
    out.className = 'typed';
    out.setAttribute('aria-hidden', 'true');

    el.textContent = '';
    el.appendChild(out);
    el.appendChild(caret);

    const total = full.length;
    let i = 0;
    let lastSound = 0;

    return new Promise((resolve) => {
      const step = () => {
        i += 1 + Math.floor(Math.random() * 2);
        if (i > total) i = total;

        out.textContent = full.slice(0, i);

        if (this.sound && Math.random() < 0.7) {
          const now = performance.now();
          if (now - lastSound > 26) {
            this._click();
            lastSound = now;
          }
        }

        if (i < total) {
          const delay = (1000 / this.cps) * (0.6 + Math.random() * this.jitter * 2);
          // tiny pause on punctuation, like a person typing
          const ch = full[i - 1];
          const bump = /[.,;:!?]/.test(ch) ? 160 : 0;
          setTimeout(step, delay + bump);
        } else {
          caret.classList.add('is-done');
          el.classList.remove('typing');
          this.running.delete(el);
          this.done.add(el);
          setTimeout(() => {
            // leave the typed text in place; caret fades
            caret.remove();
            el.textContent = full;
          }, 420);
          resolve();
        }
      };

      setTimeout(step, 120);
    });
  }

  /** Type several elements at the same time, at slightly different rates. */
  typeAll(elements) {
    return Promise.all(Array.from(elements).map((el) => this.type(el)));
  }
}

try { window.TerminalType = Terminal; } catch (e) {}
