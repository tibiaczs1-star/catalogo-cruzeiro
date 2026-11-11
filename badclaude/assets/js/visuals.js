/* ============================================================
   VISUALS — every graphic on this page is drawn in code.
   No raster images anywhere: geometry, particles and light only.
   ============================================================ */

const TAU = Math.PI * 2;

function fitCanvas(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let rect = canvas.getBoundingClientRect();

  // absolutely-positioned canvases can report a stale box before layout settles;
  // fall back to the parent box, which is authoritative for them
  if (rect.width < 2 || rect.height < 2) {
    const parent = canvas.parentElement;
    if (parent) rect = parent.getBoundingClientRect();
  }

  const w = Math.max(240, Math.round(rect.width || canvas.clientWidth || 600));
  const h = Math.max(160, Math.round(rect.height || canvas.clientHeight || 400));
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h, dpr };
}

/* ============================================================
   Base scene: DPR, resize, visibility-gated RAF
   ============================================================ */

class SceneCanvas {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.opts = opts;
    this.visible = true;
    this.t = 0;
    this.last = 0;
    this.raf = null;
    this._resize();
    this._observer();
    this._loop = this._loop.bind(this);
    this.raf = requestAnimationFrame(this._loop);
  }

  _resize() {
    const fit = fitCanvas(this.canvas);
    this.ctx = fit.ctx;
    this.w = fit.w;
    this.h = fit.h;
    this.dpr = fit.dpr;
    if (this.onResize) this.onResize();
  }

  refit() { this._resize(); }

  _observer() {
    this._onResize = () => this._resize();
    window.addEventListener('resize', this._onResize, { passive: true });

    if ('IntersectionObserver' in window) {
      this.io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { this.visible = e.isIntersecting; });
      }, { rootMargin: '120px' });
      this.io.observe(this.canvas);
    }
  }

  _loop(now) {
    this.raf = requestAnimationFrame(this._loop);
    if (!this.visible) { this.last = now; return; }

    const dt = Math.min((now - (this.last || now)) / 1000, 0.05);
    this.last = now;
    this.t += dt;

    if (this.draw) this.draw(dt);
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this._onResize);
    if (this.io) this.io.disconnect();
  }
}

/* ============================================================
   1. HOLO CORE — a rotating wireframe solid, built from math
   Replaces the illustrated mascot card in the hero.
   ============================================================ */

