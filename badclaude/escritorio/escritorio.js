/* ============================================================
   BADCLAUDE — escritório dos agentes (ao vivo)
   Cópia adaptada do escritório Unicenter, ligada só à presença
   do BADCLAUDE. Sem servidor local: lê o snapshot do backend e
   recebe atualizações por SSE.

   Uso:
     <canvas id="officeCanvas"></canvas>
     <script type="module" src="escritorio/escritorio.js"></script>
   ou, programaticamente:
     import { montarEscritorio } from './escritorio/escritorio.js';
     montarEscritorio(canvasEl);
   ============================================================ */

const ASSETS = '/badclaude/escritorio/assets/';

/* os mesmos sprites e posições do escritório Unicenter original */
const CADEIRAS = [
  { sprite: 'director_executive.png', nome: 'Diretor', x: 0.30, y: 0.28 },
  { sprite: 'godot_senior_dev.png', nome: 'Dev Senior', x: 0.48, y: 0.30 },
  { sprite: 'ai_researcher.png', nome: 'Pesquisador', x: 0.62, y: 0.32 },
  { sprite: 'qa_auditor.png', nome: 'Auditor QA', x: 0.76, y: 0.28 },
  { sprite: 'infra_devops.png', nome: 'Infra', x: 0.86, y: 0.45 },
  { sprite: 'concept_artist.png', nome: 'Artista', x: 0.22, y: 0.55 },
  { sprite: 'sound_designer.png', nome: 'Som', x: 0.38, y: 0.60 },
  { sprite: 'community_lead.png', nome: 'Comunidade', x: 0.14, y: 0.30 },
];

const IMG = {};
function carregarImagens() {
  const nomes = [
    'floor_wood_noble.png', 'floor_parquet_oak.png', 'floor_tech_slate.png',
    'wall_texture_limezu.png', 'wall_north_window.png',
    'office_desk_executive.png', 'office_dev_station.png', 'office_server_rack.png',
    'office_plant_ficus.png', 'office_reception_desk.png', 'office_leather_sofa.png',
    'office_bench_judge.png', 'office_audio_desk.png', 'soft_shadow_ellipse.png',
    ...CADEIRAS.map((c) => c.sprite),
  ];
  for (const nome of nomes) {
    const img = new Image();
    img.src = ASSETS + nome;
    IMG[nome] = img;
  }
}

