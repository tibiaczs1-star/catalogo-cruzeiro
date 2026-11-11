/* ============================================================
   BADCLAUDE — mascote oficial (bonequinho pirata)
   Desenhado em canvas, a partir do ícone oficial:
   corpo quadrado preto arredondado, bandana vermelha com
   caveirinha e ponta pendurada, olho esquerdo em X vermelho,
   olho direito ciano brilhante, braços e pernas curtos,
   aura ciano e cérebro rosa ao lado.
   Estados: idle · run · point · jump · wave
   ============================================================ */

const TAU = Math.PI * 2;

function rr(ctx, x, y, w, h, r) {
  const k = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, k);
}

export class Pirata {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.accent = opts.accent || '#22d3ee';
    this.bandana = opts.bandana || '#e11d2e';
    this.brain = opts.brain !== false;

    this.state = 'idle';
    this.t = 0;
    this.phase = 0;
    this.gaze = { x: 0, y: 0 };
    this.gazeTarget = { x: 0, y: 0 };
    this.pointer = null;
    this.pointArm = 0;
    this.runAmount = 0;
    this.raf = null;
    this.visible = true;

    this._resize();
    this._onResize = () => this._resize();
    window.addEventListener('resize', this._onResize, { passive: true });
    if ('IntersectionObserver' in window) {
      this.io = new IntersectionObserver((es) => es.forEach((e) => { this.visible = e.isIntersecting; }), { rootMargin: '160px' });
      this.io.observe(canvas);
    }
    this._loop = this._loop.bind(this);
    this.raf = requestAnimationFrame(this._loop);
  }

  _resize() {
    const r = this.canvas.getBoundingClientRect();
    const w = Math.max(60, Math.round(r.width || this.canvas.clientWidth || 120));
    const h = Math.max(50, Math.round(r.height || this.canvas.clientHeight || 100));
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.w = w;
    this.h = h;
    this.u = Math.min(w / 100, h / 92);
  }

  setState(s) { this.state = s; }

  pointAt(x, y) {
    this.pointer = { x, y };
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

    const running = this.state === 'run';
    this.runAmount += ((running ? 1 : 0) - this.runAmount) * 0.12;
    const pointing = this.state === 'point';
    this.pointArm += ((pointing ? 1 : 0) - this.pointArm) * 0.14;
    if (running) this.phase += dt * 15;

    if (this.pointer) {
      const cx = this.w / 2, cy = this.h * 0.45;
      const dx = this.pointer.x - cx, dy = this.pointer.y - cy;
      const l = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, l / 180);
      this.gazeTarget.x = (dx / l) * k;
      this.gazeTarget.y = (dy / l) * k;
    } else {
      this.gazeTarget.x = Math.sin(this.t * 0.7) * 0.35;
      this.gazeTarget.y = Math.cos(this.t * 0.5) * 0.12;
    }
    this.gaze.x += (this.gazeTarget.x - this.gaze.x) * 0.12;
    this.gaze.y += (this.gazeTarget.y - this.gaze.y) * 0.12;

    this._draw();
  }

  _draw() {
    const ctx = this.ctx;
    const { w, h, u } = this;
    ctx.clearRect(0, 0, w, h);

    const bob = Math.sin(this.t * 2.2) * 0.9 * u
      + this.runAmount * Math.abs(Math.sin(this.phase)) * -3.2 * u;
    const tilt = this.runAmount * Math.sin(this.phase * 0.5) * 0.045
      + Math.sin(this.t * 1.1) * 0.012;

    const cx = w / 2;
    const body = 46 * u;
    const bx = cx - body / 2;
    const by = h * 0.30 + bob;

    // aura ciano
    ctx.save();
    const grd = ctx.createRadialGradient(cx, by + body * 0.5, body * 0.2, cx, by + body * 0.5, body * 1.05);
    grd.addColorStop(0, 'rgba(34,211,238,.20)');
    grd.addColorStop(1, 'rgba(34,211,238,0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(cx, by + body * 0.5, body * 1.05, 0, TAU);
    ctx.fill();
    ctx.restore();

    // sombra no chão
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(cx, h * 0.93, body * 0.55, 4.5 * u, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(cx, by + body * 0.5);
    ctx.rotate(tilt);
    ctx.translate(-cx, -(by + body * 0.5));

    // cérebro rosa (atrás, à direita)
    if (this.brain) {
      this._brain(ctx, bx + body + 3 * u, by + body * 0.56, u);
    }

    // pernas
    const legY = by + body - 2 * u;
    const legSwing = Math.sin(this.phase) * 6 * u * this.runAmount;
    ctx.strokeStyle = '#0b0b0d';
    ctx.lineCap = 'round';
    ctx.lineWidth = 7.5 * u;
    [-1, 1].forEach((s) => {
      const off = s * 11 * u;
      const sw = s * legSwing;
      ctx.beginPath();
      ctx.moveTo(cx + off, legY);
      ctx.lineTo(cx + off + sw, legY + 9 * u - Math.max(0, s * Math.sin(this.phase)) * 3 * u * this.runAmount);
      ctx.stroke();
    });

    // braço esquerdo (parado)
    ctx.strokeStyle = '#0b0b0d';
    ctx.lineWidth = 7 * u;
    ctx.beginPath();
    ctx.moveTo(bx, by + body * 0.60);
    ctx.lineTo(bx - 8 * u, by + body * 0.78);
    ctx.stroke();

    // corpo
    ctx.save();
    const bg = ctx.createLinearGradient(bx, by, bx + body, by + body);
    bg.addColorStop(0, '#141417');
    bg.addColorStop(1, '#08080a');
    ctx.fillStyle = bg;
    rr(ctx, bx, by, body, body, 11 * u);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,93,58,.55)';
    ctx.lineWidth = 1.4 * u;
    ctx.stroke();
    ctx.restore();

    // faixa branca fina entre os olhos (detalhe do ícone)
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = '#d9d9dc';
    ctx.lineWidth = 1.1 * u;
    ctx.beginPath();
    ctx.moveTo(cx - 1 * u, by + 6 * u);
    ctx.lineTo(cx - 1 * u, by + body * 0.52);
    ctx.stroke();
    ctx.restore();

    // olho esquerdo — X vermelho
    const eyeY = by + body * 0.38;
    const exL = bx + body * 0.32;
    ctx.save();
    ctx.strokeStyle = this.bandana;
    ctx.lineWidth = 3 * u;
    ctx.lineCap = 'round';
    const xr = 8 * u;
    ctx.beginPath();
    ctx.moveTo(exL - xr / 2, eyeY - xr / 2);
    ctx.lineTo(exL + xr / 2, eyeY + xr / 2);
    ctx.moveTo(exL + xr / 2, eyeY - xr / 2);
    ctx.lineTo(exL - xr / 2, eyeY + xr / 2);
    ctx.stroke();
    ctx.restore();

    // olho direito — lente ciano brilhante
    const exR = bx + body * 0.68;
    const lensR = 8 * u;
    ctx.save();
    const lg = ctx.createRadialGradient(exR, eyeY, lensR * 0.2, exR, eyeY, lensR);
    lg.addColorStop(0, '#c9faff');
    lg.addColorStop(0.55, '#37d6ef');
    lg.addColorStop(1, '#0891b2');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.arc(exR, eyeY, lensR, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(200,250,255,.9)';
    ctx.lineWidth = 1.6 * u;
    ctx.stroke();
    // pupila que segue o cursor
    ctx.fillStyle = '#04181d';
    const pr = lensR * 0.34;
    ctx.beginPath();
    ctx.arc(exR + this.gaze.x * lensR * 0.36, eyeY + this.gaze.y * lensR * 0.36, pr, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#e8feff';
    ctx.beginPath();
    ctx.arc(exR - lensR * 0.3, eyeY - lensR * 0.34, lensR * 0.16, 0, TAU);
    ctx.fill();
    ctx.restore();

    // boca
    ctx.save();
    ctx.strokeStyle = '#f08c2e';
    ctx.lineWidth = 1.8 * u;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const mouthY = by + body * 0.70;
    const smile = this.state === 'point' || this.state === 'run' ? 3.2 : 1.7;
    ctx.moveTo(cx - 4 * u, mouthY);
    ctx.quadraticCurveTo(cx, mouthY + smile * u, cx + 4 * u, mouthY);
    ctx.stroke();
    ctx.restore();

    // bandana vermelha
    ctx.save();
    const banaH = body * 0.30;
    const byTop = by - 2 * u;
    ctx.fillStyle = this.bandana;
    ctx.beginPath();
    ctx.moveTo(bx - 2 * u, byTop + banaH * 0.62);
    ctx.quadraticCurveTo(cx, byTop - banaH * 0.5, bx + body + 2 * u, byTop + banaH * 0.62);
    ctx.lineTo(bx + body + 2 * u, byTop + banaH);
    ctx.quadraticCurveTo(cx, byTop + banaH + 7 * u, bx - 2 * u, byTop + banaH);
    ctx.closePath();
    ctx.fill();
    // dobra escura
    ctx.fillStyle = 'rgba(0,0,0,.22)';
    ctx.beginPath();
    ctx.moveTo(bx - 2 * u, byTop + banaH);
    ctx.quadraticCurveTo(cx, byTop + banaH + 7 * u, bx + body + 2 * u, byTop + banaH);
    ctx.lineTo(bx + body + 2 * u, byTop + banaH + 2.5 * u);
    ctx.quadraticCurveTo(cx, byTop + banaH + 9.5 * u, bx - 2 * u, byTop + banaH + 2.5 * u);
    ctx.closePath();
    ctx.fill();
    // ponta pendurada
    const flutter = Math.sin(this.t * 4 + this.phase) * (1.2 + this.runAmount * 2.4) * u;
    ctx.fillStyle = this.bandana;
    ctx.beginPath();
    ctx.moveTo(bx - 1 * u, byTop + banaH * 0.4);
    ctx.quadraticCurveTo(bx - 12 * u + flutter, byTop + banaH + 8 * u, bx - 8 * u + flutter, byTop + banaH + 17 * u);
    ctx.quadraticCurveTo(bx - 4 * u + flutter * 0.5, byTop + banaH + 9 * u, bx + 2 * u, byTop + banaH * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // caveirinha na bandana
    ctx.save();
    const skX = cx, skY = byTop + banaH * 0.46;
    const sk = 3.4 * u;
    ctx.fillStyle = '#f7f4ee';
    ctx.beginPath();
    ctx.arc(skX, skY, sk, Math.PI, 0);
    ctx.lineTo(skX + sk * 0.72, skY + sk * 1.1);
    ctx.lineTo(skX + sk * 0.33, skY + sk * 0.80);
    ctx.lineTo(skX + sk * 0.1, skY + sk * 1.15);
    ctx.lineTo(skX - sk * 0.1, skY + sk * 0.80);
    ctx.lineTo(skX - sk * 0.33, skY + sk * 1.15);
    ctx.lineTo(skX - sk * 0.72, skY + sk * 1.1);
    ctx.lineTo(skX - sk, skY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = this.bandana;
    ctx.beginPath();
    ctx.arc(skX - sk * 0.34, skY - sk * 0.1, sk * 0.22, 0, TAU);
    ctx.arc(skX + sk * 0.34, skY - sk * 0.1, sk * 0.22, 0, TAU);
    ctx.fill();
    ctx.restore();

    // braço direito — sobe quando aponta
    ctx.save();
    ctx.strokeStyle = '#0b0b0d';
    ctx.lineWidth = 7 * u;
    ctx.lineCap = 'round';
    const shX = bx + body, shY = by + body * 0.62;
    const upX = bx + body + 9 * u;
    const upY = by + body * 0.10;
    const armX = shX + (upX - shX) * this.pointArm;
    const armY = shY + (upY - shY) * this.pointArm;
    ctx.beginPath();
    ctx.moveTo(shX, shY);
    ctx.quadraticCurveTo(shX + 7 * u, (shY + armY) / 2, armX, armY);
    ctx.stroke();
    // luva ponta ciano
    ctx.fillStyle = this.accent;
    ctx.beginPath();
    ctx.arc(armX, armY, 3.4 * u, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  _brain(ctx, x, y, u) {
    ctx.save();
    const s = 9 * u;
    ctx.fillStyle = '#e879a8';
    ctx.beginPath();
    ctx.ellipse(x, y, s * 0.9, s * 0.72, -0.2, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#b94f7f';
    ctx.lineWidth = 1.1 * u;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.55, y - s * 0.1);
    ctx.quadraticCurveTo(x - s * 0.2, y - s * 0.42, x + s * 0.05, y - s * 0.05);
    ctx.quadraticCurveTo(x + s * 0.3, y - s * 0.45, x + s * 0.6, y - s * 0.05);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - s * 0.5, y + s * 0.22);
    ctx.quadraticCurveTo(x, y + s * 0.5, x + s * 0.5, y + s * 0.2);
    ctx.stroke();
    ctx.restore();
  }
}