export class HoloCore extends SceneCanvas {
  constructor(canvas) {
    super(canvas);
    this.rx = -0.42;
    this.ry = 0.3;
    this.rz = 0;

    // octahedron + inner cube, unit scale
    const s = 1;
    this.outer = [
      [0, s, 0], [s, 0, 0], [0, 0, s], [-s, 0, 0], [0, 0, -s], [0, -s, 0],
    ];
    this.outerEdges = [
      [0, 1], [0, 2], [0, 3], [0, 4],
      [5, 1], [5, 2], [5, 3], [5, 4],
      [1, 2], [2, 3], [3, 4], [4, 1],
    ];

    const c = 0.52;
    this.inner = [
      [-c, -c, -c], [c, -c, -c], [c, c, -c], [-c, c, -c],
      [-c, -c, c], [c, -c, c], [c, c, c], [-c, c, c],
    ];
    this.innerEdges = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7],
    ];

    this.pts = [];
    for (let i = 0; i < 90; i++) {
      const a = Math.random() * TAU;
      const r = 1.25 + Math.random() * 0.7;
      this.pts.push({ a, r, y: (Math.random() - 0.5) * 1.6, sp: 0.2 + Math.random() * 0.6 });
    }

    this.orbit = 0;
  }

  _project(p, cx, cy, scale) {
    // rotate Y then X
    const cosY = Math.cos(this.ry), sinY = Math.sin(this.ry);
    let x = p[0] * cosY - p[2] * sinY;
    let z = p[0] * sinY + p[2] * cosY;
    const cosX = Math.cos(this.rx), sinX = Math.sin(this.rx);
    let y = p[1] * cosX - z * sinX;
    z = p[1] * sinX + z * cosX;

    const persp = 2.9 / (2.9 + z);
    return {
      x: cx + x * scale * persp,
      y: cy + y * scale * persp,
      z,
      s: persp,
    };
  }

  draw(dt) {
    const { ctx, w, h } = this;
    const cx = w / 2, cy = h / 2;
    const scale = Math.min(w, h) * 0.30;

    ctx.clearRect(0, 0, w, h);

    this.ry += dt * 0.30;
    this.rx += dt * 0.11;
    this.orbit += dt * 0.6;

    // ambient bloom
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.55);
    glow.addColorStop(0, 'rgba(0,229,255,0.16)');
    glow.addColorStop(0.45, 'rgba(123,92,255,0.07)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // orbit rings
    ctx.save();
    ctx.translate(cx, cy);
    for (let i = 0; i < 3; i++) {
      const r = scale * (1.25 + i * 0.16);
      ctx.save();
      ctx.rotate(this.orbit * (i % 2 ? -0.6 : 0.6) + i * 1.1);
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.34, 0, 0, TAU);
      ctx.strokeStyle = i === 0
        ? 'rgba(0,229,255,0.42)'
        : i === 1 ? 'rgba(123,92,255,0.34)' : 'rgba(255,61,154,0.26)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    // outer solid
    const op = this.outer.map((p) => this._project(p, cx, cy, scale));
    op.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.1 + p.s * 1.2, 0, TAU);
      ctx.fillStyle = i === 0 ? '#00e5ff' : 'rgba(0,229,255,0.85)';
      ctx.fill();
    });

    ctx.lineWidth = 1.2;
    this.outerEdges.forEach(([a, b]) => {
      const p = op[a], q = op[b];
      const depth = (p.z + q.z) / 2;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(q.x, q.y);
      ctx.strokeStyle = depth > 0
        ? 'rgba(0,229,255,0.20)'
        : 'rgba(0,229,255,0.62)';
      ctx.stroke();
    });

    // inner cube
    const ip = this.inner.map((p) => this._project(p, cx, cy, scale));
    ctx.lineWidth = 1;
    this.innerEdges.forEach(([a, b]) => {
      const p = ip[a], q = ip[b];
      const depth = (p.z + q.z) / 2;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(q.x, q.y);
      ctx.strokeStyle = depth > 0
        ? 'rgba(123,92,255,0.18)'
        : 'rgba(123,92,255,0.55)';
      ctx.stroke();
    });

    // inner vertices shimmer
    ip.forEach((p, i) => {
      const pulse = 0.5 + 0.5 * Math.sin(this.t * 2 + i);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.4 + pulse * 1.1, 0, TAU);
      ctx.fillStyle = `rgba(255,255,255,${0.35 + pulse * 0.45})`;
      ctx.fill();
    });

    // orbiting motes
    this.pts.forEach((p) => {
      p.a += dt * p.sp;
      const x3 = Math.cos(p.a) * p.r;
      const z3 = Math.sin(p.a) * p.r;
      const q = this._project([x3, p.y, z3], cx, cy, scale);
      const a = 0.25 + 0.55 * Math.max(0, q.s - 0.4);
      ctx.beginPath();
      ctx.arc(q.x, q.y, 1.5 * q.s, 0, TAU);
      ctx.fillStyle = `rgba(160,225,255,${a})`;
      ctx.fill();
    });

    // scanline sweep
    const sy = ((this.t * 0.22) % 1) * h;
    const sg = ctx.createLinearGradient(0, sy - 45, 0, sy + 45);
    sg.addColorStop(0, 'rgba(0,229,255,0)');
    sg.addColorStop(0.5, 'rgba(0,229,255,0.10)');
    sg.addColorStop(1, 'rgba(0,229,255,0)');
    ctx.fillStyle = sg;
    ctx.fillRect(0, sy - 45, w, 90);

    // corner brackets
    this._brackets(ctx, w, h);
  }

  _brackets(ctx, w, h) {
    const m = 16, l = 20;
    ctx.strokeStyle = 'rgba(0,229,255,0.45)';
    ctx.lineWidth = 1;
    const corners = [
      [m, m, 1, 1], [w - m, m, -1, 1],
      [m, h - m, 1, -1], [w - m, h - m, -1, -1],
    ];
    corners.forEach(([x, y, dx, dy]) => {
      ctx.beginPath();
      ctx.moveTo(x, y + dy * l);
      ctx.lineTo(x, y);
      ctx.lineTo(x + dx * l, y);
      ctx.stroke();
    });
  }
}

/* ============================================================
   2. NODE FIELD — ambient agent network (section 01 backdrop)
   ============================================================ */

export class NodeField extends SceneCanvas {
  constructor(canvas, opts = {}) {
    super(canvas);
    this.count = opts.count || (window.innerWidth < 760 ? 22 : 38);
    this.nodes = [];
    this._build();
  }