export function montarEscritorio(canvas, opts = {}) {
  if (!canvas) return null;
  const API = opts.api || '/badclaude/api/presenca';
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  carregarImagens();

  const TAU = Math.PI * 2;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0, raf = null, fonte = null, t = 0;

  // estado: papel do sprite -> item de presença
  let agentes = new Map();
  let transicao = new Map(); // id -> alpha 0..1

  function medir() {
    const r = canvas.getBoundingClientRect();
    W = Math.max(320, Math.round(r.width || 640));
    H = Math.max(200, Math.round(r.height || 280));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function posicao(papel, indice) {
    const base = CADEIRAS.find((c) => c.sprite === papel) || CADEIRAS[indice % CADEIRAS.length];
    return { x: base.x * W, y: base.y * H, sprite: base.sprite, nome: base.nome };
  }

  function aplicar(snapshot) {
    const lista = snapshot.agentesLista || [];
    const vistos = new Set();
    lista.forEach((a, i) => {
      const chave = a.papel ? `${a.papel}.png` : CADEIRAS[i % CADEIRAS.length].sprite;
      const chaveFinal = IMG[chave] ? chave : CADEIRAS[i % CADEIRAS.length].sprite;
      vistos.add(a.id);
      const pos = posicao(chaveFinal, i);
      const x = Number(pos.x) || 0;
      const y = Number(pos.y) || 0;
      agentes.set(a.id, { ...a, ...pos, x, y, px: x, py: y, f: Math.random() * 6, alvo: { x, y } });
      if (!transicao.has(a.id)) transicao.set(a.id, 0);
    });
    for (const id of [...agentes.keys()]) {
      if (!vistos.has(id)) transicao.set(id, 0.99); // vai apagar
    }
    desenharRotuloAtual();
  }

  function remover(id) { transicao.set(id, 0.99); }

  function andar(a) {
    // pequena perambulação só para quem trabalha
    if (!Number.isFinite(a.px)) { a.px = a.x; a.py = a.y; }
    if (!Number.isFinite(a.f)) a.f = 0;
    a.f += 0.02;
    if (a.estado !== 'trabalhando') return;
    a.px = a.x + Math.sin(a.f * 1.3) * 7;
    a.py = a.y + Math.cos(a.f * 0.9) * 4;
  }

  function frame() {
    raf = requestAnimationFrame(frame);
    if (document.hidden) return;
    t += 0.016;

    // piso de madeira ou fallback
    ctx.fillStyle = '#1a1611';
    ctx.fillRect(0, 0, W, H);
    const piso = IMG['floor_wood_noble.png'];
    if (piso && piso.complete && piso.naturalWidth) {
      const s = 64;
      for (let fy = H * 0.34; fy < H; fy += s) {
        for (let fx = 0; fx < W; fx += s) ctx.drawImage(piso, fx, fy, s, s);
      }
    }
    // parede de fundo
    const parede = IMG['wall_texture_limezu.png'];
    if (parede && parede.complete && parede.naturalWidth) {
      for (let fx = 0; fx < W; fx += 128) ctx.drawImage(parede, fx, 0, 128, H * 0.34);
    } else {
      ctx.fillStyle = '#232833';
      ctx.fillRect(0, 0, W, H * 0.34);
    }

    // mesas
    for (const a of agentes.values()) {
      const mesa = IMG[a.sprite === 'director_executive.png' ? 'office_desk_executive.png'
        : a.sprite === 'infra_devops.png' ? 'office_server_rack.png'
        : a.sprite === 'community_lead.png' ? 'office_reception_desk.png'
        : 'office_dev_station.png'];
      if (mesa && mesa.complete && mesa.naturalWidth) {
        ctx.drawImage(mesa, a.x - 34, a.y - 20, 68, 46);
      } else {
        ctx.fillStyle = '#1d212b';
        ctx.beginPath(); ctx.roundRect(a.x - 34, a.y - 20, 68, 46, 5); ctx.fill();
      }
    }

    // agentes
    for (const [id, a] of agentes) {
      let alpha = transicao.get(id) || 0;
      if (alpha >= 0.99) {
        alpha -= 0.06;
        transicao.set(id, alpha);
        if (alpha <= 0) { agentes.delete(id); transicao.delete(id); continue; }
      } else {
        alpha = Math.min(1, alpha + 0.06);
        transicao.set(id, alpha);
      }
      andar(a);
      const px = Number.isFinite(a.px) ? a.px : a.x;
      const py = Number.isFinite(a.py) ? a.py : a.y;
      if (!Number.isFinite(px) || !Number.isFinite(py)) continue;
      const trabalhando = a.estado === 'trabalhando';

      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);

      // sombra
      ctx.globalAlpha = Math.max(0, alpha) * 0.3;
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.ellipse(px, py + 30, 20, 6, 0, 0, TAU); ctx.fill();
      ctx.globalAlpha = Math.max(0, alpha);

      // aura de trabalho
      if (trabalhando) {
        const g = ctx.createRadialGradient(px, py, 4, px, py, 34);
        g.addColorStop(0, 'rgba(34,211,238,.25)');
        g.addColorStop(1, 'rgba(34,211,238,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(px, py, 34, 0, TAU); ctx.fill();
      }

      const spr = IMG[a.sprite];
      if (spr && spr.complete && spr.naturalWidth) {
        // folha de animação 3x4: recorta o primeiro quadro (48x64 de 96x128)
        const cols = 4, rows = 4;
        const fw = spr.naturalWidth / cols;
        const fh = spr.naturalHeight / rows;
        const bob = trabalhando ? Math.sin(t * 2.2 + (a.f || 0)) * 2 : 0;
        ctx.drawImage(spr, 0, 0, fw, fh, px - 24, py - 58 + 26 + bob, 48, 64);
      } else {
        // fallback desenhado
        ctx.fillStyle = trabalhando ? '#22d3ee' : '#4b5363';
        ctx.beginPath(); ctx.roundRect(px - 9, py - 6, 18, 22, 6); ctx.fill();
        ctx.beginPath(); ctx.arc(px, py - 14, 8, 0, TAU); ctx.fill();
      }

      // nome
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(7,8,10,.55)';
      ctx.font = '600 10px Inter, sans-serif';
      ctx.fillText(a.nome, px, py + 44);
      ctx.fillStyle = trabalhando ? '#8ff3ff' : 'rgba(180,186,198,.75)';
      ctx.fillText(a.nome, px, py + 43);

      ctx.restore();
    }

    // marca d'água
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#e8eef7';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('ESCRITÓRIO BADCLAUDE', 12, H - 10);
    ctx.globalAlpha = 1;
  }

  function desenharRotuloAtual() {
    const el = document.querySelector('[data-escritorio-status]');
    if (!el) return;
    const n = agentes.size;
    el.textContent = n ? `${n} agente${n > 1 ? 's' : ''} online` : 'escritório vazio';
  }

  async function sincronizar() {
    try {
      const res = await fetch(API + '?publico=1');
      const data = await res.json();
      aplicar(data);
    } catch (e) { /* sem servidor: escritório vazio */ }
  }

  function conectar() {
    if (typeof EventSource === 'undefined') return;
    try {
      fonte = new EventSource('/badclaude/api/presenca/eventos');
      fonte.addEventListener('hello', (e) => {
        try { const d = JSON.parse(e.data); if (d.snapshot) aplicar(d.snapshot); } catch (err) {}
      });
      ['entra', 'atualiza'].forEach((ev) => fonte.addEventListener(ev, () => sincronizar()));
      fonte.addEventListener('saiu', (e) => {
        try { const d = JSON.parse(e.data); if (d.id) remover(d.id); } catch (err) {}
      });
    } catch (e) {}
  }

  medir();
  window.addEventListener('resize', medir, { passive: true });
  sincronizar();
  conectar();
  raf = requestAnimationFrame(frame);

  return {
    atualizar: sincronizar,
    parar() {
      cancelAnimationFrame(raf);
      if (fonte) fonte.close();
    },
    get total() { return agentes.size; },
  };
}