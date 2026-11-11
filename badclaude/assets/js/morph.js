/* ============================================================
   MORPH STAGE
   One geometry engine, several silhouettes: the mascot breaks
   into parts, becomes an agent swarm, a car, a plane, a cartoon
   face, then reassembles. All shapes are Path2D, no images.
   ============================================================ */

const TAU = Math.PI * 2;

/* ---------- silhouette builders (normalised 0..1 boxes) ---------- */

function pathFrom(draw, w, h) {
  const p = new Path2D();
  draw(p, w, h);
  return p;
}

const SHAPES = {
  /* profile head, drawn as one continuous outline */
  face: (p, w, h) => {
    p.moveTo(0.30 * w, 0.06 * h);
    p.bezierCurveTo(0.44 * w, 0.00 * h, 0.62 * w, 0.02 * h, 0.70 * w, 0.14 * h);
    p.bezierCurveTo(0.76 * w, 0.23 * h, 0.74 * w, 0.32 * h, 0.70 * w, 0.38 * h);
    p.bezierCurveTo(0.68 * w, 0.41 * h, 0.74 * w, 0.44 * h, 0.80 * w, 0.48 * h);
    p.bezierCurveTo(0.83 * w, 0.50 * h, 0.80 * w, 0.52 * h, 0.75 * w, 0.535 * h);
    p.bezierCurveTo(0.72 * w, 0.545 * h, 0.72 * w, 0.565 * h, 0.745 * w, 0.585 * h);
    p.bezierCurveTo(0.70 * w, 0.60 * h, 0.70 * w, 0.63 * h, 0.68 * w, 0.655 * h);
    p.bezierCurveTo(0.65 * w, 0.69 * h, 0.60 * w, 0.70 * h, 0.56 * w, 0.71 * h);
    p.bezierCurveTo(0.55 * w, 0.78 * h, 0.54 * w, 0.86 * h, 0.53 * w, 0.94 * h);
    p.bezierCurveTo(0.40 * w, 0.97 * h, 0.22 * w, 0.99 * h, 0.14 * w, 1.00 * h);
    p.bezierCurveTo(0.13 * w, 0.86 * h, 0.163 * w, 0.70 * h, 0.185 * w, 0.58 * h);
    p.bezierCurveTo(0.20 * w, 0.47 * h, 0.215 * w, 0.34 * h, 0.215 * w, 0.24 * h);
    p.bezierCurveTo(0.22 * w, 0.15 * h, 0.24 * w, 0.09 * h, 0.30 * w, 0.06 * h);
    p.closePath();
  },

  car: (p, w, h) => {
    const b = 0.66 * h;     // body line
    p.moveTo(0.08 * w, b);
    p.bezierCurveTo(0.08 * w, 0.52 * h, 0.14 * w, 0.48 * h, 0.22 * w, 0.47 * h);
    p.lineTo(0.30 * w, 0.47 * h);
    p.bezierCurveTo(0.34 * w, 0.32 * h, 0.44 * w, 0.24 * h, 0.56 * w, 0.24 * h);
    p.bezierCurveTo(0.66 * w, 0.24 * h, 0.73 * w, 0.31 * h, 0.775 * w, 0.47 * h);
    p.lineTo(0.86 * w, 0.50 * h);
    p.bezierCurveTo(0.92 * w, 0.52 * h, 0.93 * w, 0.60 * h, 0.92 * w, b);
    p.lineTo(0.84 * w, b);
    p.bezierCurveTo(0.84 * w, 0.76 * h, 0.78 * w, 0.79 * h, 0.73 * w, 0.79 * h);
    p.bezierCurveTo(0.68 * w, 0.79 * h, 0.63 * w, 0.76 * h, 0.63 * w, b);
    p.lineTo(0.37 * w, b);
    p.bezierCurveTo(0.37 * w, 0.76 * h, 0.31 * w, 0.79 * h, 0.26 * w, 0.79 * h);
    p.bezierCurveTo(0.21 * w, 0.79 * h, 0.16 * w, 0.76 * h, 0.16 * w, b);
    p.closePath();
  },

  plane: (p, w, h) => {
    // top-down jet silhouette
    p.moveTo(0.50 * w, 0.10 * h);
    p.bezierCurveTo(0.545 * w, 0.10 * h, 0.575 * w, 0.22 * h, 0.585 * w, 0.42 * h);
    p.lineTo(0.88 * w, 0.56 * h);
    p.lineTo(0.88 * w, 0.62 * h);
    p.lineTo(0.585 * w, 0.56 * h);
    p.lineTo(0.575 * w, 0.72 * h);
    p.lineTo(0.68 * w, 0.80 * h);
    p.lineTo(0.68 * w, 0.845 * h);
    p.lineTo(0.53 * w, 0.80 * h);
    p.lineTo(0.52 * w, 0.90 * h);
    p.lineTo(0.48 * w, 0.90 * h);
    p.lineTo(0.47 * w, 0.80 * h);
    p.lineTo(0.32 * w, 0.845 * h);
    p.lineTo(0.32 * w, 0.80 * h);
    p.lineTo(0.425 * w, 0.72 * h);
    p.lineTo(0.415 * w, 0.56 * h);
    p.lineTo(0.12 * w, 0.62 * h);
    p.lineTo(0.12 * w, 0.56 * h);
    p.lineTo(0.415 * w, 0.42 * h);
    p.bezierCurveTo(0.425 * w, 0.22 * h, 0.455 * w, 0.10 * h, 0.50 * w, 0.10 * h);
    p.closePath();
  },

  bot: (p, w, h) => {
    // the mascot silhouette: rounded square + stubs, used for the return
    const r = 0.16 * w;
    const x = 0.18 * w, y = 0.16 * h, ww = 0.64 * w, hh = 0.68 * h;
    p.moveTo(x + r, y);
    p.arcTo(x + ww, y, x + ww, y + hh, r);
    p.arcTo(x + ww, y + hh, x, y + hh, r);
    p.arcTo(x, y + hh, x, y, r);
    p.arcTo(x, y, x + ww, y, r);
    p.closePath();
    // stubs
    const s = 0.09 * w;
    [[x + 0.06 * w, y - s * 0.9], [x + ww - 0.15 * w, y - s * 0.9],
     [x + 0.06 * w, y + hh - s * 0.1], [x + ww - 0.15 * w, y + hh - s * 0.1]]
      .forEach(([sx, sy]) => {
        p.moveTo(sx, sy + 0.02 * h);
        p.rect(sx, sy, s, s);
      });
  },

  /* a small agent drone: triangle with a ring */
  agent: (p, w, h) => {
    const cx = 0.5 * w, cy = 0.5 * h, r = 0.20 * Math.min(w, h);
    p.moveTo(cx, cy - r);
    p.lineTo(cx + r * 0.9, cy + r * 0.7);
    p.lineTo(cx - r * 0.9, cy + r * 0.7);
    p.closePath();
  },
};

