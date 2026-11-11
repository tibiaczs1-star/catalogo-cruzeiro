/* ============================================================
   PARTICLE TYPE — wordmarks drawn with thousands of points
   Renders to a canvas 2D overlay, independent of the WebGL scene
   so it works even when 3D is disabled.
   ============================================================ */

export class ParticleType {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.text = opts.text || 'MOTION';
    this.palette = opts.palette || ['#00e5ff', '#7b5cff', '#ff3d9a', '#ffffff'];
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.particles = [];
    this.t = 0;
    this.raf = null;
    this.assembling = false;

    this._resize();
    this._onResize = () => { this._resize(); this._build(); };
    window.addEventListener('resize', this._onResize, { passive: true });

    this._build();
    this._loop = this._loop.bind(this);
    this.raf = requestAnimationFrame(this._loop);
  }

  _resize() {
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  _sample(text) {
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d', { willReadFrequently: true });
    const size = Math.min(this.w * 0.9, 1500);
    c.width = Math.round(size);
    c.height = Math.round(size * 0.42);

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, c.width, c.height);

    // fit text
    let fontSize = c.height * 0.72;
    ctx.font = `700 ${fontSize}px "Space Grotesk", Arial, sans-serif`;
    let m = ctx.measureText(text).width;
    if (m > c.width * 0.92) {
      fontSize *= (c.width * 0.92) / m;
      ctx.font = `700 ${fontSize}px "Space Grotesk", Arial, sans-serif`;
      m = ctx.measureText(text).width;
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';

    const spacing = fontSize * 0.04;
    const chars = [...text];
    const widths = chars.map((ch) => ctx.measureText(ch).width + spacing);
    const total = widths.reduce((a, b) => a + b, 0);
    let x = (c.width - total) / 2;
    chars.forEach((ch, i) => {
      ctx.fillText(ch, x + widths[i] / 2 - spacing / 2, c.height / 2);
      x += widths[i];
    });

    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    const pts = [];
    const step = Math.max(2, Math.round(c.width / 420));
    for (let y = 0; y < c.height; y += step) {
      for (let px = 0; px < c.width; px += step) {
        if (data[(y * c.width + px) * 4] > 120) {
          pts.push({
            x: (px - c.width / 2) * 0.62,
            y: (y - c.height / 2) * 0.62,
            g: (px / c.width), // gradient position 0..1
          });
        }
      }
    }
    return pts;
  }

  _colorAt(g) {
    // cyan -> violet -> magenta -> white edge
    const stops = this.palette;
    const idx = Math.min(stops.length - 1, Math.floor(g * stops.length));
    return stops[idx];
  }

  _build() {
    const pts = this._sample(this.text);
    if (!pts.length) return;

    const target = Math.min(4000, Math.max(1200, Math.round(pts.length * 0.75)));
    this.particles = [];
    for (let i = 0; i < target; i++) {
      const p = pts[Math.floor(Math.random() * pts.length)];
      const ang = Math.random() * Math.PI * 2;
      const dist = 260 + Math.random() * Math.max(this.w, this.h) * 0.9;
      this.particles.push({
        cx: this.w / 2, cy: this.h / 2,
        tx: this.w / 2 + p.x,
        ty: this.h / 2 + p.y,
        x: this.w / 2 + Math.cos(ang) * dist,
        y: this.h / 2 + Math.sin(ang) * dist,
        vx: 0, vy: 0,
        color: this._colorAt(p.g),
        r: 0.7 + Math.random() * 1.5,
        delay: (p.g * 0.5 + Math.random() * 0.5),
        phase: Math.random() * Math.PI * 2,
      });
    }
    this.assembled = 0;
  }

  /** Fire the assembly animation. */
  assemble() {
    this.assembling = false;
    this.t = 0;
    this.particles.forEach((p) => {
      p.x = p.cx + (Math.random() - 0.5) * 40;
      p.y = p.cy + (Math.random() - 0.5) * 40;
      p.vx = (Math.random() - 0.5) * 2;
      p.vy = (Math.random() - 0.5) * 2;
    });
    // need a frame before turning on so the scatter shows
    requestAnimationFrame(() => {
      this.assembling = true;
    });
  }

  dissolve() {
    this.particles.forEach((p) => {
      const ang = Math.random() * Math.PI * 2;
      p.vx += Math.cos(ang) * 6;
      p.vy += Math.sin(ang) * 6;
    });
    this.assembling = false;
  }

  setText(t) {
    this.text = t;
    this._build();
  }

  _loop() {
    this.raf = requestAnimationFrame(this._loop);
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);

    this.t += 0.016;
    let settled = 0;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      if (this.assembling) {
        const ramp = Math.min(1, Math.max(0, (this.t - p.delay * 0.9) / 0.6));
        const ease = 1 - Math.pow(1 - ramp, 3);
        if (ease > 0) {
          const dx = p.tx + Math.sin(this.t * 0.8 + p.phase) * 0.7 - p.x;
          const dy = p.ty + Math.cos(this.t * 0.7 + p.phase) * 0.7 - p.y;
          p.x += dx * 0.055 * (0.4 + ease);
          p.y += dy * 0.055 * (0.4 + ease);
          if (Math.abs(dx) < 1.4 && Math.abs(dy) < 1.4) settled++;
        }
      } else {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;
      }

      const glow = 0.35 + 0.65 * Math.abs(Math.sin(this.t * 1.1 + p.phase));
      ctx.globalAlpha = glow * (this.assembling ? 0.95 : 0.55);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.r, p.r);
    }

    ctx.globalAlpha = 1;
    if (this.assembling && settled > this.particles.length * 0.985) {
      // fully assembled; keep the shimmer
      this.assembled = 1;
    }
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this._onResize);
  }
}