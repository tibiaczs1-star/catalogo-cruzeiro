/* ============================================================
   BADCLAUDE — escolha do tema (cinemática do mascote)
   O visitante clica num tema. O mascote sai correndo pelo trilho,
   passa por TODOS os temas e para no último — que é sempre o
   escolhido. Lá ele empina, ergue a pata e apresenta o tema,
   com confete e o painel de confirmação.
   Funciona com o BadClawd real (servido por http) e tem um
   mascote-canvas embutido como fallback (file:// ou falha).
   ============================================================ */

(function () {
  const THEMES = [
    { id: '01', name: 'Papel Suíço', mood: 'Arquitetura tipográfica', accent: '#e3271c', bg: '#f2f1ee' },
    { id: '02', name: 'Terminal Vivo', mood: 'Shell real, verde-fósforo', accent: '#42f58a', bg: '#07100c' },
    { id: '03', name: 'Editorial Quente', mood: 'Papel creme, serifa grande', accent: '#b03a2e', bg: '#f6efe3' },
    { id: '04', name: 'Espacial 3D', mood: 'Three.js, profundidade real', accent: '#6ee7ff', bg: '#0b0d10' },
    { id: '05', name: 'Brutalista', mood: 'Blocos grossos, zero verniz', accent: '#ff4d3d', bg: '#f0f0ec' },
    { id: '06', name: 'Neon Noturno', mood: 'Ciano e magenta, contidos', accent: '#00e5ff', bg: '#06070d' },
    { id: '07', name: 'Tátil / Clay', mood: 'Massa, sombra longa, acolhedor', accent: '#c2683c', bg: '#e9e2d8' },
    { id: '08', name: 'Grid Técnico', mood: 'Blueprint, cotas, engenharia', accent: '#1e5aa8', bg: '#ffffff' },
    { id: '09', name: 'Cinemático', mood: 'Letterbox, atos, feixe', accent: '#e8e2d6', bg: '#060606' },
    { id: '10', name: 'Kinetic Type', mood: 'Tipografia é a interface', accent: '#ffd400', bg: '#0a0a0a' },
  ];

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let overlay = null;
  let runner = null;
  let abortRun = false;

  /* ---------------- canvas do mascote ---------------- */

  function makeRunner(canvas) {
    let engine = null;
    let fallback = null;

    async function init() {
      try {
        const mod = await import('../../assets/js/pirata.js');
        engine = new mod.Pirata(canvas, { accent: '#22d3ee', bandana: '#e11d2e' });
        engine.setState('run');
      } catch (e) {
        console.warn('[mascote] módulo indisponível:', e.message);
      }
    }

    init();

    return {
      setState(s) { if (engine) engine.setState(s); },
      destroy() { if (engine) engine.destroy(); },
    };
  }

  /* ---------------- overlay ---------------- */

  function buildOverlay() {
    const el = document.createElement('div');
    el.className = 'bcc-overlay';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', 'Escolhendo o tema');
    el.innerHTML = `
      <div class="bcc-glow" aria-hidden="true"></div>
      <header class="bcc-top">
        <span class="bcc-brand">BADCLAUDE</span>
        <span class="bcc-status">o mascote está testando os dez</span>
      </header>
      <div class="bcc-stage">
        <div class="bcc-track" id="bccTrack">
          <div class="bcc-rail" aria-hidden="true"></div>
        </div>
        <canvas class="bcc-runner" id="bccRunner" aria-hidden="true"></canvas>
      </div>
      <footer class="bcc-bottom">
        <span class="bcc-hint">ele corre por todos e para no último</span>
        <button type="button" class="bcc-skip" id="bccSkip">pular corrida</button>
      </footer>
      <div class="bcc-reveal" id="bccReveal" hidden>
        <div class="bcc-card">
          <span class="bcc-kicker">direção escolhida</span>
          <h2 class="bcc-name" id="bccName">—</h2>
          <p class="bcc-mood" id="bccMood">—</p>
          <div class="bcc-actions">
            <a class="bcc-enter" id="bccEnter" href="#">Entrar no site →</a>
            <button type="button" class="bcc-again" id="bccAgain">ver de novo</button>
          </div>
        </div>
      </div>
    `;
    return el;
  }

  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

  async function runCascade(chosenId, root) {
    const track = root.querySelector('#bccTrack');
    const canvasEl = root.querySelector('#bccRunner');
    const statusEl = root.querySelector('.bcc-status');

    // trilho com os 10 temas; o escolhido vai para o fim
    const ordered = THEMES.filter((t) => t.id !== chosenId).concat(THEMES.filter((t) => t.id === chosenId));
    const pills = ordered.map((theme, idx) => {
      const pill = document.createElement('div');
      pill.className = 'bcc-pill';
      pill.dataset.id = theme.id;
      pill.style.setProperty('--acc', theme.accent);
      pill.innerHTML = `<span class="bcc-pnum">${theme.id}</span><span class="bcc-pname">${theme.name}</span>`;
      if (idx === ordered.length - 1) pill.classList.add('is-chosen');
      track.appendChild(pill);
      return { el: pill, theme, idx };
    });

    runner = makeRunner(canvasEl);

    // posições relativas ao palco, após layout
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    const stageRect = root.querySelector('.bcc-stage').getBoundingClientRect();
    const points = pills.map((p) => {
      const r = p.el.getBoundingClientRect();
      return { x: r.left - stageRect.left + r.width / 2, y: r.top - stageRect.top - 18, theme: p.theme, el: p.el };
    });

    canvasEl.style.opacity = '1';
    let current = { x: points[0].x, y: points[0].y };

    function place(x, y) {
      canvasEl.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
    }
    place(current.x, current.y);

    if (REDUCED) {
      points.forEach((p) => p.el.classList.add('is-passed'));
      points[points.length - 1].el.classList.add('is-active');
      await finish(points[points.length - 1].theme, root, points[points.length - 1].el);
      return;
    }

    await wait(520);

    for (let i = 0; i < points.length; i++) {
      if (abortRun) break;
      const to = points[i];
      statusEl.textContent = `${to.theme.id} · ${to.theme.name.toLowerCase()}`;
      const from = current;
      const dur = i === 0 ? 420 : 300;
      const start = performance.now();

      await new Promise((resolve) => {
        function step(now) {
          if (abortRun) return resolve();
          const t = Math.min(1, (now - start) / dur);
          const e = easeInOut(t);
          const x = from.x + (to.x - from.x) * e;
          // pequeno salto entre paradas
          const hop = Math.sin(Math.PI * t) * 14;
          const y = from.y + (to.y - from.y) * e - hop;
          place(x, y);
          if (t < 1) requestAnimationFrame(step);
          else resolve();
        }
        requestAnimationFrame(step);
      });

      to.el.classList.add('is-active');
      await wait(70);
      to.el.classList.add('is-passed');
      to.el.classList.remove('is-active');
      current = { x: to.x, y: to.y };
      place(current.x, current.y);
    }

    const last = points[points.length - 1];
    last.el.classList.add('is-active', 'is-winner');
    place(last.x, last.y - 6);

    // ele empina e ergue a pata
    await wait(140);
    runner.setState('point');
    await wait(560);
    runner.setState('point');
    statusEl.textContent = 'escolha apresentada';

    confetti(root, last.theme.accent);
    await finish(last.theme, root, last.el);
  }

  function confetti(root, accent) {
    if (REDUCED) return;
    const layer = document.createElement('div');
    layer.className = 'bcc-confetti';
    layer.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 26; i++) {
      const bit = document.createElement('i');
      const angle = (Math.PI * 2 * i) / 26;
      const dist = 90 + Math.random() * 150;
      bit.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
      bit.style.setProperty('--dy', `${Math.sin(angle) * dist - 40}px`);
      bit.style.setProperty('--rot', `${Math.random() * 360}deg`);
      bit.style.background = i % 3 === 0 ? '#f7f4ee' : accent;
      bit.style.animationDelay = `${Math.random() * 0.12}s`;
      layer.appendChild(bit);
    }
    const rect = root.querySelector('#bccRunner').getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    layer.style.left = `${rect.left - rootRect.left + rect.width / 2}px`;
    layer.style.top = `${rect.top - rootRect.top + rect.height * 0.5}px`;
    root.appendChild(layer);
    setTimeout(() => layer.remove(), 1400);
  }

  async function finish(theme, root, pill) {
    root.querySelector('#bccName').textContent = theme.name;
    root.querySelector('#bccMood').textContent = theme.mood;
    root.querySelector('#bccEnter').href = `${theme.id}/`;
    root.querySelector('#bccEnter').style.setProperty('--acc', theme.accent);
    root.querySelector('#bccReveal').hidden = false;
    root.querySelector('#bccReveal').classList.add('in');
    root.querySelector('.bcc-status').textContent = 'pronto';
  }

  function close() {
    if (!overlay) return;
    abortRun = true;
    if (runner) { runner.destroy(); runner = null; }
    overlay.classList.add('out');
    const el = overlay;
    overlay = null;
    setTimeout(() => el.remove(), 320);
    document.body.style.overflow = '';
  }

  function open(theme) {
    if (overlay) close();
    abortRun = false;
    overlay = buildOverlay();
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => overlay.classList.add('in'));

    const root = overlay;
    root.querySelector('#bccSkip').addEventListener('click', () => {
      root.querySelectorAll('.bcc-pill').forEach((p) => p.classList.add('is-passed'));
      const last = root.querySelector('.bcc-pill.is-chosen');
      if (last) last.classList.add('is-active', 'is-winner');
      if (runner) runner.setState('point');
      const t = THEMES.find((x) => x.id === theme.id);
      finish(t, root, last);
    });
    root.querySelector('#bccAgain').addEventListener('click', () => { close(); setTimeout(() => open(theme), 260); });
    root.addEventListener('click', (e) => { if (e.target === root) close(); });
    document.addEventListener('keydown', escClose);
    runCascade(theme.id, root);
  }

  function escClose(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', escClose); }
  }

  window.BadChoose = { open, close, themes: THEMES.slice() };
})();