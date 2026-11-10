"use strict";

/* ============================================================
   CZS — Swarm Rebuild
   Inspirado no repositório MIT JoelBastoneLopez/swarm-rebuild.

   O portal "se monta" na frente do leitor: um bando de cursores
   multiplayer percorre a página, desenha as caixas de cada bloco com
   medida em px e digita os títulos. Depois, o site real aparece por
   baixo e a camada sai.

   Roda uma vez por sessão. Esc ou o botão "Ver pronto" cancelam.
   Desliga por completo em movimento reduzido e em economia de dados.

   Implementação própria e enxuta: mede só os blocos grandes da
   primeira tela, não a árvore inteira. Nada de áudio.
   ============================================================ */

(function () {
  if (window.__czsSwarmRebuild) return;

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var saveData = Boolean(conn) && conn.saveData === true;
  if (reduced || saveData) return;

  var STORAGE_KEY = "czs-swarm-rebuild-seen";
  var params = new URLSearchParams(window.location.search || "");
  var forced = params.get("rebuild") === "1";
  var skipped = params.get("rebuild") === "0";
  if (skipped) return;
  if (!forced) {
    try { if (sessionStorage.getItem(STORAGE_KEY) === "1") return; } catch (_e) {}
  }

  var NS = "http://www.w3.org/2000/svg";
  var BLUE = "#0D99FF";
  var GOLD = "#d4a843";
  var NAMES = ["Ada", "Grace", "Alan", "Radia", "Hedy", "Ken", "Barbara", "Guido", "Frances", "Tim", "Joan", "Vint"];
  var COLORS = ["#0D99FF", "#d4a843", "#A259FF", "#0ACF83", "#F24E1E", "#00B5CE"];

  var rand = function (a, b) { return a + Math.random() * (b - a); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  function el(tag, cls, style) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (style) n.setAttribute("style", style);
    return n;
  }

  function svgEl(tag, attrs) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
    return n;
  }

  /* ---------- 1. Medir os blocos que vão ser montados ---------- */

  function blueprint() {
    var nodes = document.querySelectorAll(
      ".hero-grid, main section, .lead-card, .adbox, .service-card"
    );
    var out = [];
    var vw = window.innerWidth, vh = window.innerHeight;
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var r = node.getBoundingClientRect();
      if (r.width < 240 || r.height < 80) continue;
      if (r.bottom < 0 || r.top > vh) continue;
      var text = "";
      var h = node.querySelector("h1, h2, h3");
      if (h) text = (h.textContent || "").trim().slice(0, 70);
      out.push({
        x: r.left, y: r.top, w: r.width, h: r.height,
        text: text
      });
      if (out.length >= 5) break;
    }
    return out;
  }

  /* ---------- 2. Cursores ---------- */

  function Cursor(name, color, startX, startY) {
    var g = svgEl("g", { opacity: "0" });
    var path = svgEl("path", {
      d: "M0 0 L0 15 L4 11.5 L6.5 17 L9 16 L6.5 10.5 L11.5 10 Z",
      fill: color,
      stroke: "#08131f",
      "stroke-width": "0.7"
    });
    var label = svgEl("text", {
      x: "13", y: "16",
      fill: "#fff",
      "font-size": "9",
      "font-family": "Sora, system-ui, sans-serif",
      "font-weight": "600"
    });
    label.textContent = name;
    var tagBg = svgEl("rect", {
      x: "12", y: "7", width: String(name.length * 5.6 + 6), height: "12",
      rx: "2.5", fill: color
    });
    g.appendChild(path);
    g.appendChild(tagBg);
    g.appendChild(label);
    g.style.transform = "translate3d(" + startX + "px," + startY + "px,0)";
    this.g = g;
    this.x = startX;
    this.y = startY;
    this.tx = startX;
    this.ty = startY;
    this.vx = 0;
    this.vy = 0;
    this.color = color;
  }

  Cursor.prototype.go = function (x, y) { this.tx = x; this.ty = y; };

  Cursor.prototype.step = function (dt) {
    var dx = this.tx - this.x, dy = this.ty - this.y;
    this.vx += dx * 0.06 - this.vy * 0.18;
    this.vy += dy * 0.06 + this.vx * 0.18;
    this.vx *= 0.76;
    this.vy *= 0.76;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.g.style.transform = "translate3d(" + this.x.toFixed(1) + "px," + this.y.toFixed(1) + "px,0)";
  };

  Cursor.prototype.settle = function () {
    return Math.hypot(this.tx - this.x, this.ty - this.y) < 3;
  };

  /* ---------- 3. Cena ---------- */

  function build(boxes) {
    var root = el("div", "czs-swarm", [
      "position:fixed", "inset:0", "z-index:2147483000",
      "pointer-events:none", "overflow:hidden"
    ].join(";"));
    root.id = "czs-swarm-rebuild";

    // Fundo: a página some atrás de um véu de tinta.
    var veil = el("div", "czs-swarm-veil", [
      "position:absolute", "inset:0",
      "background:#0b1520",
      "opacity:0", "transition:opacity .7s ease"
    ].join(";"));
    root.appendChild(veil);

    var svg = svgEl("svg", {
      width: "100%", height: "100%",
      style: "position:absolute;inset:0;overflow:visible"
    });
    var cursorLayer = svgEl("g", {});
    var drawLayer = svgEl("g", {});
    svg.appendChild(drawLayer);
    svg.appendChild(cursorLayer);
    root.appendChild(svg);

    // Aviso honesto: é uma reconstrução, não o site travado.
    var dock = el("div", "", [
      "position:absolute", "left:50%", "bottom:22px", "transform:translateX(-50%)",
      "display:flex", "align-items:center", "gap:12px",
      "padding:9px 14px", "border-radius:999px",
      "background:rgba(9,21,38,.9)", "border:1px solid rgba(233,240,255,.16)",
      "color:#e9f0ff", "font:600 11px/1 Sora,system-ui,sans-serif",
      "letter-spacing:.1em", "text-transform:uppercase", "pointer-events:auto"
    ].join(";"));
    var status = el("span", "", "opacity:.7");
    status.textContent = "reconstruindo";
    var skip = el("button", "", [
      "font:inherit", "font-size:10px", "letter-spacing:.08em",
      "background:#fff", "color:#0b1520", "border:0", "border-radius:999px",
      "padding:7px 12px", "cursor:pointer"
    ].join(";"));
    skip.textContent = "Ver pronto";
    dock.appendChild(status);
    dock.appendChild(skip);
    root.appendChild(dock);

    document.body.appendChild(root);
    requestAnimationFrame(function () { veil.style.opacity = "1"; });

    var cursorCount = boxes.length > 2 ? 12 : 8;
    var cursors = [];
    for (var i = 0; i < cursorCount; i++) {
      var c = new Cursor(
        NAMES[i % NAMES.length],
        COLORS[i % COLORS.length],
        rand(0, window.innerWidth),
        rand(0, window.innerHeight)
      );
      cursorLayer.appendChild(c.g);
      cursors.push(c);
    }

    var cancelled = false;
    function cancel() { cancelled = true; }

    skip.addEventListener("click", cancel);
    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape") cancel();
    }, { once: true });

    var last = performance.now();
    var running = true;
    function loop() {
      if (!running) return;
      var now = performance.now();
      var dt = clamp((now - last) / 16.667, 0.2, 3);
      last = now;
      for (var k = 0; k < cursors.length; k++) cursors[k].step(dt);
      // As caixas e o texto entram em opacidade junto com o cursor.
      for (var m = 0; m < cursorLayer.children.length; m++) {
        cursorLayer.children[m].setAttribute("opacity", "1");
      }
      setTimeout(loop, 16);
    }
    setTimeout(loop, 16);

    return {
      root: root,
      veil: veil,
      svg: svg,
      draw: drawLayer,
      cursors: cursors,
      status: status,
      isCancelled: function () { return cancelled; },
      stop: function () { running = false; }
    };
  }

  /* ---------- 4. Desenho de cada bloco ---------- */

  function drawBox(scene, box, cursor, index) {
    return new Promise(function (resolve) {
      var g = svgEl("g", { opacity: "0" });
      var rect = svgEl("rect", {
        x: box.x, y: box.y, width: "0", height: box.h,
        fill: "none", stroke: BLUE, "stroke-width": "1.4",
        rx: "3"
      });
      var measure = svgEl("text", {
        x: String(box.x + 4), y: String(box.y - 5),
        fill: BLUE, "font-size": "9.5",
        "font-family": "Sora, system-ui, sans-serif",
        "font-weight": "600"
      });
      measure.textContent = Math.round(box.w) + " × " + Math.round(box.h);
      g.appendChild(rect);
      g.appendChild(measure);
      scene.draw.appendChild(g);

      var start = performance.now();
      var dur = 380 + index * 90;

      // O cursor vai até o canto superior esquerdo e "arrasta" a caixa.
      cursor.go(box.x, box.y);

      var tick = function () {
        var t = clamp((performance.now() - start) / dur, 0, 1);
        g.setAttribute("opacity", String(clamp(t * 3, 0, 1)));
        rect.setAttribute("width", String(easeOut(t) * box.w));
        if (t < 1) requestAnimationFrame(tick);
        else { measure.setAttribute("opacity", "1"); resolve(); }
      };
      requestAnimationFrame(tick);
    });
  }

  function typeText(scene, box, text, cursor) {
    if (!text) return Promise.resolve();
    return new Promise(function (resolve) {
      var node = svgEl("text", {
        x: String(box.x + 10), y: String(box.y + 28),
        fill: "#eef4ff", "font-size": "13",
        "font-family": "Fraunces, Georgia, serif",
        "font-weight": "700"
      });
      scene.draw.appendChild(node);
      cursor.go(box.x + 10, box.y + 24);
      var i = 0;
      var timer = setInterval(function () {
        i += 1;
        node.textContent = text.slice(0, i);
        if (i >= text.length) { clearInterval(timer); resolve(); }
      }, 22);
    });
  }

  /* ---------- 5. Roteiro ---------- */

  async function run() {
    var boxes = blueprint();
    if (!boxes.length) { done(); return; }

    var scene = build(boxes);

    try { sessionStorage.setItem(STORAGE_KEY, "1"); } catch (_e) {}

    await wait(760);

    for (var i = 0; i < boxes.length; i++) {
      if (scene.isCancelled()) break;
      var box = boxes[i];
      var cursor = scene.cursors[i % scene.cursors.length];
      await drawBox(scene, box, cursor, i);
      if (box.text) await typeText(scene, box, box.text, cursor);
      await wait(180);
    }

    if (!scene.isCancelled()) {
      scene.status.textContent = "pronto";
      await wait(520);
    }

    // Devolve o site real.
    scene.veil.style.opacity = "0";
    scene.svg.style.transition = "opacity .5s ease";
    scene.svg.style.opacity = "0";
    scene.root.style.pointerEvents = "none";
    await wait(560);
    scene.stop();
    if (scene.root.parentNode) scene.root.parentNode.removeChild(scene.root);
    done();
  }

  function done() {
    try { document.documentElement.classList.add("czs-swarm-done"); } catch (_e) {}
  }

  // Só roda quando a página estiver estável: evita medir durante o carregamento.
  function boot() {
    window.setTimeout(function () {
      run().catch(function () { done(); });
    }, forced ? 260 : 1500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();