export class MorphStage {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.t = 0;
    this.mode = 'bot';
    this.phase = 0;
    this.raf = null;
    this.visible = true;
    this.reduced = opts.reduced || false;
    this.onMode = opts.onMode || (() => {});

    this.parts = [];
    this.count = window.innerWidth < 760 ? 1400 : 2600;
    this.colors = ['#0d1116', '#00b8c8', '#ff3b4a', '#34d399', '#ffb020'];

    this._resize();
    this._sample('bot');
    this._seed();

    this._onResize = () => { this._resize(); this._sample(this.mode); };
    window.addEventListener('resize', this._onResize, { passive: true });

    if ('IntersectionObserver' in window) {
      this.io = new IntersectionObserver((es) => {
        es.forEach((e) => { this.visible = e.isIntersecting; });
      }, { rootMargin: '140px' });
      this.io.observe(canvas);
    }

    this._loop = this._loop.bind(this);
    this.raf = requestAnimationFrame(this._loop);
  }

  _resize() {
    const r = this.canvas.getBoundingClientRect();
    const w = Math.max(260, Math.round(r.width || 620));
    const h = Math.max(260, Math.round(r.height || 620));
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.w = w;
    this.h = h;
  }

  /* ---------- sample a shape into target points ---------- */

  _sample(name) {
    const draw = SHAPES[name] || SHAPES.bot;
    const path = pathFrom(draw, this.w, this.h);
    this.path = path;
    this.shapeName = name;

    // isPointInPath only sees the *area* of the path. Shapes built with
    // moveTo/lineTo are open outlines, so we test against a region path.
    const region = new Path2D();
    const w = this.w, h = this.h;

    if (name === 'car') {
      // body with a rounded, tapered cabin so it reads as a car
      region.rect(0.09 * w, 0.50 * h, 0.82 * w, 0.26 * h);
      region.moveTo(0.26 * w, 0.50 * h);
      region.bezierCurveTo(0.31 * w, 0.36 * h, 0.40 * w, 0.30 * h, 0.52 * w, 0.30 * h);
      region.bezierCurveTo(0.63 * w, 0.30 * h, 0.70 * w, 0.37 * h, 0.755 * w, 0.50 * h);
      region.closePath();
      // wheels
      region.ellipse(0.255 * w, 0.755 * h, 0.075 * w, 0.052 * h, 0, 0, Math.PI * 2);
      region.ellipse(0.745 * w, 0.755 * h, 0.075 * w, 0.052 * h, 0, 0, Math.PI * 2);
    } else if (name === 'plane') {
      region.rect(0.42 * w, 0.10 * h, 0.16 * w, 0.80 * h);       // fuselage
      region.rect(0.10 * w, 0.50 * h, 0.80 * w, 0.12 * h);       // wings
      region.rect(0.30 * w, 0.78 * h, 0.40 * w, 0.07 * h);       // tail
    } else if (name === 'face') {
      // use the real outline so the profile stays a profile
      region.addPath(path);
    } else {
      region.addPath(path);
    }

    this.region = region;

    const probes = this.count * 5;
    const pts = [];
    let guard = 0;

    while (pts.length < this.count && guard < probes) {
      guard++;
      // bias sampling to the outline for a technical look
      const edge = Math.random() < 0.34;
      const x = Math.random() * this.w;
      const y = Math.random() * this.h;

      if (!this.ctx.isPointInPath(this.region, x, y)) continue;

      if (edge) {
        // keep only points near the border
        let near = false;
        for (let a = 0; a < 8; a++) {
          const ang = (a / 8) * TAU;
          const d = 6;
          if (!this.ctx.isPointInPath(this.region, x + Math.cos(ang) * d, y + Math.sin(ang) * d)) {
            near = true;
            break;
          }
        }
        if (!near) continue;
      }

      pts.push({ x, y });
    }

    this.targets = pts.length ? pts : [{ x: this.w / 2, y: this.h / 2 }];
  }

  _seed() {
    this.parts = [];
    for (let i = 0; i < this.count; i++) {
      const t = this.targets[i % this.targets.length];
      const a = Math.random() * TAU;
      const r = Math.random() * Math.max(this.w, this.h) * 0.7;
      this.parts.push({
        x: this.w / 2 + Math.cos(a) * r,
        y: this.h / 2 + Math.sin(a) * r,
        vx: 0, vy: 0,
        tx: t.x, ty: t.y,
        s: 0.8 + Math.random() * 1.7,
        c: this.colors[i % this.colors.length],
        ph: Math.random() * TAU,
        k: 0.045 + Math.random() * 0.05,
      });
    }
  }

  /** Morph to a named shape. */
  morph(name) {
    if (this.reduced) return;
    this._sample(name);
    this.mode = name;
    this.onMode(name);

    const pool = this.targets.slice();
    for (let i = pool.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    this.parts.forEach((p, i) => {
      const t = pool[i % pool.length];
      p.tx = t.x + (Math.random() - 0.5) * 2.4;
      p.ty = t.y + (Math.random() - 0.5) * 2.4;
    });
  }

  /** Scatter outward, used as the "explode" beat. */
  explode() {
    this.parts.forEach((p) => {
      const a = Math.random() * TAU;
      const sp = 2 + Math.random() * 7;
      p.vx += Math.cos(a) * sp;
      p.vy += Math.sin(a) * sp;
    });
  }

  _loop() {
    this.raf = requestAnimationFrame(this._loop);
    if (!this.visible || this.reduced) return;

    this.t += 0.016;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);

    for (let i = 0; i < this.parts.length; i++) {
      const p = this.parts[i];
      p.vx += (p.tx - p.x) * p.k;
      p.vy += (p.ty - p.y) * p.k;
      p.vx *= 0.87;
      p.vy *= 0.87;
      p.x += p.vx;
      p.y += p.vy;

      const sh = 0.4 + 0.6 * Math.abs(Math.sin(this.t * 1.5 + p.ph));
      ctx.globalAlpha = 0.35 + sh * 0.6;
      ctx.fillStyle = p.c;
      const s = p.s * (0.7 + sh * 0.7);
      ctx.fillRect(p.x, p.y, s, s);
    }
    ctx.globalAlpha = 1;

    // outline trace of the current shape
    ctx.save();
    ctx.strokeStyle = 'rgba(0,184,200,0.28)';
    ctx.lineWidth = 1.1;
    ctx.stroke(this.path);
    ctx.restore();
  }

  /* ---------- the show: bot -> swarm -> car -> plane -> bot ---------- */

  play(sequence = ['bot', 'swarm', 'car', 'plane', 'bot'], beat = 3400) {
    if (this.reduced) return;
    let i = 0;
    const step = () => {
      const name = sequence[i % sequence.length];
      if (name === 'swarm') {
        this.explode();
        setTimeout(() => this.morph('face'), 520);
      } else {
        this.morph(name);
      }
      i++;
      if (i < sequence.length) setTimeout(step, beat);
      else setTimeout(() => this.play(sequence, beat), beat);
    };
    step();
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this._onResize);
    if (this.io) this.io.disconnect();
  }
}

try { window.MorphStage = MorphStage; } catch (e) {}