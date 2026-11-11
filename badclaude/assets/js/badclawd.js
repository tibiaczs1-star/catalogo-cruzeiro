/* ============================================================
   BADCLAWD v2 — creature with paws
   A small quadruped: low rounded body, two ear bumps, four thick
   paws planted on the ground, large dark eyes. Drawn entirely in
   canvas, animated by a two-bone IK per leg so it can step, sit,
   rear up and point.

   This is an original creature inspired by the shape language of
   small terminal mascots — not a copy of anyone's logo.
   ============================================================ */

const TAU = Math.PI * 2;

const V = {
  sub: (a, b) => ({ x: a.x - b.x, y: a.y - b.y }),
  len: (a) => Math.hypot(a.x, a.y),
  norm: (a) => { const l = Math.hypot(a.x, a.y) || 1; return { x: a.x / l, y: a.y / l }; },
};

function solveIK(root, target, l1, l2, bend = 1) {
  const d = V.sub(target, root);
  let dist = V.len(d);
  dist = Math.min(Math.max(dist, Math.abs(l1 - l2) + 0.01), l1 + l2 - 0.01);
  const dir = V.norm(d);
  const a = (l1 * l1 - l2 * l2 + dist * dist) / (2 * l1 * dist);
  const angle = Math.acos(Math.min(1, Math.max(-1, a)));
  const base = Math.atan2(dir.y, dir.x);
  const ja = base + angle * bend;
  return {
    joint: { x: root.x + Math.cos(ja) * l1, y: root.y + Math.sin(ja) * l1 },
    end: { x: root.x + dir.x * dist, y: root.y + dir.y * dist },
  };
}

const VARIANTS = {
  ink:     { body:'#16120f', belly:'#241d18', eye:'#f7f3ec', pupil:'#16120f', accent:'#d9563a' },
  solid:   { body:'#0f1216', belly:'#1a1f26', eye:'#f7f5f0', pupil:'#0f1216', accent:'#ff4d3d' },
  outline: { body:'transparent', belly:'transparent', eye:'#0f1216', pupil:'transparent', accent:'#ff4d3d' },
  paper:   { body:'#15181c', belly:'#252a31', eye:'#ffffff', pupil:'#15181c', accent:'#c8102e' },
  neon:    { body:'#0b0f14', belly:'#10202b', eye:'#00e5ff', pupil:'#0b0f14', accent:'#ff3d9a' },
  clay:    { body:'#3a2f26', belly:'#4a3b30', eye:'#fff6e9', pupil:'#3a2f26', accent:'#e8a15a' },
  light:   { body:'#f7f4ee', belly:'#ebe6dc', eye:'#1b1b1b', pupil:'#f7f4ee', accent:'#c8102e' },
  block:   { body:'#111111', belly:'#1e1e1e', eye:'#ffffff', pupil:'#111111', accent:'#f5c518' },
};

export class BadClawd {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.variant = opts.variant || 'ink';
    this.pal = VARIANTS[this.variant] || VARIANTS.ink;
    this.accent = opts.accent || this.pal.accent;
    this.strokeWidth = opts.strokeWidth ?? 2.6;

    this.state = 'idle';
    this.t = 0;
    this.blink = 0;
    this.blinkAt = 2.4;
    this.pointer = null;
    this.gaze = { x: 0, y: 0 };
    this.gazeTarget = { x: 0, y: 0 };
    this.walkPhase = 0;
    this.facing = 1;
    this.rear = 0;              // 0..1 rear-up amount for 'alert'
    this.raf = null;
    this.visible = true;

