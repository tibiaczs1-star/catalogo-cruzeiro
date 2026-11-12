/* ============================================================
   BADCLAUDE — o enxame montando o site, ao vivo
   Uma cena que mostra os agentes conversando e construindo cada
   parte da página em tempo real: cabeçalho, hero, texto, botão,
   imagem, rodapé. Com efeito de montagem visível.

   Uso:
     import { montarEnxame } from './enxame.js';
     montarEnxame(canvasElemento);
   ============================================================ */

const AGENTES = [
  { id: 'dir', nome: 'Diretor', cor: '#22d3ee', papel: 'visão e prioridades' },
  { id: 'dev', nome: 'Dev', cor: '#8b5cf6', papel: 'código e entrega' },
  { id: 'pesq', nome: 'Pesquisa', cor: '#e879a8', papel: 'referências' },
  { id: 'qa', nome: 'QA', cor: '#10b981', papel: 'qualidade' },
  { id: 'art', nome: 'Arte', cor: '#f5c518', papel: 'forma e cor' },
];

const FALAS = {
  dir: ['Mantém o hero acima da dobra.', 'Esse texto tá longo, corta.', 'Aprovado, segue.', 'Botão precisa de contraste.'],
  dev: ['Compilando o header…', 'Já liguei o grid.', 'Falta o estado de hover.', 'Deploy verde.'],
  pesq: ['Vi três referências parecidas.', 'Essa fonte pesa 40 kB.', 'O concorrente usa o mesmo padrão.', 'Dados de 2025 confirmam.'],
  qa: ['Contraste em AA, ok.', 'Quebrou em 360px.', 'Foco visível, certo.', 'Tempo de carga: 0,9 s.'],
  art: ['Sombra ficou dura.', 'Reduzi o raio da borda.', 'Cor do acento tá boa.', 'Mais espaço entre linhas.'],
};

/* peças que vão sendo montadas, na ordem */
const PECAS = [
  { nome: 'cabeçalho', x: 0.06, y: 0.10, w: 0.88, h: 0.07, cor: '#5b6577' },
  { nome: 'título', x: 0.06, y: 0.24, w: 0.52, h: 0.06, cor: '#e8eef7' },
  { nome: 'título 2', x: 0.06, y: 0.33, w: 0.44, h: 0.06, cor: '#e8eef7' },
  { nome: 'linha', x: 0.06, y: 0.44, w: 0.36, h: 0.025, cor: '#8b93a3' },
  { nome: 'linha 2', x: 0.06, y: 0.49, w: 0.30, h: 0.025, cor: '#8b93a3' },
  { nome: 'botão', x: 0.06, y: 0.58, w: 0.15, h: 0.05, cor: '#22d3ee' },
  { nome: 'imagem', x: 0.66, y: 0.24, w: 0.28, h: 0.32, cor: '#8b5cf6' },
  { nome: 'cartões', x: 0.06, y: 0.72, w: 0.26, h: 0.14, cor: '#334155' },
  { nome: 'cartões 2', x: 0.35, y: 0.72, w: 0.26, h: 0.14, cor: '#334155' },
  { nome: 'rodapé', x: 0.06, y: 0.91, w: 0.88, h: 0.05, cor: '#5b6577' },
];