  _build() {
    this.nodes = [];
    for (let i = 0; i < this.count; i++) {
      this.nodes.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: 1.4 + Math.random() * 2.4,
        hue: Math.random() < 0.55 ? 'cyan' : Math.random() < 0.6 ? 'violet' : 'magenta',
        phase: Math.random() * TAU,
      });
    }
  }

  onResize() { this._build(); }

  draw() {
    const { ctx, w, h } = this;
    ctx.clearRect(0, 0, w, h);

    const colors = {
      cyan: [0, 229, 255],
      violet: [123, 92, 255],
      magenta: [255, 61, 154],
    };

    const n = this.nodes;

    for (let i = 0; i < n.length; i++) {
      const a = n[i];
      a.x += a.vx;
      a.y += a.vy;
      if (a.x < 0 || a.x > w) a.vx *= -1;
      if (a.y < 0 || a.y > h) a.vy *= -1;

      for (let j = i + 1; j < n.length; j++) {
        const b = n[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        const max = Math.min(w, h) * 0.34;
        if (d < max) {
          const alpha = (1 - d / max) * 0.30;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(0,229,255,${alpha * 0.8})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }
    }

    n.forEach((p, i) => {
      const c = colors[p.hue];
      const pulse = 0.55 + 0.45 * Math.sin(this.t * 1.6 + p.phase);
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 7);
      g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${0.55 * pulse})`);
      g.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 7, 0, TAU);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${0.9})`;
      ctx.fill();
    });
  }
}

/* ============================================================
   3. FLOW FIELD — generative particle ribbons (section 02)
   ============================================================ */

export class FlowField extends SceneCanvas {
  constructor(canvas) {
    super(canvas);
    this.parts = [];
    const n = window.innerWidth < 760 ? 220 : 420;
    for (let i = 0; i < n; i++) {
      const p = this._spawn();
      p.x = Math.random() * this.w;
      p.y = Math.random() * this.h;
      this.parts.push(p);
    }
    this.ctx.lineCap = 'round';
  }

  _spawn() {
    const palette = ['#00e5ff', '#7b5cff', '#ff3d9a', '#ffffff'];
    return {
      x: Math.random() * this.w,
      y: Math.random() * this.h,
      life: Math.random(),
      speed: 0.5 + Math.random() * 1.4,
      color: palette[Math.floor(Math.random() * 3)],
      width: 0.5 + Math.random() * 1.3,
    };
  }

  draw(dt) {
    const { ctx, w, h } = this;
    // fade existing trails without painting an opaque background:
    // the panel behind the canvas must stay visible
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,0.10)';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';

    const scale = 0.0018;
    this.parts.forEach((p) => {
      const ang = (Math.sin(p.x * scale * 3 + this.t * 0.2)
        + Math.cos(p.y * scale * 2.2 - this.t * 0.15)) * Math.PI;

      const nx = p.x + Math.cos(ang) * p.speed;
      const ny = p.y + Math.sin(ang) * p.speed;

      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(nx, ny);
      ctx.strokeStyle = p.color;
      // additive strokes only: shadowBlur per particle destroys the frame budget
      ctx.globalAlpha = 0.22 + p.life * 0.42;
      ctx.lineWidth = p.width * 1.4;
      ctx.stroke();
      ctx.globalAlpha = 1;

      p.x = nx;
      p.y = ny;
      p.life -= dt * 0.06;

      if (p.life <= 0 || p.x < -10 || p.x > w + 10 || p.y < -10 || p.y > h + 10) {
        Object.assign(p, this._spawn(), { life: 1 });
      }
    });
    ctx.globalCompositeOperation = 'source-over';
  }
}

/* ============================================================
   4. PIPELINE GLOW — luminous automation lanes (section 03)
   ============================================================ */

export class PipelineGlow extends SceneCanvas {
  constructor(canvas) {
    super(canvas);
    this.lanes = [];
    const n = 6;
    for (let i = 0; i < n; i++) {
      this.lanes.push({
        y: 0.16 + (i / n) * 0.68,
        packets: Array.from({ length: 3 }, () => ({
          p: Math.random(),
          sp: 0.10 + Math.random() * 0.16,
        })),
        color: i % 3 === 0 ? '#00e5ff' : i % 3 === 1 ? '#7b5cff' : '#ff3d9a',
      });
    }
  }

