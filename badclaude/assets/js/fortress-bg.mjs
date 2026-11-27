/**
 * FortressBackground — BadClaude Continuous Cyber-Fortress Canvas Engine
 * ======================================================================
 * Replaces floating `.liquid-orb` blobs with a single, seamless (0-cut top-to-footer),
 * 60fps architectural background representing BadClaude's identity:
 *   - Deep Obsidian base (#04050a -> #070a13) fixed across 100vw x 100vh
 *   - Isometric/perspective hexagonal cyber-armor lattice & crisp micro-shield nodes
 *     (Ed25519 / Check-Lock diamond & chevron sentinels — ZERO blurry orbs)
 *   - Live 5-Layer Cascade neural telemetry conduits in Crimson Hermes (#e11d2e),
 *     Technical Gold (#f5c518), and Cyan NIM (#22d3ee)
 *   - Smooth scrollY architectural parallax + pointermove hexagonal defense perimeter
 *   - 3D impact integration via `triggerShockwave(normX = 0.62, normY = 0.38, strength = 1.0)`
 *     exposed on instance and `window.__badclaudeFortress`
 */

const PALETTE = Object.freeze({
  obsidianTop: '#04050a',
  obsidianDeep: '#070a13',
  crimson: '#e11d2e',
  crimsonRgb: '225, 29, 46',
  gold: '#f5c518',
  goldRgb: '245, 197, 24',
  cyan: '#22d3ee',
  cyanRgb: '34, 211, 238',
  slateRgb: '148, 163, 184',
});

// 6 unit directions of a pointy-top isometric-squashed hexagon
const ISO_SQUASH = 0.86;
const HEX_DIRS = (() => {
  const dirs = [];
  for (let k = 0; k < 6; k++) {
    const rad = ((60 * k - 30) * Math.PI) / 180;
    dirs.push({
      dx: Math.cos(rad),
      dy: Math.sin(rad) * ISO_SQUASH,
    });
  }
  return Object.freeze(dirs);
})();

// 5-Layer Cascade color mapping: L1-L2 Hermes Crimson, L3-L4 Check-Lock Gold, L5 NIM Cyan
const CASCADE_LAYERS = Object.freeze([
  { id: 1, name: 'L1-Hermes', rgb: PALETTE.crimsonRgb, hex: PALETTE.crimson },
  { id: 2, name: 'L2-Harness', rgb: PALETTE.crimsonRgb, hex: PALETTE.crimson },
  { id: 3, name: 'L3-Ed25519', rgb: PALETTE.goldRgb, hex: PALETTE.gold },
  { id: 4, name: 'L4-CheckLock', rgb: PALETTE.goldRgb, hex: PALETTE.gold },
  { id: 5, name: 'L5-NIM', rgb: PALETTE.cyanRgb, hex: PALETTE.cyan },
]);

function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function smoothstep(e0, e1, x) {
  const t = clamp01((x - e0) / (e1 - e0 || 1e-6));
  return t * t * (3 - 2 * t);
}

