/* ============================================================
   DATA FACE — a profile silhouette built from particles, code
   bands and film strips. Pure canvas, no images.
   ============================================================ */

const TAU = Math.PI * 2;

/* A profile head path, normalised 0..1, drawn with beziers.
   Points inside it are found with a scanline fill test. */
const PROFILE = [
  // top of skull, forehead, nose, lips, chin, neck, shoulders
  [0.28, 0.06], [0.42, 0.02], [0.56, 0.04], [0.66, 0.12],
  [0.70, 0.22], [0.70, 0.31], [0.66, 0.37],
  [0.72, 0.42], [0.76, 0.47], [0.70, 0.50],
  [0.68, 0.53], [0.72, 0.55], [0.68, 0.58],
  [0.66, 0.62], [0.62, 0.66], [0.58, 0.68],
  [0.54, 0.70], [0.52, 0.76], [0.50, 0.86],
  [0.34, 0.90], [0.18, 0.96], [0.10, 1.00],
  [0.10, 0.62], [0.16, 0.46], [0.20, 0.30],
  [0.22, 0.16],
];

export class DataFace {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.t = 0;
    this.raf = null;
    this.visible = true;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.hue = opts.hue || 'day';
    this.pts = [];
    this.bands = [];
    this.strip = [];
    this.rand = mulberry(20261111);

    this._resize();
    this._build();

    this._onResize = () => { this._resize(); this._build(); };
    window.addEventListener('resize', this._onResize, { passive: true });

    if ('IntersectionObserver' in window) {
      this.io = new IntersectionObserver((es) => {
        es.forEach((e) => { this.visible = e.isIntersecting; });
      }, { rootMargin: '150px' });
      this.io.observe(canvas);
    }

