"use strict";

/* ============================================================
   CZS — Enxame de agentes
   100 pontos minúsculos chegam junto com a página. Percorrem os blocos
   como se estivessem montando cada parte, com uma etiqueta discreta
   dizendo o que está sendo montado.

   Terminada a montagem, todos se juntam num aglomerado pequeno no canto
   e ficam ali. De longe, o aglomerado acompanha o mouse: só inclina, sem
   perseguir. É a sugestão de que o jornal é cuidado por agentes, sem
   virar enfeite forçado.

   Sem imagem, sem requisição, sem biblioteca. Um canvas só.
   Desliga por completo em movimento reduzido e em economia de dados.
   ============================================================ */

(function () {
  if (window.__czsEnxame) return;

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var saveData = Boolean(conn) && conn.saveData === true;
  if (reduced || saveData) return;

  var TAU = Math.PI * 2;
  var GOLD = "#e0a92c";
  var DOTS = ["#e0a92c", "#f2b945", "#c98f16", "#2f7fa8", "#8a6a1f"];
  var TOTAL = 100;

  function rand(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

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
      "z-index:2147481000;opacity:0;transition:opacity 1s ease";
    this.ctx = this.canvas.getContext("2d");
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    document.body.appendChild(this.canvas);

    this.label = document.createElement("div");
    this.label.setAttribute("aria-hidden", "true");
    this.label.style.cssText =
      "position:fixed;pointer-events:none;z-index:2147481001;opacity:0;" +
      "transition:opacity .45s ease;font:600 9px/1.2 Sora,system-ui,sans-serif;" +
      "letter-spacing:.18em;text-transform:uppercase;color:#f5efe4;white-space:nowrap;" +
      "background:rgba(9,21,38,.72);padding:4px 8px;border-radius:3px";
    document.body.appendChild(this.label);

    this.parts = [];
    this.state = "arrive";
    this.frame = 0;
    this.last = 0;
    this.running = false;
    this.queue = [];
    this.rect = null;
    this.progress = 0;
    this.mouse = { x: -9999, y: -9999 };
    this.anchor = { x: 0, y: 0 };

    this.resize();
    this.spawn();
    this.bind();

    var self = this;
    this.canvas.style.opacity = "1";
    this.arriveAt = performance.now();
    this.play();
    window.setTimeout(function () { self.buildQueue(); self.nextTarget(); }, 900);
  }

  Enxame.prototype.resize = function () {
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.anchor.x = this.w < 720 ? 34 : 60;
    this.anchor.y = this.h - (this.w < 720 ? 150 : 176);
  };

  Enxame.prototype.spawn = function () {
    this.parts = [];
    for (var i = 0; i < TOTAL; i++) {
      var edge = Math.random();
      var sx, sy;
      if (edge < 0.5) { sx = rand(-60, this.w); sy = -30; }
      else if (edge < 0.75) { sx = this.w + 30; sy = rand(0, this.h); }
      else { sx = rand(0, this.w); sy = this.h + 30; }
      this.parts.push({
        x: sx,
        y: sy,
        vx: 0,
        vy: 0,
        r: rand(0.9, 1.9),
        a: rand(0.45, 0.95),
        color: DOTS[(Math.random() * DOTS.length) | 0],
        jitter: rand(0, TAU),
        lag: rand(0.6, 1.5),
        weight: rand(0.6, 1.4)
      });
    }
  };

  Enxame.prototype.bind = function () {
    var self = this;
    window.addEventListener("resize", function () { self.resize(); }, { passive: true });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { self.running = false; clearTimeout(self.timer); }
      else self.play();
    });
    window.addEventListener("pointermove", function (e) {
      self.mouse.x = e.clientX;
      self.mouse.y = e.clientY;
    }, { passive: true });
    window.addEventListener("pointerleave", function () {
      self.mouse.x = -9999;
      self.mouse.y = -9999;
    }, { passive: true });
  };

  Enxame.prototype.play = function () {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.schedule();
  };

  // Timer, e não requestAnimationFrame: rAF não dispara em aba de fundo.
  Enxame.prototype.schedule = function () {
    var self = this;
    clearTimeout(this.timer);
    this.timer = setTimeout(function () {
      if (!self.running) return;
      self.tick(performance.now());
      self.schedule();
    }, 16);
  };

  Enxame.prototype.buildQueue = function () {
    var nodes = document.querySelectorAll(".hero-grid, main section, .lead-card, .adbox");
    var out = [];
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var r = el.getBoundingClientRect();
      if (r.width < 260 || r.height < 100) continue;
      out.push(el);
    }
    // Só o que aparece na primeira tela monta na frente do leitor.
    this.queue = out.slice(0, 4);
  };

  Enxame.prototype.nextTarget = function () {
    if (!this.queue.length) { this.settle(); return; }
    var el = this.queue.shift();
    var r = el.getBoundingClientRect();
    var top = clamp(r.top + 6, 10, this.h - 50);
    var bottom = clamp(r.bottom - 6, top + 50, this.h - 10);
    var left = clamp(r.left + 6, 6, this.w - 50);

    this.rect = {
      left: left,
      top: top,
      width: clamp(r.width - 12, 80, this.w - left - 12),
      height: bottom - top
    };
    this.rect.right = this.rect.left + this.rect.width;
    this.rect.bottom = this.rect.top + this.rect.height;

    this.state = "trace";
    this.mountStart = performance.now();
    this.progress = 0;
    this.showLabel(el);
  };

  Enxame.prototype.showLabel = function (el) {
    var name = "seção";
    if (el.classList.contains("hero-grid")) name = "capa";
    else if (el.id === "servicos") name = "serviços";
    else if (el.id === "feed") name = "notícias";
    else if (el.classList.contains("adbox")) name = "comercial";
    else if (el.querySelector("h2")) {
      name = el.querySelector("h2").textContent.trim().slice(0, 22).toLowerCase();
    }
    this.label.textContent = "montando " + name;
    var r = el.getBoundingClientRect();
    this.label.style.left = Math.round(clamp(r.left + 10, 8, this.w - 170)) + "px";
    this.label.style.top = Math.round(clamp(r.top + 8, 8, this.h - 30)) + "px";
    this.label.style.opacity = "0.85";
  };

  Enxame.prototype.settle = function () {
    this.state = "cluster";
    this.rect = null;
    this.label.style.opacity = "0";
    for (var i = 0; i < this.parts.length; i++) {
      var p = this.parts[i];
      var ang = (i / TOTAL) * TAU;
      var radius = rand(3, 16);
      p.hx = this.anchor.x + Math.cos(ang) * radius;
      p.hy = this.anchor.y + Math.sin(ang) * radius * 0.8;
    }
  };

  Enxame.prototype.tick = function (now) {
    if (!this.running) return;
    var dt = clamp(now - this.last, 8, 48) / 16.667;
    this.last = now;
    this.frame++;

    var ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);

    var i, p;

    if (this.state === "arrive" && now - this.arriveAt > 900) {
      this.state = "idle";
      this.nextTarget();
    }

    if (this.state === "trace" && this.rect) {
      this.progress = clamp((now - this.mountStart) / 1500, 0, 1);
      var per = 2 * (this.rect.width + this.rect.height);
      var head = per * ease(this.progress);
      for (i = 0; i < this.parts.length; i++) {
        p = this.parts[i];
        // Cada agente ocupa um ponto do perímetro, atrás da cabeça.
        var back = (i / this.parts.length) * 42;
        var pt = pointOnRect(this.rect, head - back);
        p.vx += (pt.x - p.x) * 0.06 * p.lag - p.vy * 0.2;
        p.vy += (pt.y - p.y) * 0.06 * p.lag + p.vx * 0.2;
        p.vx *= 0.78; p.vy *= 0.78;
      }
      if (this.progress >= 1) this.nextTarget();
    } else if (this.state === "cluster") {
      for (i = 0; i < this.parts.length; i++) {
        p = this.parts[i];
        p.jitter += 0.02 * p.weight;
        var jx = Math.cos(p.jitter) * 1.4;
        var jy = Math.sin(p.jitter * 1.3) * 1.4;
        p.vx += (p.hx + jx - p.x) * 0.02 * p.lag - p.vy * 0.3;
        p.vy += (p.hy + jy - p.y) * 0.02 * p.lag + p.vx * 0.3;
        p.vx *= 0.9; p.vy *= 0.9;
      }
    } else if (this.state === "idle") {
      this.settle();
    }

    var watchX = 0, watchY = 0;
    if (this.state === "cluster" && this.mouse.x > -9999) {
      watchX = clamp((this.mouse.x - this.anchor.x) / this.w, -1, 1);
      watchY = clamp((this.mouse.y - this.anchor.y) / this.h, -1, 1);
    }

    for (i = 0; i < this.parts.length; i++) {
      p = this.parts[i];
      if (this.state === "cluster") {
        // Observar de longe: inclinação mínima na direção do mouse.
        p.vx += watchX * p.weight * 0.017;
        p.vy += watchY * p.weight * 0.017;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }

    for (i = 0; i < this.parts.length; i++) {
      p = this.parts[i];
      var twinkle = 0.65 + Math.sin(this.frame * 0.06 + p.jitter * 2) * 0.35;
      ctx.globalAlpha = p.a * twinkle * 0.14;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 3, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = p.a * twinkle;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
    }

    if (this.rect && this.state === "trace") {
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(this.rect.left + 0.5, this.rect.top + 0.5, this.rect.width, this.rect.height);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
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