function cellHash(col, row) {
  let h = (Math.imul(col | 0, 374761393) ^ Math.imul(row | 0, 668265263)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function posMod(n, m) {
  return ((n % m) + m) % m;
}

export class FortressBackground {
  constructor(canvas, options = {}) {
    if (!canvas || typeof canvas.getContext !== 'function') {
      throw new TypeError('[FortressBackground] A valid HTMLCanvasElement is required.');
    }

    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false, desynchronized: true }) || canvas.getContext('2d');
    this.options = Object.assign(
      {
        maxDpr: 1.5,
        conduitCount: 22,
        scrollFactorHex: 0.18,
        scrollFactorSpine: 0.07,
        pointerRadius: 192,
      },
      options
    );

    this.width = 1;
    this.height = 1;
    this.dpr = 1;
    this.hexR = 46;

    this.prefersReduced = Boolean(
      typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
    this.isHidden = Boolean(typeof document !== 'undefined' && document.hidden);
    this.isPaused = false;
    this.disposed = false;

    this.time = 0;
    this.lastTs = 0;
    this.rafId = 0;
    this.fps = 60;
    this.audioEnergy = 0;

    this.scrollTarget = typeof window !== 'undefined' ? window.scrollY || 0 : 0;
    this.scrollCurrent = this.scrollTarget;
    this.docMaxScroll = 2400;

    this.pointer = {
      x: -9999,
      y: -9999,
      tx: -9999,
      ty: -9999,
      energy: 0,
      active: false,
    };

    this.conduits = [];
    this.shockwaves = [];
    this.shockwavesCount = 0;
    this._bgGrad = null;
    this._bgGradH = 0;

    this._initConduitPool();
    this.resize();
    this._bindEvents();

    if (typeof window !== 'undefined') {
      window.__badclaudeFortress = this;
    }

    // Render immediate initial frame so zero blank flash occurs
    this.renderFrame(0.016);
    if (!this.prefersReduced && !this.isHidden) {
      this._startLoop();
    }
  }

  get activePulses() {
    return this.conduits.length + this.shockwaves.length;
  }

  _initConduitPool() {
    const count = Math.max(5, this.options.conduitCount | 0);
    this.conduits = [];
    for (let i = 0; i < count; i++) {
      const c = this._createConduit(i, true);
      this.conduits.push(c);
    }
  }

  _createConduit(seedIdx = 0, randomizeProgress = false) {
    const layer = CASCADE_LAYERS[seedIdx % CASCADE_LAYERS.length];
    const maxPts = 6;
    const ptsX = new Float32Array(maxPts);
    const ptsY = new Float32Array(maxPts);
    const c = {
      layer,
      ptsX,
      ptsY,
      headIdx: 0,
      len: 1,
      dirIdx: seedIdx % 6,
      segProgress: randomizeProgress ? (seedIdx * 0.37) % 1 : 0,
      speed: 1.55 + (seedIdx % 5) * 0.34, // edges per second
      life: randomizeProgress ? (seedIdx * 0.61) % 1 : 0,
      maxLife: 3.4 + (seedIdx % 4) * 0.85,
      boost: 0,
    };
    this._respawnConduit(c, seedIdx * 19 + 7);
    return c;
  }

  _respawnConduit(c, salt = 1) {
    const w = Math.max(320, this.width);
    const h = Math.max(320, this.height);
    const r = this.hexR;
    const colW = Math.sqrt(3) * r;
    const rowH = 1.5 * r * ISO_SQUASH;

    const cols = Math.max(4, Math.ceil(w / colW) + 2);
    const rows = Math.max(4, Math.ceil(h / rowH) + 2);
    const h1 = cellHash((salt * 13) | 0, (this.time * 10) | 0);
    const h2 = cellHash((salt * 29 + 3) | 0, (this.time * 17 + 5) | 0);

    const col = Math.floor(h1 * cols) - 1;
    const row = Math.floor(h2 * rows) - 1;
    const cx = col * colW + ((row & 1) !== 0 ? colW * 0.5 : 0);
    const cy = row * rowH;

    // Snap start to one of the 6 vertices of that hex cell
    const vIdx = Math.floor(h1 * 6) % 6;
    const sx = cx + HEX_DIRS[vIdx].dx * r;
    const sy = cy + HEX_DIRS[vIdx].dy * r;

    for (let i = 0; i < c.ptsX.length; i++) {
      c.ptsX[i] = sx;
      c.ptsY[i] = sy;
    }
    c.len = 1;
    c.segProgress = 0;
    c.dirIdx = (vIdx + 2) % 6;
    c.life = 0;
    c.boost = 0;
  }

  _stepConduitVertex(c, stepTurnSeed) {
    const curX = c.ptsX[0];
    const curY = c.ptsY[0];
    const edgeLen = this.hexR;
    // Along a pointy-top hex edge, edge vector angles are multiples of 60 deg (0, 60, 120, 180, 240, 300)
    const rad = (c.dirIdx * Math.PI) / 3;
    const nx = curX + Math.cos(rad) * edgeLen;
    const ny = curY + Math.sin(rad) * ISO_SQUASH * edgeLen;

    for (let i = c.ptsX.length - 1; i > 0; i--) {
      c.ptsX[i] = c.ptsX[i - 1];
      c.ptsY[i] = c.ptsY[i - 1];
    }
    c.ptsX[0] = nx;
    c.ptsY[0] = ny;
    if (c.len < c.ptsX.length) c.len++;

    // Turn +60 deg or -60 deg along hexagonal mesh edges (never arbitrary random angles)
    const turn = stepTurnSeed > 0.5 ? 1 : 5;
    c.dirIdx = (c.dirIdx + turn) % 6;
  }

  /**
   * Public API: Triggers a crimson/gold hexagonal shockwave across the entire background
   * synchronized with the Cyber-Doberman smashing the Astra & Claude emblems.
   */
  triggerShockwave(normX = 0.62, normY = 0.38, strength = 1.0) {
    const nx = clamp(Number.isFinite(normX) ? normX : 0.62, 0.0, 1.0);
    const ny = clamp(Number.isFinite(normY) ? normY : 0.38, 0.0, 1.0);
    const str = clamp(Number.isFinite(strength) ? strength : 1.0, 0.15, 2.5);

    const cx = nx * this.width;
    const cy = ny * this.height;
    const maxRadius = Math.hypot(this.width, this.height) * 1.06;

    this.shockwaves.push({
      x: cx,
      y: cy,
      normX: nx,
      normY: ny,
      strength: str,
      age: 0,
      duration: this.prefersReduced ? 0.55 : 1.72,
      maxRadius,
    });
    if (this.shockwaves.length > 4) {
      this.shockwaves.shift();
    }
    this.shockwavesCount++;

    // Energize half the 5-layer conduits outward from the epicenter along hex edges
    const scrollShift = posMod(this.scrollCurrent * this.options.scrollFactorHex, this.hexR * 3 * ISO_SQUASH);
    for (let i = 0; i < this.conduits.length; i += 2) {
      const c = this.conduits[i];
      const dir = i % 6;
      const sx = cx + HEX_DIRS[dir].dx * this.hexR;
      const sy = cy + scrollShift + HEX_DIRS[dir].dy * this.hexR;
      for (let k = 0; k < c.ptsX.length; k++) {
        c.ptsX[k] = sx;
        c.ptsY[k] = sy;
      }
      c.len = 1;
      c.dirIdx = dir;
      c.segProgress = 0;
      c.life = 0;
      c.boost = str;
    }

    if (this.prefersReduced) {
      this.renderFrame(0.016);
    } else if (!this.rafId && !this.isHidden && !this.isPaused) {
      this._startLoop();
    }
    return true;
  }

  setAudioEnergy(energy = 0) {
    this.audioEnergy = clamp01(Number(energy) || 0);
  }

  resize() {
    if (this.disposed) return;
    const winW = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const winH = typeof window !== 'undefined' ? window.innerHeight : 720;
    const rect = typeof this.canvas.getBoundingClientRect === 'function' ? this.canvas.getBoundingClientRect() : null;

    const w = Math.max(300, Math.round((rect && rect.width) || winW || 1280));
    const h = Math.max(240, Math.round((rect && rect.height) || winH || 720));
    const rawDpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const dpr = Math.min(Math.max(1, rawDpr), this.options.maxDpr);

    this.width = w;
    this.height = h;
    this.dpr = dpr;
    this.hexR = w < 768 ? 38 : 48;

    const targetW = Math.round(w * dpr);
    const targetH = Math.round(h * dpr);
    if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
      this.canvas.width = targetW;
      this.canvas.height = targetH;
    }

    if (typeof document !== 'undefined' && document.documentElement) {
      this.docMaxScroll = Math.max(
        1,
        (document.documentElement.scrollHeight || h * 3) - h
      );
    }
    this._bgGrad = null;
    if (this.ctx) {
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    this.renderFrame(0);
  }

  pause() {
    this.isPaused = true;
    this._stopLoop();
  }

  resume() {
    if (this.disposed) return;
    this.isPaused = false;
    if (!this.prefersReduced && !this.isHidden) {
      this._startLoop();
    } else {
      this.renderFrame(0);
    }
  }

  _bindEvents() {
    if (typeof window === 'undefined') return;

    this._onResize = () => this.resize();
    this._onScroll = () => {
      this.scrollTarget = window.scrollY || window.pageYOffset || 0;
      if (this.prefersReduced) {
        this.scrollCurrent = this.scrollTarget;
        this.renderFrame(0);
      }
    };
    this._onPointerMove = (e) => {
      this.pointer.tx = e.clientX;
      this.pointer.ty = e.clientY;
      this.pointer.active = true;
      this.pointer.energy = Math.min(1, this.pointer.energy + 0.32);
    };
    this._onPointerLeave = () => {
      this.pointer.active = false;
    };
    this._onVisibility = () => {
      this.isHidden = Boolean(document.hidden);
      if (this.isHidden) {
        this._stopLoop();
      } else if (!this.prefersReduced && !this.isPaused) {
        this.lastTs = 0;
        this._startLoop();
      }
    };
    this._onShockwaveEvent = (ev) => {
      const d = (ev && ev.detail) || {};
      this.triggerShockwave(d.normX, d.normY, d.strength);
    };

    window.addEventListener('resize', this._onResize, { passive: true });
    window.addEventListener('scroll', this._onScroll, { passive: true });
    window.addEventListener('pointermove', this._onPointerMove, { passive: true });
    window.addEventListener('pointerleave', this._onPointerLeave, { passive: true });
    window.addEventListener('badclaude:shockwave', this._onShockwaveEvent);

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this._onVisibility);
    }

    if (window.matchMedia) {
      this._mql = window.matchMedia('(prefers-reduced-motion: reduce)');
      this._onMotionPref = (e) => {
        this.prefersReduced = Boolean(e.matches);
        if (this.prefersReduced) {
          this._stopLoop();
          this.renderFrame(0);
        } else if (!this.isHidden && !this.isPaused) {
          this._startLoop();
        }
      };
      if (typeof this._mql.addEventListener === 'function') {
        this._mql.addEventListener('change', this._onMotionPref);
      }
    }
  }

  _startLoop() {
    if (this.rafId || this.disposed || typeof requestAnimationFrame !== 'function') return;
    const tick = (ts) => {
      if (this.disposed || this.isHidden || this.isPaused || this.prefersReduced) {
        this.rafId = 0;
        return;
      }
      const rawDt = this.lastTs ? (ts - this.lastTs) * 0.001 : 0.0166;
      this.lastTs = ts;
      const dt = clamp(rawDt, 0.001, 0.05);
      const instFps = 1 / Math.max(0.004, rawDt);
      this.fps += (instFps - this.fps) * 0.08;

      this.update(dt);
      this.renderFrame(dt);
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  _stopLoop() {
    if (this.rafId && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.rafId);
    }
    this.rafId = 0;
    this.lastTs = 0;
  }

  update(dt) {
    this.time += dt;

    // Smooth damped scroll parallax
    const scrollDiff = this.scrollTarget - this.scrollCurrent;
    this.scrollCurrent += scrollDiff * Math.min(1, dt * 12);

    // Smooth pointer tracking & perimeter decay
    if (this.pointer.active) {
      if (this.pointer.x < -5000) {
        this.pointer.x = this.pointer.tx;
        this.pointer.y = this.pointer.ty;
      } else {
        const k = Math.min(1, dt * 15);
        this.pointer.x += (this.pointer.tx - this.pointer.x) * k;
        this.pointer.y += (this.pointer.ty - this.pointer.y) * k;
      }
      this.pointer.energy = Math.min(1, this.pointer.energy + dt * 2.2);
    } else {
      this.pointer.energy = Math.max(0, this.pointer.energy - dt * 1.4);
    }

    // Advance 5-Layer Cascade conduits along hexagonal mesh edges
    const wrapPeriod = this.hexR * 3 * ISO_SQUASH;
    for (let i = 0; i < this.conduits.length; i++) {
      const c = this.conduits[i];
      c.life += dt;
      const spdMult = 1 + c.boost * 1.65 + this.audioEnergy * 0.7;
      c.segProgress += dt * c.speed * spdMult;
      c.boost = Math.max(0, c.boost - dt * 0.85);

      while (c.segProgress >= 1) {
        c.segProgress -= 1;
        const seed = cellHash((i * 31 + (c.life * 10)) | 0, (this.time * 23 + i) | 0);
        this._stepConduitVertex(c, seed);
      }

      const hx = c.ptsX[0];
      const hy = c.ptsY[0];
      if (
        c.life >= c.maxLife ||
        hx < -this.hexR * 3 ||
        hx > this.width + this.hexR * 3 ||
        hy < -wrapPeriod * 2 ||
        hy > this.height + wrapPeriod * 3
      ) {
        this._respawnConduit(c, i * 17 + ((this.time * 100) | 0));
      }
    }

    // Advance active shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.age += dt;
      if (sw.age >= sw.duration) {
        this.shockwaves.splice(i, 1);
      }
    }
  }

  _drawHexPath(ctx, cx, cy, r) {
    ctx.moveTo(cx + HEX_DIRS[0].dx * r, cy + HEX_DIRS[0].dy * r);
    for (let k = 1; k < 6; k++) {
      ctx.lineTo(cx + HEX_DIRS[k].dx * r, cy + HEX_DIRS[k].dy * r);
    }
    ctx.closePath();
  }

  _drawDiamondNode(ctx, x, y, size) {
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size * 0.88, y);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size * 0.88, y);
    ctx.closePath();
  }

  _drawCheckLockShield(ctx, cx, cy, s) {
    // Crisp miniature BadClaude Ed25519 Check-Lock shield crest (ZERO blur)
    ctx.moveTo(cx, cy - s);
    ctx.lineTo(cx + s * 0.86, cy - s * 0.42);
    ctx.lineTo(cx + s * 0.72, cy + s * 0.36);
    ctx.lineTo(cx, cy + s);
    ctx.lineTo(cx - s * 0.72, cy + s * 0.36);
    ctx.lineTo(cx - s * 0.86, cy - s * 0.42);
    ctx.closePath();
  }

  renderFrame() {
    const ctx = this.ctx;
    if (!ctx || this.disposed) return;

    const w = this.width;
    const h = this.height;
    const r = this.hexR;

    // ---------------------------------------------------------------------
    // 1. Deep Continuous Obsidian Base (#04050a -> #070a13)
    // ---------------------------------------------------------------------
    if (!this._bgGrad || this._bgGradH !== h) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0.0, '#04050a');
      g.addColorStop(0.38, '#05070e');
      g.addColorStop(1.0, '#070a13');
      this._bgGrad = g;
      this._bgGradH = h;
    }
    ctx.fillStyle = this._bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle scroll-coupled architectural horizon sheen (not orbs — wide linear light bands)
    const scrollNorm = clamp01(this.scrollCurrent / Math.max(1, this.docMaxScroll));
    const bandY = h * (0.24 + 0.48 * Math.sin(scrollNorm * Math.PI));
    const sheen = ctx.createLinearGradient(0, Math.max(0, bandY - h * 0.45), 0, Math.min(h, bandY + h * 0.45));
    sheen.addColorStop(0, 'rgba(4, 5, 10, 0)');
    sheen.addColorStop(0.5, `rgba(225, 29, 46, ${(0.032 + this.audioEnergy * 0.025).toFixed(4)})`);
    sheen.addColorStop(1, 'rgba(7, 10, 19, 0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, w, h);

    // ---------------------------------------------------------------------
    // 2. 5-Layer Cascade Architectural Spine Rails (Parallax Plane 1)
    // ---------------------------------------------------------------------
    const spineOffset = posMod(this.scrollCurrent * this.options.scrollFactorSpine, 160);
    if (w >= 920) {
      const marginX = Math.max(24, Math.min(72, w * 0.038));
      ctx.lineWidth = 1;
      for (let l = 0; l < 5; l++) {
        const lx = marginX + l * 6;
        const rx = w - marginX - l * 6;
        const colRgb = CASCADE_LAYERS[l].rgb;
        ctx.strokeStyle = `rgba(${colRgb}, 0.055)`;
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx, h);
        ctx.moveTo(rx, 0);
        ctx.lineTo(rx, h);
        ctx.stroke();
      }

      // Crisp Check-Lock calibration ticks gliding along the 5 rails
      ctx.strokeStyle = `rgba(${PALETTE.goldRgb}, 0.14)`;
      ctx.beginPath();
      for (let y = -spineOffset; y < h + 160; y += 160) {
        ctx.moveTo(marginX - 4, y);
        ctx.lineTo(marginX + 28, y);
        ctx.moveTo(w - marginX - 28, y + 80);
        ctx.lineTo(w - marginX + 4, y + 80);
      }
      ctx.stroke();
    }

    // ---------------------------------------------------------------------
    // 3. Isometric Hexagonal Fortress Mesh & Micro-Shield Sentinels
    // ---------------------------------------------------------------------
    const colW = Math.sqrt(3) * r;
    const rowH = 1.5 * r * ISO_SQUASH;
    const wrapH = rowH * 2;
    const rawScrollPx = this.scrollCurrent * this.options.scrollFactorHex;
    const scrollWrap = posMod(rawScrollPx, wrapH);
    const baseRowShift = Math.floor(rawScrollPx / wrapH) * 2;

    const cols = Math.ceil(w / colW) + 2;
    const rows = Math.ceil(h / rowH) + 3;

    const ptrOn = this.pointer.energy > 0.01;
    const ptrX = this.pointer.x;
    const ptrY = this.pointer.y;
    const ptrRad = this.options.pointerRadius;
    const ptrRadSq = ptrRad * ptrRad;

    const hasShock = this.shockwaves.length > 0;

    // Batched paths for 60fps zero-overhead Canvas2D rendering
    ctx.lineWidth = 1;
    ctx.strokeStyle = `rgba(${PALETTE.slateRgb}, 0.052)`;
    ctx.beginPath();

    const bastionCells = [];
    const activeHoverCells = [];
    const shockCells = [];

    for (let rIdx = -1; rIdx < rows; rIdx++) {
      const vRow = rIdx + baseRowShift;
      const cy = rIdx * rowH - scrollWrap;
      const xOff = (vRow & 1) !== 0 ? colW * 0.5 : 0;

      for (let cIdx = -1; cIdx < cols; cIdx++) {
        const cx = cIdx * colW + xOff;

        // Draw primary hexagonal cyber-armor edge (top-right 3 edges avoid double-stroking shared borders!)
        const p0x = cx + HEX_DIRS[0].dx * r;
        const p0y = cy + HEX_DIRS[0].dy * r;
        const p1x = cx + HEX_DIRS[1].dx * r;
        const p1y = cy + HEX_DIRS[1].dy * r;
        const p2x = cx + HEX_DIRS[2].dx * r;
        const p2y = cy + HEX_DIRS[2].dy * r;
        const p3x = cx + HEX_DIRS[3].dx * r;
        const p3y = cy + HEX_DIRS[3].dy * r;

        ctx.moveTo(p0x, p0y);
        ctx.lineTo(p1x, p1y);
        ctx.lineTo(p2x, p2y);
        ctx.lineTo(p3x, p3y);

        const hVal = cellHash(cIdx, vRow);
        if (hVal > 0.86) {
          bastionCells.push({ cx, cy, hVal, p0x, p0y });
        }

        // Check pointer defense perimeter
        if (ptrOn) {
          const dx = cx - ptrX;
          const dy = cy - ptrY;
          const dSq = dx * dx + dy * dy;
          if (dSq < ptrRadSq) {
            const dist = Math.sqrt(dSq);
            const prox = smoothstep(ptrRad, 14, dist) * this.pointer.energy;
            if (prox > 0.02) {
              activeHoverCells.push({ cx, cy, prox, hVal });
            }
          }
        }

        // Check 3D Smash Shockwave wavefront intersection
        if (hasShock) {
          let maxShock = 0;
          let waveTone = 0;
          for (let s = 0; s < this.shockwaves.length; s++) {
            const sw = this.shockwaves[s];
            const u = clamp01(sw.age / sw.duration);
            const easeU = 1 - Math.pow(1 - u, 2.3);
            const curRad = easeU * sw.maxRadius;
            const fade = (1 - u) * sw.strength;
            const dist = Math.hypot(cx - sw.x, cy - sw.y);
            const band = r * 1.65;
            const ring1 = smoothstep(band, 0, Math.abs(dist - curRad)) * fade;
            const ring2 = smoothstep(band * 0.8, 0, Math.abs(dist - curRad * 0.74)) * fade * 0.85;
            if (ring1 > maxShock) {
              maxShock = ring1;
              waveTone = 0; // Crimson primary wavefront
            }
            if (ring2 > maxShock) {
              maxShock = ring2;
              waveTone = 1; // Gold Check-Lock harmonic
            }
          }
          if (maxShock > 0.04) {
            shockCells.push({ cx, cy, intensity: clamp01(maxShock), waveTone });
          }
        }
      }
    }
    ctx.stroke();

    // Draw deterministic Ed25519 Bastion inner bevels & sharp vertex micro-diamonds
    if (bastionCells.length > 0) {
      // Subtle recessed armor bevels
      ctx.strokeStyle = `rgba(${PALETTE.crimsonRgb}, 0.075)`;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      for (let i = 0; i < bastionCells.length; i++) {
        const b = bastionCells[i];
        if (b.hVal > 0.945) {
          this._drawHexPath(ctx, b.cx, b.cy, r * 0.72);
        }
      }
      ctx.stroke();

      // Crisp geometric micro-diamonds & Check-Lock shields at active vertices
      const pulse = this.prefersReduced ? 0.7 : 0.55 + 0.45 * Math.sin(this.time * 2.1);
      ctx.fillStyle = `rgba(${PALETTE.crimsonRgb}, ${(0.22 + 0.12 * pulse).toFixed(3)})`;
      ctx.beginPath();
      for (let i = 0; i < bastionCells.length; i++) {
        const b = bastionCells[i];
        if (b.hVal <= 0.93) {
          this._drawDiamondNode(ctx, b.p0x, b.p0y, 2.7);
        }
      }
      ctx.fill();

      ctx.strokeStyle = `rgba(${PALETTE.goldRgb}, ${(0.24 + 0.14 * pulse).toFixed(3)})`;
      ctx.lineWidth = 1.05;
      ctx.beginPath();
      for (let i = 0; i < bastionCells.length; i++) {
        const b = bastionCells[i];
        if (b.hVal > 0.93 && b.hVal <= 0.97) {
          this._drawCheckLockShield(ctx, b.p0x, b.p0y, 4.1);
        }
      }
      ctx.stroke();

      ctx.fillStyle = `rgba(${PALETTE.cyanRgb}, ${(0.22 + 0.12 * pulse).toFixed(3)})`;
      ctx.beginPath();
      for (let i = 0; i < bastionCells.length; i++) {
        const b = bastionCells[i];
        if (b.hVal > 0.97) {
          this._drawDiamondNode(ctx, b.p0x, b.p0y, 2.6);
        }
      }
      ctx.fill();
    }

    // ---------------------------------------------------------------------
    // 4. Live 5-Layer Cascade Conduits (Telemetry Beams along Hex Edges)
    // ---------------------------------------------------------------------
    const conduitOffsetY = -scrollWrap;
    for (let layerGroup = 0; layerGroup < 3; layerGroup++) {
      const rgb =
        layerGroup === 0
          ? PALETTE.crimsonRgb
          : layerGroup === 1
            ? PALETTE.goldRgb
            : PALETTE.cyanRgb;

      // Pass A: Crisp 2.8px outer energy sheath (zero blur!)
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 2.8;
      ctx.strokeStyle = `rgba(${rgb}, 0.16)`;
      ctx.beginPath();
      this._traceConduitGroup(ctx, layerGroup, conduitOffsetY);
      ctx.stroke();

      // Pass B: Razor-sharp 1.25px core beam
      ctx.lineWidth = 1.25;
      ctx.strokeStyle = `rgba(${rgb}, 0.78)`;
      ctx.beginPath();
      const heads = this._traceConduitGroup(ctx, layerGroup, conduitOffsetY, true);
      ctx.stroke();

      // Pass C: Crisp micro-diamond packet heads at leading tip
      if (heads && heads.length > 0) {
        ctx.fillStyle = `rgba(${rgb}, 0.92)`;
        ctx.beginPath();
        for (let hIdx = 0; hIdx < heads.length; hIdx++) {
          this._drawDiamondNode(ctx, heads[hIdx].x, heads[hIdx].y, 2.9);
        }
        ctx.fill();
      }
    }

    // ---------------------------------------------------------------------
    // 5. Mouse Tactical Hexagonal Defense Perimeter
    // ---------------------------------------------------------------------
    if (activeHoverCells.length > 0) {
      for (let i = 0; i < activeHoverCells.length; i++) {
        const cell = activeHoverCells[i];
        const p = cell.prox;
        const rgb =
          cell.hVal > 0.68
            ? PALETTE.goldRgb
            : cell.hVal > 0.34
              ? PALETTE.crimsonRgb
              : PALETTE.cyanRgb;

        ctx.strokeStyle = `rgba(${rgb}, ${(p * 0.44).toFixed(3)})`;
        ctx.lineWidth = 1.15;
        ctx.beginPath();
        this._drawHexPath(ctx, cell.cx, cell.cy, r * 0.94);
        ctx.stroke();

        if (p > 0.52) {
          // Inner Check-Lock shield reticle on high-proximity cells
          ctx.fillStyle = `rgba(${rgb}, ${(p * 0.055).toFixed(3)})`;
          ctx.beginPath();
          this._drawHexPath(ctx, cell.cx, cell.cy, r * 0.74);
          ctx.fill();

          ctx.strokeStyle = `rgba(${PALETTE.goldRgb}, ${(p * 0.55).toFixed(3)})`;
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          this._drawCheckLockShield(ctx, cell.cx, cell.cy, 4.5);
          ctx.stroke();
        }
      }
    }

    // ---------------------------------------------------------------------
    // 6. 3D Doberman Smash Hexagonal Shockwave Front
    // ---------------------------------------------------------------------
    if (shockCells.length > 0) {
      for (let i = 0; i < shockCells.length; i++) {
        const sc = shockCells[i];
        const rgb = sc.waveTone === 0 ? PALETTE.crimsonRgb : PALETTE.goldRgb;
        ctx.strokeStyle = `rgba(${rgb}, ${(sc.intensity * 0.72).toFixed(3)})`;
        ctx.fillStyle = `rgba(${rgb}, ${(sc.intensity * 0.09).toFixed(3)})`;
        ctx.lineWidth = 1.45;
        ctx.beginPath();
        this._drawHexPath(ctx, sc.cx, sc.cy, r * 0.92);
        ctx.fill();
        ctx.stroke();
      }
    }

    if (hasShock) {
      for (let s = 0; s < this.shockwaves.length; s++) {
        const sw = this.shockwaves[s];
        const u = clamp01(sw.age / sw.duration);
        const easeU = 1 - Math.pow(1 - u, 2.3);
        const curRad = Math.max(12, easeU * sw.maxRadius);
        const alpha = Math.pow(1 - u, 1.5) * clamp01(sw.strength);

        // Faceted 12-gon architectural shockwave ring (Crimson Hermes + Gold Check-Lock)
        this._strokeFacetedWave(ctx, sw.x, sw.y, curRad, 12, `rgba(${PALETTE.crimsonRgb}, ${(alpha * 0.62).toFixed(3)})`, 2.0);
        this._strokeFacetedWave(
          ctx,
          sw.x,
          sw.y,
          curRad * 0.74,
          12,
          `rgba(${PALETTE.goldRgb}, ${(alpha * 0.48).toFixed(3)})`,
          1.35
        );
        this._strokeFacetedWave(
          ctx,
          sw.x,
          sw.y,
          curRad * 0.52,
          6,
          `rgba(${PALETTE.cyanRgb}, ${(alpha * 0.28).toFixed(3)})`,
          1.0
        );
      }
    }
  }

  _traceConduitGroup(ctx, groupIdx, offsetY, collectHeads = false) {
    const heads = collectHeads ? [] : null;
    const edgeLen = this.hexR;

    for (let i = 0; i < this.conduits.length; i++) {
      const c = this.conduits[i];
      const lid = c.layer.id;
      const g = lid <= 2 ? 0 : lid <= 4 ? 1 : 2;
      if (g !== groupIdx) continue;

      const fadeIn = smoothstep(0, 0.35, c.life);
      const fadeOut = 1 - smoothstep(c.maxLife - 0.55, c.maxLife, c.life);
      if (fadeIn * fadeOut < 0.05) continue;

      // Leading tip interpolated along current hex edge
      const rad = (c.dirIdx * Math.PI) / 3;
      const tipX = c.ptsX[0] + Math.cos(rad) * edgeLen * c.segProgress;
      const tipY = c.ptsY[0] + Math.sin(rad) * ISO_SQUASH * edgeLen * c.segProgress + offsetY;

      ctx.moveTo(tipX, tipY);
      for (let k = 0; k < c.len; k++) {
        ctx.lineTo(c.ptsX[k], c.ptsY[k] + offsetY);
      }

      if (collectHeads) {
        heads.push({ x: tipX, y: tipY });
      }
    }
    return heads;
  }

  _strokeFacetedWave(ctx, cx, cy, rad, sides, strokeStyle, lineWidth) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    for (let k = 0; k <= sides; k++) {
      const ang = (k / sides) * Math.PI * 2 - Math.PI / 6;
      const px = cx + Math.cos(ang) * rad;
      const py = cy + Math.sin(ang) * rad * ISO_SQUASH;
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this._stopLoop();

    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this._onResize);
      window.removeEventListener('scroll', this._onScroll);
      window.removeEventListener('pointermove', this._onPointerMove);
      window.removeEventListener('pointerleave', this._onPointerLeave);
      window.removeEventListener('badclaude:shockwave', this._onShockwaveEvent);
      if (window.__badclaudeFortress === this) {
        delete window.__badclaudeFortress;
      }
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this._onVisibility);
    }
    if (this._mql && typeof this._mql.removeEventListener === 'function' && this._onMotionPref) {
      this._mql.removeEventListener('change', this._onMotionPref);
    }
  }
}

