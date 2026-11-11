/* ============================================================
   GENESIS — the opening sequence
   The creature lands, bursts into a coloured agent swarm, the
   agents assemble ten miniature site builds on screen, and the
   visitor picks one. Then the chosen build opens full size.

   Everything is canvas and DOM. No images.
   ============================================================ */

const TAU = Math.PI * 2;

/* the ten builds the swarm assembles, with their signature colours */
export const BUILDS = [
  { id: '01', name: 'Papel Suíço',   bg: '#f2f1ee', fg: '#0a0a0a', acc: '#e3271c', kind: 'swiss' },
  { id: '02', name: 'Terminal',      bg: '#07100c', fg: '#c8f2d8', acc: '#42f58a', kind: 'terminal' },
  { id: '03', name: 'Editorial',     bg: '#f6efe3', fg: '#231a12', acc: '#7c2a24', kind: 'editorial' },
  { id: '04', name: 'Espacial',      bg: '#0b0d10', fg: '#eceff4', acc: '#6ee7ff', kind: 'spatial' },
  { id: '05', name: 'Brutalista',    bg: '#f0f0ec', fg: '#000000', acc: '#ff4d3d', kind: 'brutal' },
  { id: '06', name: 'Neon',          bg: '#06070d', fg: '#e8eefc', acc: '#00e5ff', kind: 'neon' },
  { id: '07', name: 'Tátil',         bg: '#e9e2d8', fg: '#2b241d', acc: '#c2683c', kind: 'clay' },
  { id: '08', name: 'Grid Técnico',  bg: '#ffffff', fg: '#111820', acc: '#111820', kind: 'grid' },
  { id: '09', name: 'Cinemático',    bg: '#07080a', fg: '#f2f2ef', acc: '#f5c518', kind: 'cine' },
  { id: '10', name: 'Kinetic',       bg: '#141414', fg: '#f5f5f2', acc: '#f5c518', kind: 'kinetic' },
];

/* ---------------- particle swarm ---------------- */