export function montarEnxame(canvas, opts = {}) {
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let W = 0, H = 0, raf = null, t = 0, visivel = true;
  let construidas = 0;      // quantas peças já foram montadas
  let progresso = 0;        // 0..1 da peça em construção
  let pausa = 0;
  let ciclo = 0;

  /* posições dos agentes em órbita */
  const agentes = AGENTES.map((a, i) => ({
    ...a,
    ang: (i / AGENTES.length) * Math.PI * 2,
    raio: 0,
    x: 0, y: 0,
    falando: 0,
    falaAtual: '',
    proximaFala: 1 + i * 0.7,
    alvo: null,           // peça sendo construída
    energia: 0.4 + Math.random() * 0.6,
  }));

  function medir() {
    const r = canvas.getBoundingClientRect();
    W = Math.max(280, Math.round(r.width || 520));
    H = Math.max(220, Math.round(r.height || 360));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    agentes.forEach((a) => { a.raio = Math.min(W, H) * (0.46 + Math.random() * 0.10); });
  }

  function falar(a) {
    const lista = FALAS[a.id] || ['…'];
    a.falaAtual = lista[Math.floor(Math.random() * lista.length)];
    a.falando = 1;
  }

  /* ---------- desenho ---------- */
  function desenhar() {
    ctx.clearRect(0, 0, W, H);

    /* fundo: grade sutil */
    ctx.strokeStyle = 'rgba(255,255,255,.035)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    /* moldura que representa o site */
    const mx = W * 0.04, my = H * 0.05, mw = W * 0.92, mh = H * 0.90;
    ctx.strokeStyle = 'rgba(255,255,255,.10)';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(mx, my, mw, mh);

    /* barra de título falsa */
    ctx.fillStyle = 'rgba(255,255,255,.05)';
    ctx.fillRect(mx, my, mw, 16);
    ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.arc(mx + 10 + i * 10, my + 8, 3, 0, Math.PI * 2); ctx.fill();
    });

    /* peças: montadas, em construção e pendentes */
    for (let i = 0; i < PECAS.length; i++) {
      const p = PECAS[i];
      const px = mx + p.x * mw, py = my + p.y * mh;
      const pw = p.w * mw, ph = p.h * mh;

      const feita = i < construidas;
      const ativa = i === construidas;

      if (feita) {
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = p.cor;
        ctx.fillRect(px, py, pw, ph);
        ctx.globalAlpha = 1;
      } else if (ativa) {
        /* em construção: preenche da esquerda para a direita */
        const wAtual = pw * Math.min(1, progresso);
        ctx.globalAlpha = 0.28;
        ctx.fillStyle = p.cor;
        ctx.fillRect(px, py, pw, ph);
        ctx.globalAlpha = 1;
        ctx.fillStyle = p.cor;
        ctx.fillRect(px, py, wAtual, ph);

        /* linha de construção brilhante */
        if (wAtual < pw) {
          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(px + wAtual, py - 4);
          ctx.lineTo(px + wAtual, py + ph + 4);
          ctx.stroke();
        }

        /* andaimes */
        ctx.strokeStyle = 'rgba(34,211,238,.30)';
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(px - 2, py - 2, pw + 4, ph + 4);
        ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,.07)';
        ctx.setLineDash([2, 3]);
        ctx.strokeRect(px, py, pw, ph);
        ctx.setLineDash([]);
      }
    }

    /* agentes em órbita */
    const cx = W / 2, cy = H / 2;
    agentes.forEach((a) => {
      a.ang += 0.0016 + a.energia * 0.0012;
      const alvoX = cx + Math.cos(a.ang) * a.raio * 1.12;
      const alvoY = cy + Math.sin(a.ang) * a.raio * 0.72;
      a.x += (alvoX - a.x) * 0.06;
      a.y += (alvoY - a.y) * 0.06;

      /* rastro */
      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = a.cor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(cx + Math.cos(a.ang - 0.18) * a.raio * 1.12, cy + Math.sin(a.ang - 0.18) * a.raio * 0.72);
      ctx.stroke();
      ctx.globalAlpha = 1;

      /* aura */
      const g = ctx.createRadialGradient(a.x, a.y, 2, a.x, a.y, 22);
      g.addColorStop(0, a.cor + '55');
      g.addColorStop(1, a.cor + '00');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(a.x, a.y, 22, 0, Math.PI * 2); ctx.fill();

      /* corpo */
      ctx.fillStyle = a.cor;
      ctx.beginPath(); ctx.arc(a.x, a.y, 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#07080c';
      ctx.beginPath(); ctx.arc(a.x - 1.6, a.y - 1, 1.1, 0, Math.PI * 2); ctx.arc(a.x + 1.6, a.y - 1, 1.1, 0, Math.PI * 2); ctx.fill();

      /* balão de fala */
      if (a.falando > 0.02) {
        const alpha = Math.min(1, a.falando * 1.6);
        const texto = a.falaAtual;
        ctx.font = '600 9.5px Inter, sans-serif';
        const larg = ctx.measureText(texto).width + 16;
        const bx = a.x - larg / 2, by = a.y - 34;
        ctx.globalAlpha = alpha;

        ctx.fillStyle = 'rgba(10,12,18,.92)';
        ctx.strokeStyle = a.cor + '88';
        ctx.lineWidth = 1;
        const r = 7;
        ctx.beginPath();
        ctx.roundRect(bx, by, larg, 20, r);
        ctx.fill(); ctx.stroke();

        /* rabicho */
        ctx.beginPath();
        ctx.moveTo(a.x - 4, by + 20);
        ctx.lineTo(a.x, by + 26);
        ctx.lineTo(a.x + 4, by + 20);
        ctx.fillStyle = 'rgba(10,12,18,.92)';
        ctx.fill();

        ctx.fillStyle = '#e8eef7';
        ctx.textAlign = 'center';
        ctx.fillText(texto, a.x, by + 13.5);
        ctx.textAlign = 'left';
        ctx.globalAlpha = 1;
      }

      /* nome */
      ctx.font = '600 8.5px "JetBrains Mono", monospace';
      ctx.fillStyle = a.cor + 'cc';
      ctx.textAlign = 'center';
      ctx.fillText(a.nome.toUpperCase(), a.x, a.y + 18);
      ctx.textAlign = 'left';
    });

    /* progresso no rodapé */
    const total = PECAS.length;
    const pct = Math.min(100, Math.round(((construidas + progresso) / total) * 100));
    ctx.font = '600 9px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(232,238,247,.55)';
    ctx.fillText('MONTANDO · ' + pct + '%', mx + 2, my + mh + 18);

    /* barra de progresso */
    const bw = mw * 0.5;
    ctx.fillStyle = 'rgba(255,255,255,.08)';
    ctx.fillRect(mx + mw - bw, my + mh + 12, bw, 4);
    ctx.fillStyle = '#22d3ee';
    ctx.fillRect(mx + mw - bw, my + mh + 12, bw * (pct / 100), 4);
  }

  /* ---------- ciclo ---------- */
  function passo() {
    raf = requestAnimationFrame(passo);
    if (!visivel) return;
    if (reduzido) { desenhar(); return; }

    t += 0.016;

    /* falas */
    agentes.forEach((a) => {
      a.falando = Math.max(0, a.falando - 0.0055);
      a.proximaFala -= 0.016;
      if (a.proximaFala <= 0 && a.falando <= 0) {
        falar(a);
        a.proximaFala = 2.6 + Math.random() * 3.4;
      }
    });

    /* construção */
    if (pausa > 0) {
      pausa -= 0.016;
    } else if (construidas >= PECAS.length) {
      pausa -= 0.016;
      if (pausa <= -1.6) {
        construidas = 0; progresso = 0; ciclo += 1;
        agentes.forEach((a) => { a.proximaFala = Math.random() * 1.5; });
      }
    } else {
      progresso += 0.006 + construidas * 0.0016;
      if (progresso >= 1) {
        progresso = 0;
        construidas += 1;
        /* um agente comemora */
        const a = agentes[Math.floor(Math.random() * agentes.length)];
        a.falando = 0; a.proximaFala = 0;
        pausa = 0.06 + Math.random() * 0.18;
      }
    }

    desenhar();
  }

  medir();
  window.addEventListener('resize', medir, { passive: true });

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { visivel = e.isIntersecting; }), { rootMargin: '120px' });
    io.observe(canvas);
  }

  raf = requestAnimationFrame(passo);

  return {
    parar() { cancelAnimationFrame(raf); },
    get progresso() { return construidas / PECAS.length; },
  };
}