/**
 * Mounts the continuous BadClaude Fortress background on the given `<canvas>` (or selector/container),
 * hides any legacy `.liquid-orb` elements, and registers `window.__badclaudeFortress`.
 */
export function mountFortressBackground(canvas, options = {}) {
  if (typeof document === 'undefined') return null;

  if (window.__badclaudeFortress instanceof FortressBackground && !window.__badclaudeFortress.disposed) {
    if (!canvas || window.__badclaudeFortress.canvas === canvas) {
      return window.__badclaudeFortress;
    }
    window.__badclaudeFortress.dispose();
  }

  let target = canvas;
  if (typeof target === 'string') {
    target = document.querySelector(target);
  }
  if (!target) {
    target =
      document.getElementById('fortressBgCanvas') ||
      document.querySelector('.cosmos-bg canvas') ||
      document.querySelector('.cosmos-bg');
  }

  let canvasEl = null;
  if (target && target.tagName && target.tagName.toUpperCase() === 'CANVAS') {
    canvasEl = target;
  } else if (target && typeof target.appendChild === 'function') {
    canvasEl = target.querySelector('canvas') || document.createElement('canvas');
    if (!canvasEl.id) canvasEl.id = 'fortressBgCanvas';
    if (!canvasEl.parentNode) target.prepend(canvasEl);
  } else {
    canvasEl = document.createElement('canvas');
    canvasEl.id = 'fortressBgCanvas';
    document.body.prepend(canvasEl);
  }

  // Hide any legacy floating `.liquid-orb` elements if still in DOM
  const legacyOrbs = document.querySelectorAll('.liquid-orb');
  for (let i = 0; i < legacyOrbs.length; i++) {
    legacyOrbs[i].style.display = 'none';
  }

  canvasEl.setAttribute('aria-hidden', 'true');
  const s = canvasEl.style;
  if (!s.position) {
    const inFixedHost =
      canvasEl.parentElement &&
      typeof window.getComputedStyle === 'function' &&
      window.getComputedStyle(canvasEl.parentElement).position === 'fixed';
    s.position = inFixedHost ? 'absolute' : 'fixed';
    s.inset = '0';
    s.width = '100%';
    s.height = '100%';
    s.pointerEvents = 'none';
    s.zIndex = '0';
    s.display = 'block';
  }

  return new FortressBackground(canvasEl, options);
}

export default FortressBackground;