    this._resize();
    this._onResize = () => this._resize();
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
    const w = Math.max(120, Math.round(r.width || 400));
    const h = Math.max(120, Math.round(r.height || 400));
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.w = w;
    this.h = h;
    this.u = Math.min(w, h) / 100;
  }

  setState(s) { this.state = s; }
  pointAt(x, y) {
    this.pointer = { x, y };
    const cx = this.w / 2;
    this.facing = x < cx ? -1 : 1;
  }
  clearPoint() { this.pointer = null; }

  destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this._onResize);
    if (this.io) this.io.disconnect();
  }

  _loop() {
    this.raf = requestAnimationFrame(this._loop);
    if (!this.visible) return;

    const dt = 0.016;
    this.t += dt;

    this.blinkAt -= dt;
    if (this.blinkAt <= 0) { this.blink = 1; this.blinkAt = 2.4 + Math.random() * 3.6; }
    this.blink = Math.max(0, this.blink - dt * 5);

    if (this.state === 'walk') this.walkPhase += dt * 7;
    const rearTarget = this.state === 'alert' ? 1 : this.state === 'sit' ? 0.15 : 0;
    this.rear += (rearTarget - this.rear) * 0.08;

    if (this.pointer) {
      const cx = this.w / 2, cy = this.h * 0.45;
      const dx = this.pointer.x - cx, dy = this.pointer.y - cy;
      const l = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, l / 200);
      this.gazeTarget.x = (dx / l) * k * 1.15;
      this.gazeTarget.y = (dy / l) * k * 1.15;
    } else {
      this.gazeTarget.x = Math.sin(this.t * 0.45) * 0.34;
      this.gazeTarget.y = Math.cos(this.t * 0.36) * 0.14;
    }
    this.gaze.x += (this.gazeTarget.x - this.gaze.x) * 0.1;
    this.gaze.y += (this.gazeTarget.y - this.gaze.y) * 0.1;

    this.ctx.clearRect(0, 0, this.w, this.h);
    this._draw();
  }

  _geo() {
    const u = this.u;
    const bob = this.state === 'walk' ? Math.sin(this.walkPhase * 2) * 1.1 * u : Math.sin(this.t * 1.5) * 0.6 * u;
    const rise = -this.rear * 9 * u;
    const sitDrop = this.state === 'sit' ? 5 * u : 0;

    const cx = this.w / 2;
    const groundY = this.h * 0.72;
    const bodyY = groundY - 18 * u + bob + rise + sitDrop;

    return {
      u, cx, groundY, bodyY,
      bodyW: 40 * u,
      bodyH: 24 * u,
      leg1: 10 * u,
      leg2: 9 * u,
    };
  }

  _draw() {
    const g = this._geo();
    const ctx = this.ctx;
    const p = this.pal;

    // ---- shadow on the ground
    ctx.save();
    ctx.globalAlpha = 0.13;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(g.cx, g.groundY + 3 * g.u, g.bodyW * 0.62, 5 * g.u, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    this._legs(ctx, g);
    this._body(ctx, g);
    if (this.state === 'point' && this.pointer) this._pointPaw(ctx, g);
  }

  /* ---------- legs: four paws, front pair slightly shorter ---------- */

  _legs(ctx, g) {
    const { u, cx, groundY, bodyY, bodyW, bodyH, leg1, leg2 } = g;
    const p = this.pal;
    const seated = this.state === 'sit';

    // x offsets, splayed outward like a small quadruped
    const hips = [
      { x: cx - bodyW * 0.32, y: bodyY + bodyH * 0.30, out: -1, phase: 0,      front: false },
      { x: cx - bodyW * 0.14, y: bodyY + bodyH * 0.38, out: -1, phase: Math.PI, front: true },
      { x: cx + bodyW * 0.14, y: bodyY + bodyH * 0.38, out:  1, phase: 0,      front: true },
      { x: cx + bodyW * 0.32, y: bodyY + bodyH * 0.30, out:  1, phase: Math.PI, front: false },
    ];

    hips.forEach((hip, i) => {
      const sp = this.walkPhase + hip.phase;
      const stepping = this.state === 'walk';
      const lift = stepping ? Math.max(0, Math.sin(sp)) * 5 * u : 0;
      const swing = stepping ? Math.cos(sp) * 4.5 * u : 0;

      let tx = hip.x + swing + hip.out * 3 * u;
      let ty = groundY - lift;

      // when seated, rear legs tuck under and front legs stay planted
      if (seated) {
        if (hip.front) { ty = groundY - 1 * u; }
        else { tx = hip.x + hip.out * 1 * u; ty = groundY - 5 * u; }
      }

      const bend = hip.out > 0 ? 1 : -1;
      const { joint, end } = solveIK(hip, { x: tx, y: ty }, leg1, leg2, bend);

      // leg
      ctx.beginPath();
      ctx.moveTo(hip.x, hip.y);
      ctx.quadraticCurveTo(joint.x, joint.y, end.x, end.y);
      ctx.strokeStyle = this.variant === 'outline' ? p.eye : p.body;
      ctx.lineWidth = 7.5 * u;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // paw: a small rounded pad, slightly wider than the leg
      const pawW = 8.6 * u;
      const pawH = 5.2 * u;
      ctx.beginPath();
      ctx.ellipse(end.x, end.y - pawH * 0.15, pawW / 2, pawH / 2, 0, 0, TAU);
      ctx.fillStyle = this.variant === 'outline' ? p.eye : p.body;
      ctx.fill();

      // toe split, only on solid variants
      if (this.variant !== 'outline') {
        ctx.beginPath();
        ctx.moveTo(end.x, end.y - pawH * 0.45);
        ctx.lineTo(end.x, end.y + pawH * 0.18);
        ctx.strokeStyle = p.belly;
        ctx.lineWidth = 1.1 * u;
        ctx.stroke();
      }
    });
  }

  /* ---------- body ---------- */

  _body(ctx, g) {
    const { u, cx, bodyY, bodyW, bodyH } = g;
    const p = this.pal;
    const w = bodyW, hh = bodyH;

    ctx.save();
    ctx.translate(cx, bodyY);
    ctx.scale(this.facing, 1);

    // ears
    const earY = -hh * 0.62;
    [-1, 1].forEach((s) => {
      ctx.beginPath();
      ctx.moveTo(s * w * 0.30, earY + hh * 0.10);
      ctx.quadraticCurveTo(s * w * 0.40, earY - hh * 0.16, s * w * 0.44, earY + hh * 0.22);
      ctx.closePath();
      ctx.fillStyle = this.variant === 'outline' ? 'transparent' : p.body;
      if (this.variant === 'outline') {
        ctx.strokeStyle = p.eye; ctx.lineWidth = this.strokeWidth * u; ctx.stroke();
      } else ctx.fill();
    });

    // main body: a low, rounded loaf
    ctx.beginPath();
    ctx.moveTo(-w * 0.50, -hh * 0.10);
    ctx.bezierCurveTo(-w * 0.52, -hh * 0.58, -w * 0.30, -hh * 0.74, 0, -hh * 0.74);
    ctx.bezierCurveTo(w * 0.30, -hh * 0.74, w * 0.52, -hh * 0.58, w * 0.50, -hh * 0.10);
    ctx.bezierCurveTo(w * 0.50, hh * 0.32, w * 0.28, hh * 0.52, 0, hh * 0.52);
    ctx.bezierCurveTo(-w * 0.28, hh * 0.52, -w * 0.50, hh * 0.32, -w * 0.50, -hh * 0.10);
    ctx.closePath();

    if (this.variant === 'outline') {
      ctx.strokeStyle = p.eye;
      ctx.lineWidth = this.strokeWidth * u;
      ctx.lineJoin = 'round';
      ctx.stroke();
    } else {
      ctx.fillStyle = p.body;
      ctx.fill();
      // soft inner rim so the body reads as a volume
      ctx.strokeStyle = p.belly;
      ctx.lineWidth = 1.6 * u;
      ctx.globalAlpha = 0.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // belly patch
    if (this.variant !== 'outline') {
      ctx.beginPath();
      ctx.ellipse(0, hh * 0.22, w * 0.22, hh * 0.20, 0, 0, TAU);
      ctx.fillStyle = p.belly;
      ctx.globalAlpha = 0.55;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    this._face(ctx, w, hh, u);

    // collar dot
    if (this.variant !== 'outline') {
      ctx.beginPath();
      ctx.arc(0, hh * 0.30, 2.4 * u, 0, TAU);
      ctx.fillStyle = this.accent;
      ctx.fill();
    }

    ctx.restore();
  }

  _face(ctx, w, hh, u) {
    const p = this.pal;
    const eyeY = -hh * 0.22;
    const eyeR = 5.6 * u;
    const gap = w * 0.20;

    const narrow = this.state === 'alert' ? 0.55 : 1;
    const open = Math.max(0.05, 1 - this.blink) * narrow;

    [-1, 1].forEach((s) => {
      const ex = gap * s;

      if (this.variant === 'outline') {
        ctx.beginPath();
        ctx.arc(ex, eyeY, eyeR, 0, TAU);
        ctx.strokeStyle = p.eye;
        ctx.lineWidth = this.strokeWidth * u;
        ctx.stroke();
        return;
      }

      ctx.save();
      ctx.translate(ex, eyeY);
      ctx.scale(1, open);

      ctx.beginPath();
      ctx.arc(0, 0, eyeR, 0, TAU);
      ctx.fillStyle = p.eye;
      ctx.fill();

      const px = this.gaze.x * eyeR * 0.45;
      const py = this.gaze.y * eyeR * 0.45;
      ctx.beginPath();
      ctx.arc(px, py, eyeR * 0.50, 0, TAU);
      ctx.fillStyle = p.pupil;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(px - eyeR * 0.18, py - eyeR * 0.22, eyeR * 0.14, 0, TAU);
      ctx.fillStyle = p.eye;
      ctx.fill();
      ctx.restore();
    });

    // a small brow line gives the face intent
    if (this.variant !== 'outline') {
      ctx.strokeStyle = p.belly;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1.2 * u;
      [-1, 1].forEach((s) => {
        ctx.beginPath();
        ctx.moveTo(gap * s - eyeR * 0.8, eyeY - eyeR * 1.5);
        ctx.lineTo(gap * s + eyeR * 0.8, eyeY - eyeR * 1.5);
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
    }
  }

  _pointPaw(ctx, g) {
    const { u, cx, bodyY, bodyW, bodyH } = g;
    const hip = { x: cx + bodyW * 0.34 * this.facing, y: bodyY + bodyH * 0.34 };
    const { joint, end } = solveIK(hip, this.pointer, 13 * u, 11 * u, this.facing);

    ctx.beginPath();
    ctx.moveTo(hip.x, hip.y);
    ctx.quadraticCurveTo(joint.x, joint.y, end.x, end.y);
    ctx.strokeStyle = this.pal.body === 'transparent' ? this.pal.eye : this.pal.body;
    ctx.lineWidth = 7 * u;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(end.x, end.y, 4 * u, 0, TAU);
    ctx.fillStyle = this.accent;
    ctx.fill();
  }
}

try { window.BadClawd = BadClawd; } catch (e) { /* ignore */ }