class Swarm {
  constructor(canvas, count = 900) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.count = count;
    this.parts = [];
    this.t = 0;
    this._resize();
    this._seed();
    this._onResize = () => { this._resize(); this._seed(); };
    window.addEventListener('resize', this._onResize, { passive: true });
  }

  _resize() {
    const r = this.canvas.getBoundingClientRect();
    this.w = Math.max(200, r.width || window.innerWidth);
    this.h = Math.max(200, r.height || window.innerHeight);
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  _seed() {
    const palette = ['#00e5ff', '#ff3d9a', '#f5c518', '#42f58a', '#a78bfa', '#ff6b3d', '#ffffff'];
    this.parts = [];
    for (let i = 0; i < this.count; i++) {
      const a = Math.random() * TAU;
      const r = Math.random() * Math.max(this.w, this.h) * 0.5;
      this.parts.push({
        x: this.w / 2 + Math.cos(a) * r,
        y: this.h / 2 + Math.sin(a) * r,
        vx: 0, vy: 0,
        tx: this.w / 2, ty: this.h / 2,
        s: 1 + Math.random() * 2,
        c: palette[i % palette.length],
        k: 0.035 + Math.random() * 0.05,
        ph: Math.random() * TAU,
      });
    }
  }

  /** Send every particle to a target point. */
  to(points) {
    if (!points || !points.length) return;
    const pool = points.slice();
    for (let i = pool.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    this.parts.forEach((p, i) => {
      const t = pool[i % pool.length];
      p.tx = t.x + (Math.random() - 0.5) * 2;
      p.ty = t.y + (Math.random() - 0.5) * 2;
    });
  }

  /** Explode outward from the centre. */
  burst(strength = 6) {
    this.parts.forEach((p) => {
      const a = Math.random() * TAU;
      const sp = strength * (0.4 + Math.random());
      p.vx += Math.cos(a) * sp;
      p.vy += Math.sin(a) * sp;
    });
  }

  /** Scatter to a ring of positions (used between beats). */
  scatter(radius = 0.4) {
    const pts = [];
    for (let i = 0; i < this.count; i++) {
      const a = (i / this.count) * TAU * 3;
      const r = Math.min(this.w, this.h) * radius * (0.6 + Math.random() * 0.6);
      pts.push({ x: this.w / 2 + Math.cos(a) * r, y: this.h / 2 + Math.sin(a) * r });
    }
    this.to(pts);
  }

  step() {
    this.t += 0.016;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);

    for (let i = 0; i < this.parts.length; i++) {
      const p = this.parts[i];
      p.vx += (p.tx - p.x) * p.k;
      p.vy += (p.ty - p.y) * p.k;
      p.vx *= 0.9;
      p.vy *= 0.9;
      p.x += p.vx;
      p.y += p.vy;

      const sh = 0.45 + 0.55 * Math.abs(Math.sin(this.t * 1.6 + p.ph));
      ctx.globalAlpha = 0.45 + sh * 0.55;
      ctx.fillStyle = p.c;
      const s = p.s * (0.7 + sh * 0.6);
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
  }

  destroy() { window.removeEventListener('resize', this._onResize); }
}

/* ---------------- build cards: a miniature site drawn in canvas ---------------- */

function drawBuildCard(ctx, x, y, w, h, build, t) {
  const b = build;
  ctx.save();
  ctx.translate(x, y);

  // paper
  ctx.fillStyle = b.bg;
  ctx.fillRect(0, 0, w, h);

  const pad = w * 0.07;

  // top bar
  ctx.fillStyle = b.fg;
  ctx.globalAlpha = 0.9;
  ctx.fillRect(pad, pad * 0.7, w * 0.13, h * 0.022);
  ctx.globalAlpha = 1;

  if (b.kind === 'terminal') {
    ctx.font = `${Math.max(4, w * 0.021)}px "JetBrains Mono", monospace`;
    ctx.fillStyle = b.acc;
    let yy = pad * 2.2;
    ['$ badclaude --about', '> eu me construí', '> 4 patas', '> online'].forEach((line, i) => {
      ctx.globalAlpha = 0.45 + 0.55 * Math.min(1, (t * 0.6 - i * 0.2));
      ctx.fillText(line, pad, yy);
      yy += h * 0.075;
    });
    ctx.globalAlpha = 1;
  } else if (b.kind === 'swiss' || b.kind === 'brutal' || b.kind === 'kinetic') {
    // giant headline bars
    ctx.fillStyle = b.fg;
    const sizes = [0.16, 0.13, 0.10];
    sizes.forEach((s, i) => {
      ctx.fillRect(pad, h * (0.24 + i * 0.17), w * (0.62 - i * 0.10), h * s * 0.42);
    });
    ctx.fillStyle = b.acc;
    ctx.fillRect(pad, h * (0.24 + 2 * 0.17), w * 0.32, h * 0.075);
    ctx.fillStyle = b.fg;
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 3; i++) ctx.fillRect(pad, h * (0.76 + i * 0.05), w * (0.5 - i * 0.08), h * 0.012);
    ctx.globalAlpha = 1;
  } else if (b.kind === 'editorial' || b.kind === 'clay') {
    // soft blocks
    ctx.fillStyle = b.fg;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(pad, h * 0.26, w * 0.58, h * 0.055);
    ctx.fillRect(pad, h * 0.36, w * 0.44, h * 0.045);
    ctx.globalAlpha = 1;
    ctx.fillStyle = b.acc;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(pad, h * 0.46, w * 0.28, h * 0.035);
    ctx.globalAlpha = 1;
    ctx.fillStyle = b.fg;
    ctx.globalAlpha = 0.28;
    for (let i = 0; i < 4; i++) ctx.fillRect(pad, h * (0.60 + i * 0.06), w * (0.5 - i * 0.06), h * 0.010);
    ctx.globalAlpha = 1;
  } else if (b.kind === 'spatial' || b.kind === 'neon') {
    // glowing orb + rings
    const cx = w * 0.66, cy = h * 0.44, r = w * 0.13;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.6);
    g.addColorStop(0, b.acc + 'cc');
    g.addColorStop(1, b.acc + '00');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = b.acc;
    ctx.globalAlpha = 0.55;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * (1 + i * 0.55), r * 0.38 * (1 + i * 0.55), t * 0.4 + i, 0, TAU);
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = b.fg;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(pad, h * 0.68, w * 0.42, h * 0.05);
    ctx.fillRect(pad, h * 0.78, w * 0.30, h * 0.035);
    ctx.globalAlpha = 1;
  } else if (b.kind === 'grid') {
    ctx.strokeStyle = b.fg;
    ctx.globalAlpha = 0.18;
    ctx.lineWidth = 0.6;
    for (let i = 1; i < 6; i++) {
      ctx.beginPath(); ctx.moveTo(w * i / 6, 0); ctx.lineTo(w * i / 6, h); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = b.fg;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(pad, pad, w * 0.35, h * 0.045);
    ctx.fillRect(pad, h * 0.22, w * 0.55, h * 0.03);
    ctx.fillRect(pad, h * 0.30, w * 0.48, h * 0.03);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = b.fg;
    ctx.globalAlpha = 0.3;
    ctx.strokeRect(w * 0.62, h * 0.2, w * 0.3, h * 0.42);
    ctx.globalAlpha = 1;
  } else if (b.kind === 'cine') {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h * 0.08);
    ctx.fillRect(0, h * 0.92, w, h * 0.08);
    ctx.fillStyle = b.fg;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(pad, h * 0.30, w * 0.55, h * 0.05);
    ctx.fillRect(pad, h * 0.40, w * 0.40, h * 0.045);
    ctx.globalAlpha = 0.45;
    ctx.fillRect(pad, h * 0.55, w * 0.5, h * 0.012);
    ctx.fillRect(pad, h * 0.60, w * 0.44, h * 0.012);
    ctx.globalAlpha = 1;
    ctx.fillStyle = b.acc;
    ctx.fillRect(pad, h * 0.70, w * 0.18, h * 0.035);
  }

  // a tiny creature mark in every card
  ctx.fillStyle = b.fg;
  ctx.globalAlpha = 0.9;
  const mr = w * 0.032;
  ctx.beginPath();
  ctx.ellipse(w - pad - mr, h - pad - mr, mr, mr * 0.9, 0, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.restore();
}

