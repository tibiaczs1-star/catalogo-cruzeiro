/* ============================================================
   SWARM MORPH
   A particle field that lives as the mascot, breaks into code,
   writes the section headings as agents, and reassembles.
   ============================================================ */

const TAU = Math.PI * 2;

export class SwarmMorph {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.reduced = opts.reduced || false;

    this.particles = [];
    this.targets = null;
    this.homes = null;        // mascot silhouette targets
    this.mode = 'mascot';     // mascot | writing | return
    this.writeProgress = 0;
    this.t = 0;
    this.raf = null;

    this.colors = ['#00b8c8', '#0d1116', '#ff3b4a', '#34d399', '#ffb020', '#8b95a3'];
    this.colorPool = [];

    this._resize();
    this._seed();
    this._onResize = () => { this._resize(); this._seed(); };
    window.addEventListener('resize', this._onResize, { passive: true });

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

  /* ---------- particle budget ---------- */

  _count() {
    if (this.w < 700) return 700;
    if (this.w < 1200) return 1400;
    return 2600;
  }

  _seed() {
    const n = this._count();
    this.particles = [];
    this.colorPool = [];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU;
      const r = Math.random() * Math.max(this.w, this.h) * 0.6;
      this.particles.push({
        x: this.w / 2 + Math.cos(a) * r,
        y: this.h / 2 + Math.sin(a) * r,
        vx: 0, vy: 0,
        tx: this.w / 2,
        ty: this.h / 2,
        size: 1.0 + Math.random() * 1.6,
        color: this.colors[i % this.colors.length],
        phase: Math.random() * TAU,
        speed: 0.045 + Math.random() * 0.05,
      });
      this.colorPool.push(i % this.colors.length);
    }
  }

  /* ---------- silhouette sampling ---------- */

  /** Rasterize the mascot SVG and return dark-pixel points in viewport space. */
  sampleMascot(svgEl, rect) {
    const box = 260;
    const c = document.createElement('canvas');
    c.width = box;
    c.height = box;
    const cx = c.getContext('2d', { willReadFrequently: true });

    const clone = svgEl.cloneNode(true);
    clone.setAttribute('width', box);
    clone.setAttribute('height', box);
    const xml = new XMLSerializer().serializeToString(clone);
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        cx.drawImage(img, 0, 0, box, box);
        const data = cx.getImageData(0, 0, box, box).data;
        const pts = [];
        for (let y = 0; y < box; y += 2) {
          for (let x = 0; x < box; x += 2) {
            const i = (y * box + x) * 4;
            const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const alpha = data[i + 3];
            if (alpha > 60 && lum < 120) pts.push([x / box, y / box]);
          }
        }
        resolve(pts.map(([nx, ny]) => ({
          x: rect.left + nx * rect.width,
          y: rect.top + ny * rect.height,
        })));
      };
      img.onerror = () => resolve([]);
      img.src = url;
    });
  }

  /** Sample a heading as text points, in viewport coordinates. */
  sampleText(el) {
    const rect = el.getBoundingClientRect();
    // use the text nodes only (innerText adds layout whitespace)
    const raw = el.textContent || '';
    const lines = raw.split(String.fromCharCode(10)).map((l) => l.trim()).filter(Boolean);
    const text = lines.length ? lines : [raw.trim()];
    if (!text.join('').length) return [];

    const pad = 24;
    const W = Math.max(320, Math.ceil(rect.width + pad * 2));
    const H = Math.max(80, Math.ceil(rect.height + pad * 2));

    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const cx = c.getContext('2d', { willReadFrequently: true });
    cx.clearRect(0, 0, W, H);
    cx.fillStyle = '#000';
    cx.textBaseline = 'top';
    cx.textAlign = 'left';

    const serif = getComputedStyle(el).fontFamily || 'serif';
    // fit the largest line into the box
    let size = Math.floor(rect.height / Math.max(1, text.length) * 1.02);
    cx.font = `400 ${size}px ${serif}`;
    let widest = Math.max(...text.map((t) => cx.measureText(t).width));
    if (widest > W - pad * 2) {
      size = Math.floor(size * ((W - pad * 2) / widest));
      cx.font = `400 ${size}px ${serif}`;
      widest = Math.max(...text.map((t) => cx.measureText(t).width));
    }

    const lineH = size * 1.06;
    const totalH = lineH * text.length;
    const startY = (H - totalH) / 2 + size * 0.08;

    text.forEach((line, i) => {
      cx.fillText(line, pad, startY + i * lineH);
    });

    const data = cx.getImageData(0, 0, W, H).data;
    const pts = [];
    const step = 3;
    for (let y = 0; y < H; y += step) {
      for (let x = 0; x < W; x += step) {
        if (data[(y * W + x) * 4 + 3] > 120) {
          pts.push({
            x: rect.left - pad + x,
            y: rect.top - pad + y,
          });
        }
      }
    }
    return pts;
  }

  /* ---------- state transitions ---------- */

  setHomes(points) {
    if (!points.length) return;
    this.homes = points;
    if (this.mode === 'mascot') this._applyTargets(points);
  }

  /** Fly to a set of points (or back home). */
  morphTo(points, mode = 'writing') {
    if (!points || !points.length) return;
    this.mode = mode;
    this._applyTargets(points);
  }

  returnHome() {
    if (!this.homes || !this.homes.length) return;
    this.mode = 'mascot';
    this._applyTargets(this.homes);
  }

  _applyTargets(points) {
    const n = this.particles.length;
    // shuffle so the same particle does not always take the same slot
    const pool = points.slice();
    for (let i = pool.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    for (let i = 0; i < n; i++) {
      const p = pool[i % pool.length];
      const jitter = 1.6;
      this.particles[i].tx = p.x + (Math.random() - 0.5) * jitter;
      this.particles[i].ty = p.y + (Math.random() - 0.5) * jitter;
    }
  }

  /** A short burst, used when the mascot breathes out. */
  burst(fromX, fromY, count = 90) {
    for (let i = 0; i < count; i++) {
      const p = this.particles[(Math.random() * this.particles.length) | 0];
      const a = -0.35 + (Math.random() - 0.5) * 1.5;
      const sp = 3 + Math.random() * 7;
      p.x = fromX;
      p.y = fromY;
      p.vx = Math.cos(a) * sp;
      p.vy = Math.sin(a) * sp;
    }
  }

  setVisible(v) {
    this.visible = v;
  }

  /* ---------- loop ---------- */

  _loop() {
    this.raf = requestAnimationFrame(this._loop);
    if (this.reduced) return;

    this.t += 0.016;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);

    if (this.visible === false) return;

    ctx.globalCompositeOperation = 'source-over';

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // steering with a little inertia
      p.vx += (p.tx - p.x) * p.speed;
      p.vy += (p.ty - p.y) * p.speed;
      p.vx *= 0.86;
      p.vy *= 0.86;

      p.x += p.vx;
      p.y += p.vy;

      // shimmer
      const shimmer = 0.45 + 0.55 * Math.abs(Math.sin(this.t * 1.4 + p.phase));
      ctx.globalAlpha = 0.55 + shimmer * 0.45;
      ctx.fillStyle = p.color;
      const s = p.size * (0.8 + shimmer * 0.6);
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }

    ctx.globalAlpha = 1;
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this._onResize);
  }
}

// expose for the classic script in main.js
try { window.SwarmMorph = SwarmMorph; } catch (e) {}