  draw(dt) {
    const { ctx, w, h } = this;
    ctx.clearRect(0, 0, w, h);

    this.lanes.forEach((lane, idx) => {
      const y = lane.y * h;

      // lane base: a visible glowing conduit
      const path = (off) => {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 6) {
          const ny = y + Math.sin(x * 0.006 + this.t * 0.5 + idx) * 7 + off;
          x === 0 ? ctx.moveTo(x, ny) : ctx.lineTo(x, ny);
        }
      };

      path(0);
      ctx.strokeStyle = 'rgba(255,255,255,0.16)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // outer haze along the conduit
      ctx.save();
      ctx.shadowColor = lane.color;
      ctx.shadowBlur = 12;
      path(0);
      ctx.strokeStyle = lane.color;
      ctx.globalAlpha = 0.30;
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.restore();
      ctx.globalAlpha = 1;

      // stage markers along the lane
      for (let m = 1; m < 5; m++) {
        const mx = (m / 5) * w;
        const my = y + Math.sin(mx * 0.006 + this.t * 0.5 + idx) * 7;
        ctx.beginPath();
        ctx.rect(mx - 3, my - 3, 6, 6);
        ctx.fillStyle = 'rgba(4,6,10,0.9)';
        ctx.fill();
        ctx.strokeStyle = lane.color;
        ctx.globalAlpha = 0.75;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // travelling packets
      lane.packets.forEach((pk) => {
        pk.p += dt * pk.sp;
        if (pk.p > 1) pk.p = 0;
        const x = pk.p * w;
        const ny = y + Math.sin(x * 0.006 + this.t * 0.5 + idx) * 7;

        const g = ctx.createRadialGradient(x, ny, 0, x, ny, 26);
        g.addColorStop(0, lane.color);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, ny, 26, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.beginPath();
        ctx.arc(x, ny, 2.2, 0, TAU);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      });
    });
  }
}

/* ============================================================
   5. HOLO PANEL — scanline / data drift for the host frame
   ============================================================ */

export class HoloGrid extends SceneCanvas {
  constructor(canvas) {
    super(canvas);
    this.cols = 14;
    this.rows = 14;
    this.flares = Array.from({ length: 6 }, () => ({
      x: Math.random(), y: Math.random(),
      p: Math.random(),
    }));
  }

  draw(dt) {
    const { ctx, w, h } = this;
    ctx.clearRect(0, 0, w, h);

    const cw = w / this.cols;
    const ch = h / this.rows;

    ctx.strokeStyle = 'rgba(0,229,255,0.12)';
    ctx.lineWidth = 0.6;
    for (let i = 0; i <= this.cols; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cw, 0);
      ctx.lineTo(i * cw, h);
      ctx.stroke();
    }
    for (let j = 0; j <= this.rows; j++) {
      ctx.beginPath();
      ctx.moveTo(0, j * ch);
      ctx.lineTo(w, j * ch);
      ctx.stroke();
    }

    this.flares.forEach((f) => {
      f.p += dt * 0.35;
      if (f.p > 1) { f.p = 0; f.x = Math.random(); f.y = Math.random(); }
      const x = f.x * w;
      const y = f.y * h;
      const g = ctx.createRadialGradient(x, y, 0, x, y, Math.min(w, h) * 0.22);
      g.addColorStop(0, `rgba(0,229,255,${0.22 * (1 - f.p)})`);
      g.addColorStop(1, 'rgba(0,229,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });

    const sy = ((this.t * 0.18) % 1) * h;
    const sg = ctx.createLinearGradient(0, sy - 60, 0, sy + 60);
    sg.addColorStop(0, 'rgba(123,92,255,0)');
    sg.addColorStop(0.5, 'rgba(123,92,255,0.10)');
    sg.addColorStop(1, 'rgba(123,92,255,0)');
    ctx.fillStyle = sg;
    ctx.fillRect(0, sy - 60, w, 120);
  }
}

/* ============================================================
   Boot every visual declared in markup.
   A canvas opts in with data-visual="holo|nodes|flow|pipeline|grid".
   ============================================================ */

export function initVisuals() {
  const map = {
    holo: HoloCore,
    nodes: NodeField,
    flow: FlowField,
    pipeline: PipelineGlow,
    grid: HoloGrid,
  };

  const instances = [];
  document.querySelectorAll('canvas[data-visual]').forEach((canvas) => {
    const kind = canvas.dataset.visual;
    const Ctor = map[kind];
    if (!Ctor) return;
    try {
      instances.push(new Ctor(canvas));
      canvas.dataset.visualReady = '1';
    } catch (err) {
      console.warn('[visuals] failed', kind, err);
    }
  });

  // canvases measured before fonts/layout settle get one corrective pass
  const refitAll = () => instances.forEach((i) => i.refit());
  requestAnimationFrame(refitAll);
  window.addEventListener('load', refitAll, { once: true });
  setTimeout(refitAll, 400);

  return instances;
}