/* ---------------- the sequence ---------------- */

export class Genesis {
  constructor(root, opts = {}) {
    this.root = root;                   // container element
    this.onChoose = opts.onChoose || (() => {});
    this.reduced = opts.reduced || false;

    this.canvas = root.querySelector('canvas.gen-swarm');
    this.gridEl = root.querySelector('.gen-grid');
    this.copyEl = root.querySelector('.gen-copy');
    this.statusEl = root.querySelector('.gen-status');
    this.swarm = new Swarm(this.canvas, window.innerWidth < 760 ? 520 : 1000);

    this.cards = [];
    this.running = false;
    this.t = 0;
    this.raf = null;
    this.cardGeo = [];
  }

  /* ---- layout the ten thumbnails in a grid ---- */

  _layoutCards() {
    const r = this.gridEl.getBoundingClientRect();
    const cols = window.innerWidth < 760 ? 2 : 5;
    const rows = Math.ceil(BUILDS.length / cols);
    const gap = 10;
    const cw = (r.width - gap * (cols - 1)) / cols;
    const ch = cw * 0.68;

    this.cardGeo = BUILDS.map((b, i) => {
      const c = i % cols;
      const ro = Math.floor(i / cols);
      return {
        x: r.left + c * (cw + gap),
        y: r.top + ro * (ch + gap),
        w: cw,
        h: ch,
        build: b,
      };
    });
  }

  _renderCards(alpha = 1) {
    const ctx = this.canvas.getContext('2d');
    this.cardGeo.forEach((g) => {
      ctx.globalAlpha = alpha;
      drawBuildCard(ctx, g.x, g.y, g.w, g.h, g.build, this.t);
      ctx.globalAlpha = 1;

      // outline
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 1;
      ctx.strokeRect(g.x, g.y, g.w, g.h);
    });
  }

  /* ---- beat helpers ---- */

  say(text) {
    if (this.statusEl) this.statusEl.textContent = text;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._layoutCards();
    this.say('inicializando enxame');

    const ctx = this.canvas.getContext('2d');

    let phase = 0;
    const beats = [
      { at: 0.0,  fn: () => { this.say('01 · o mascote chega'); } },
      { at: 1.2,  fn: () => { this.say('02 · o enxame desperta'); this.swarm.burst(9); } },
      { at: 2.4,  fn: () => {
          this.say('03 · agentes em formação');
          const pts = [];
          this.cardGeo.forEach((g) => {
            for (let i = 0; i < 60; i++) {
              pts.push({ x: g.x + Math.random() * g.w, y: g.y + Math.random() * g.h });
            }
          });
          this.swarm.to(pts);
        } },
      { at: 4.2,  fn: () => { this.say('04 · 10 builds prontos'); this.root.classList.add('show-cards'); } },
      { at: 5.4,  fn: () => { this.say('05 · escolha o seu'); this.root.classList.add('ready'); this._bindPick(); } },
    ];

    const startT = performance.now();

    const loop = () => {
      this.raf = requestAnimationFrame(loop);
      this.t = (performance.now() - startT) / 1000;

      this.swarm.step();

      // cards fade in progressively after beat 4
      const shown = this.root.classList.contains('show-cards');
      if (shown) {
        this._renderCards(1);
      } else {
        // while forming, draw faint ghosts so the target is visible
        this._renderCards(0.12);
      }

      while (phase < beats.length && this.t >= beats[phase].at) {
        beats[phase].fn();
        phase++;
      }
    };
    loop();
  }

  _bindPick() {
    if (this._bound) return;
    this._bound = true;

    this.canvas.style.pointerEvents = 'auto';
    this.canvas.addEventListener('pointermove', (e) => {
      const r = this.canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      let hover = null;
      this.cardGeo.forEach((g) => {
        if (x > g.x && x < g.x + g.w && y > g.y && y < g.y + g.h) hover = g;
      });
      this.canvas.style.cursor = hover ? 'pointer' : 'default';
    });

    this.canvas.addEventListener('click', (e) => {
      const r = this.canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      this.cardGeo.forEach((g) => {
        if (x > g.x && x < g.x + g.w && y > g.y && y < g.y + g.h) {
          this.pick(g.build);
        }
      });
    });
  }

  pick(build) {
    if (this.picked) return;
    this.picked = true;
    this.say(`abrindo ${build.name}`);
    this.root.classList.add('picked', `pick-${build.id}`);

    // swarm converges to the chosen card, then the page hands over
    const target = this.cardGeo.find((g) => g.build.id === build.id);
    if (target) {
      const pts = [];
      for (let i = 0; i < 400; i++) {
        pts.push({ x: target.x + Math.random() * target.w, y: target.y + Math.random() * target.h });
      }
      this.swarm.to(pts);
    }

    setTimeout(() => this.onChoose(build), 900);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.swarm.destroy();
  }
}

try { window.Genesis = Genesis; window.BUILDS = BUILDS; } catch (e) { /* ignore */ }