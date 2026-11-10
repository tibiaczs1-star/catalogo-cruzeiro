"use strict";

/* ============================================================
   CZS — Enxame
   Pontos de luz atravessam a pagina, se juntam sobre um bloco,
   contornam a moldura dele e se abrem de novo. Depois vao para o
   proximo bloco. E o unico enfeite: nada de painel, nada de textura.

   Sem dependencias. Um canvas. Custa quase nada: para sozinho
   quando a aba esta oculta ou fora da tela.
   ============================================================ */

(function () {
  if (window.__czsEnxame) return;

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var saveData = Boolean(conn) && conn.saveData === true;
  if (reduced || saveData) return;

  var TAU = Math.PI * 2;
  var GOLD = "#f0c96a";
  var DOTS = ["#e0a92c", "#f2b945", "#c98f16", "#2f7fa8"];

  function rand(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function pointOnRect(r, t) {
    var w = r.width, h = r.height, d = 2 * (w + h);
    t = ((t % d) + d) % d;
    if (t < w) return { x: r.left + t, y: r.top };
    t -= w;
    if (t < h) return { x: r.right, y: r.top + t };
    t -= h;
    if (t < w) return { x: r.right - t, y: r.bottom };
    t -= w;
    return { x: r.left, y: r.bottom - t };
  }

  function Enxame() {
    this.canvas = document.createElement("canvas");
    this.canvas.id = "czs-enxame";
    this.canvas.setAttribute("aria-hidden", "true");
    this.canvas.style.cssText =
      "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;" +
      "z-index:2147481000;opacity:0;transition:opacity .8s ease";
    this.ctx = this.canvas.getContext("2d");
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    document.body.appendChild(this.canvas);

    this.parts = [];
    this.state = "drift";
    this.current = null;
    this.used = [];
    this.frame = 0;
    this.last = 0;
    this.trailProgress = 0;
    this.running = false;

    this.resize();
    this.spawn();
    this.bind();
    this.play();

    // Primeiro alvo apos o portal assentar.
    var self = this;
    this.driftUntil = performance.now() + 1400;
    window.setTimeout(function () {
      self.canvas.style.opacity = "1";
      self.pickNext();
    }, 1500);
  }

  Enxame.prototype.resize = function () {
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  };

  Enxame.prototype.spawn = function () {
    var count = this.w < 720 ? 38 : 78;
    this.parts = [];
    for (var i = 0; i < count; i++) {
      this.parts.push({
        x: rand(0, this.w),
        y: rand(0, this.h),
        vx: rand(-0.4, 0.4),
        vy: rand(-0.4, 0.4),
        r: rand(1.1, 2.8),
        a: rand(0.4, 0.95),
        color: DOTS[(Math.random() * DOTS.length) | 0],
        phase: rand(0, TAU),
        speed: rand(0.7, 1.6)
      });
    }
  };

  Enxame.prototype.bind = function () {
    var self = this;
    window.addEventListener("resize", function () { self.resize(); self.spawn(); }, { passive: true });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) self.running = false; else self.play();
    });
    window.addEventListener("scroll", function () {
      // Rolar cancela a moldura: o bloco saiu do lugar.
      if (self.state === "gather" || self.state === "trace") {
        self.state = "drift";
        self.current = null;
        self.trail = null;
        self.driftUntil = performance.now() + 900;
      }
    }, { passive: true });
  };

  Enxame.prototype.play = function () {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.schedule();
  };

  // requestAnimationFrame nao dispara em aba de fundo nem em alguns
  // navegadores de automacao; o timer garante que o enxame ande de
  // qualquer jeito. Quem puder usar rAF usa, em cima do timer.
  Enxame.prototype.schedule = function () {
    var self = this;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(function () {
      if (!self.running) return;
      var now = performance.now();
      self.tick(now);
      self.schedule();
    }, 16);
  };

  /* ---------- escolha de blocos ---------- */

  Enxame.prototype.candidates = function () {
    var nodes = document.querySelectorAll("main section, main .lead-card, main article, .lead-card, .service-card, .adbox");
    var out = [];
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var r = el.getBoundingClientRect();
      // Só blocos com tamanho legível e perto da tela.
      if (r.width < 220 || r.height < 90) continue;
      if (r.bottom < 60 || r.top > this.h - 60) continue;
      out.push(el);
    }
    return out;
  };

  Enxame.prototype.pickNext = function () {
    var list = this.candidates().filter(function (el) { return this.used.indexOf(el) === -1; }, this);
    if (!list.length) {
      // Deu a volta: recomeça pelo mais visível.
      this.used = [];
      list = this.candidates();
    }
    if (!list.length) { this.state = "drift"; return; }

    // O mais próximo do centro da tela tem prioridade.
    var self = this;
    var cx = this.w / 2, cy = this.h / 2;
    list.sort(function (a, b) {
      var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      var da = Math.hypot(ra.left + ra.width / 2 - cx, ra.top + Math.min(ra.height, 400) / 2 - cy);
      var db = Math.hypot(rb.left + rb.width / 2 - cx, rb.top + Math.min(rb.height, 400) / 2 - cy);
      return da - db;
    });
    this.target(list[0]);
  };

  Enxame.prototype.target = function (el) {
    var r = el.getBoundingClientRect();
    // Recorta ao que está visível: moldura inteira em bloco grande fica feia.
    var top = clamp(r.top + 8, 8, this.h - 40);
    var bottom = clamp(r.bottom - 8, top + 40, this.h - 8);
    var box = {
      left: clamp(r.left + 6, 4, this.w - 40),
      top: top,
      width: 0,
      height: bottom - top,
      right: 0,
      bottom: bottom
    };
    box.width = clamp(r.width - 12, 60, this.w - 12);
    box.right = box.left + box.width;

    this.rect = box;
    this.current = el;
    this.used.push(el);

    var per = 2 * (box.width + box.height);
    var n = this.parts.length;
    for (var i = 0; i < n; i++) {
      var p = this.parts[i];
      var pt = pointOnRect(box, (i / n) * per);
      p.tx = pt.x;
      p.ty = pt.y;
    }
    this.state = "gather";
    this.gatherAt = performance.now();
  };

  /* ---------- laço ---------- */

  Enxame.prototype.tick = function (now) {
    if (!this.running) return;
    var dt = clamp(now - this.last, 8, 48);
    this.last = now;
    this.frame++;

    var ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);

    var i, p;

    if (this.state === "drift" && now > this.driftUntil && this.driftUntil > 0) {
      this.driftUntil = 0;
      this.pickNext();
    }

    if (this.state === "gather") {
      var near = 0;
      for (i = 0; i < this.parts.length; i++) {
        p = this.parts[i];
        var dx = p.tx - p.x, dy = p.ty - p.y;
        if (Math.hypot(dx, dy) < 14) near++;
        p.vx += dx * 0.015 - p.vy * 0.05;
        p.vy += dy * 0.015 + p.vx * 0.05;
        p.vx *= 0.85; p.vy *= 0.85;
      }
      if (near >= this.parts.length * 0.8 || now - this.gatherAt > 2200) {
        this.state = "trace";
        this.traceStart = now;
      }
    } else if (this.state === "trace") {
      this.trailProgress = clamp((now - this.traceStart) / 1100, 0, 1);
      for (i = 0; i < this.parts.length; i++) {
        p = this.parts[i];
        p.vx += (p.tx - p.x) * 0.03 - p.vy * 0.14;
        p.vy += (p.ty - p.y) * 0.03 + p.vx * 0.14;
        p.vx *= 0.8; p.vy *= 0.8;
      }
      if (this.trailProgress >= 1) {
        this.state = "burst";
        this.burstStart = now;
        var bx = this.rect.left + this.rect.width / 2;
        var by = this.rect.top + this.rect.height / 2;
        for (i = 0; i < this.parts.length; i++) {
          p = this.parts[i];
          var ang = Math.atan2(p.y - by, p.x - bx) + rand(-0.6, 0.6);
          var sp = rand(2.6, 6.5);
          p.vx = Math.cos(ang) * sp;
          p.vy = Math.sin(ang) * sp;
        }
      }
    } else if (this.state === "burst") {
      if (now - this.burstStart > 850) {
        this.state = "drift";
        this.current = null;
        this.trail = null;
        this.driftUntil = now + 1200;
      }
    }

    // integração
    for (i = 0; i < this.parts.length; i++) {
      p = this.parts[i];
      if (this.state === "drift") {
        p.phase += 0.012 * p.speed;
        p.vx += Math.cos(p.phase * 1.3 + i) * 0.014;
        p.vy += Math.sin(p.phase * 1.1 + i) * 0.014;
        p.vx = clamp(p.vx * 0.985, -1.4, 1.4);
        p.vy = clamp(p.vy * 0.985, -1.4, 1.4);
      } else if (this.state === "burst") {
        p.vx *= 0.955; p.vy *= 0.955;
      }
      var k = dt / 16.667;
      p.x += p.vx * k;
      p.y += p.vy * k;

      if (this.state === "drift") {
        if (p.x < -40) p.x = this.w + 40;
        if (p.x > this.w + 40) p.x = -40;
        if (p.y < -40) p.y = this.h + 40;
        if (p.y > this.h + 40) p.y = -40;
      }
      p.x = clamp(p.x, -50, this.w + 50);
      p.y = clamp(p.y, -50, this.h + 50);
    }

    // desenho
    ctx.globalCompositeOperation = "lighter";
    for (i = 0; i < this.parts.length; i++) {
      p = this.parts[i];
      var pulse = 0.7 + Math.sin(this.frame * 0.05 + p.phase * 3) * 0.3;
      ctx.globalAlpha = p.a * pulse * 0.22;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 3.2, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = p.a * pulse;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
    }

    if (this.rect && this.state === "trace") this.drawTrace(this.rect, this.trailProgress);

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  };

  Enxame.prototype.drawTrace = function (r, progress) {
    var ctx = this.ctx;
    var per = 2 * (r.width + r.height);
    var len = per * progress;
    var steps = Math.max(32, Math.round(per / 12));
    ctx.beginPath();
    for (var i = 0; i <= steps; i++) {
      var t = (len / steps) * i;
      if (t > len) break;
      var pt = pointOnRect(r, t);
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.globalAlpha = 0.42;
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1.1;
    ctx.shadowColor = "rgba(240, 201, 106, .8)";
    ctx.shadowBlur = 9;
    ctx.stroke();
    ctx.shadowBlur = 0;

    var head = pointOnRect(r, len);
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "#fff6da";
    ctx.beginPath();
    ctx.arc(head.x, head.y, 2.4, 0, TAU);
    ctx.fill();
  };

  function boot() {
    window.__czsEnxame = new Enxame();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();