    this._loop = this._loop.bind(this);
    this.raf = requestAnimationFrame(this._loop);
  }

  _resize() {
    const r = this.canvas.getBoundingClientRect();
    const w = Math.max(240, Math.round(r.width || 520));
    const h = Math.max(240, Math.round(r.height || 620));
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.w = w;
    this.h = h;
  }

  /** Point-in-polygon at a given y, returns [xIn, xOut]. */
  _span(y) {
    const ys = PROFILE.map((p) => p[1]);
    const xs = PROFILE.map((p) => p[0]);
    const hits = [];
    for (let i = 0, j = PROFILE.length - 1; i < PROFILE.length; j = i++) {
      const yi = ys[i], yj = ys[j];
      if ((yi > y) !== (yj > y)) {
        const t = (y - yi) / (yj - yi);
        hits.push(xs[i] + t * (xs[j] - xs[i]));
      }
    }
    if (hits.length < 2) return null;
    hits.sort((a, b) => a - b);
    return [hits[0], hits[hits.length - 1]];
  }

  _build() {
    const n = this.w < 600 ? 1500 : 3200;
    this.pts = [];
    let guard = 0;

    while (this.pts.length < n && guard < n * 40) {
      guard++;
      const y = this.rand();
      const span = this._span(y);
      if (!span) continue;
      const x = span[0] + this.rand() * (span[1] - span[0]);
      // denser toward the edge for a carved look
      const edge = Math.min(x - span[0], span[1] - x) / Math.max(0.001, span[1] - span[0]);
      if (edge < 0.10 && this.rand() > 0.45) continue;

      this.pts.push({
        x, y,
        s: 0.7 + this.rand() * 1.6,
        a: 0.25 + this.rand() * 0.75,
        ph: this.rand() * TAU,
        band: Math.floor(this.rand() * 5),
      });
    }

    // horizontal data bands, like the reference film strips
    this.bands = [];
    for (let i = 0; i < 9; i++) {
      this.bands.push({
        y: 0.08 + i * 0.095 + this.rand() * 0.02,
        h: 0.018 + this.rand() * 0.030,
        speed: (this.rand() > 0.5 ? 1 : -1) * (0.004 + this.rand() * 0.012),
        off: this.rand(),
        kind: i % 3,
      });
    }

    // floating code glyph rows
    this.code = [];
    for (let i = 0; i < 26; i++) {
      this.code.push({
        y: this.rand(),
        x: this.rand(),
        len: 4 + Math.floor(this.rand() * 12),
        sp: 0.01 + this.rand() * 0.05,
        a: 0.10 + this.rand() * 0.3,
      });
    }
  }

  _palette() {
    // daytime: ink, cyan, coral, mint, amber — same family as the site
    return ['#0d1116', '#00b8c8', '#ff3b4a', '#34d399', '#ffb020', '#8b95a3'];
  }

  _loop(now) {
    this.raf = requestAnimationFrame(this._loop);
    if (!this.visible) return;

    this.t += 0.016;
    const { ctx, w, h } = this;

    ctx.clearRect(0, 0, w, h);

    const pal = this._palette();
    const S = Math.min(w, h);

    /* ---- silhouette particles ---- */
    for (let i = 0; i < this.pts.length; i++) {
      const p = this.pts[i];
      const y = p.y * h;
      const span = this._span(p.y);

      // points drift inside the silhouette and wrap
      const drift = Math.sin(this.t * 0.5 + p.ph) * 0.0025;
      let x = (p.x + drift) * w;

      if (span) {
        const x0 = span[0] * w;
        const x1 = span[1] * w;
        if (x < x0 || x > x1) x = ((x - x0) % Math.max(1, x1 - x0)) + x0;
      }

      const shimmer = 0.35 + 0.65 * Math.abs(Math.sin(this.t * 1.1 + p.ph));
      const col = pal[(p.band + 1) % pal.length];

      ctx.globalAlpha = p.a * shimmer * 0.9;
      ctx.fillStyle = col;
      const s = p.s * (0.7 + shimmer * 0.7);
      ctx.fillRect(x, y, s, s);
    }

    ctx.globalAlpha = 1;

    /* ---- data bands across the face ---- */
    this.bands.forEach((b, bi) => {
      b.off = (b.off + b.speed * 0.016 + 1) % 1;
      const y = b.y * h;
      const span = this._span(b.y);
      if (!span) return;

      const x0 = span[0] * w;
      const x1 = span[1] * w;
      const bh = b.h * h;

      ctx.save();
      ctx.beginPath();
      ctx.rect(x0, y, x1 - x0, bh);
      ctx.clip();

      const g = ctx.createLinearGradient(x0, y, x1, y + bh);
      if (b.kind === 0) {
        g.addColorStop(0, 'rgba(0,184,200,0.55)');
        g.addColorStop(0.6, 'rgba(13,17,22,0.75)');
        g.addColorStop(1, 'rgba(255,59,74,0.45)');
      } else if (b.kind === 1) {
        g.addColorStop(0, 'rgba(52,211,153,0.40)');
        g.addColorStop(0.5, 'rgba(13,17,22,0.8)');
        g.addColorStop(1, 'rgba(0,184,200,0.5)');
      } else {
        g.addColorStop(0, 'rgba(255,176,32,0.45)');
        g.addColorStop(0.55, 'rgba(13,17,22,0.8)');
        g.addColorStop(1, 'rgba(139,149,163,0.4)');
      }
      ctx.fillStyle = g;
      ctx.fillRect(x0, y, x1 - x0, bh);

      // film perforations
      const cell = bh * 0.55;
      const step = cell * 2.1;
      const shift = b.off * step;
      ctx.fillStyle = 'rgba(247,245,240,0.55)';
      for (let x = x0 - step + shift; x < x1 + step; x += step) {
        ctx.fillRect(x, y + bh * 0.18, cell * 0.6, cell * 0.55);
      }

      // scan line through the band
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(x0, y + bh * 0.48, x1 - x0, 0.7);

      ctx.restore();
    });

    /* ---- drifting code rows ---- */
    ctx.font = `${Math.max(7, S * 0.016)}px "JetBrains Mono", monospace`;
    ctx.textAlign = 'left';
    this.code.forEach((c) => {
      c.x = (c.x + c.sp * 0.016) % 1.2;
      const y = c.y * h;
      const span = this._span(c.y);
      if (!span) return;
      const x = span[0] * w + c.x * 0.35 * w;
      if (x > span[1] * w) return;

      const str = Array.from({ length: c.len }, (_, i) =>
        '01{}[]<>/\\|=+-*&^%$#'[(i * 7 + Math.floor(this.t * 2) + c.len) % 21]
      ).join('');

      ctx.globalAlpha = c.a * (0.5 + 0.5 * Math.sin(this.t * 2 + c.y * 9));
      ctx.fillStyle = '#0d1116';
      ctx.fillText(str, x, y);
    });
    ctx.globalAlpha = 1;

    /* ---- outline trace ---- */
    ctx.beginPath();
    PROFILE.forEach(([px, py], i) => {
      const X = px * w;
      const Y = py * h;
      i === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y);
    });
    ctx.closePath();
    ctx.strokeStyle = 'rgba(13,17,22,0.22)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this._onResize);
    if (this.io) this.io.disconnect();
  }
}

/* deterministic PRNG so the silhouette is stable across reloads */
function mulberry(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

try { window.DataFace = DataFace; } catch (e) {}