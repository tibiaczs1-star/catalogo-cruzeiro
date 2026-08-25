# Arizona Ranch Cinematic Frames Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconstruir a landing de reserva como uma jornada western cinematográfica feita com imagens exclusivas e frames sequenciais, conduzindo sem interrupção da abertura até mesa, Google e pagamento.

**Architecture:** O HTML será reorganizado em cenas semânticas com camadas de imagem, enquanto módulos JavaScript pequenos controlarão sequência de frames, parallax/scroll, paisagem sonora e navegação para a reserva. O código atual de disponibilidade, Google e Pix permanece como fonte de verdade; apenas sua apresentação e os pontos de integração serão adaptados.

**Tech Stack:** HTML5, CSS 3D transforms e scroll-driven progressive enhancement, JavaScript ES2020 sem framework, Web Audio/HTMLAudio, GPT Imagem para raster, Node `node:test` para regressão.

---

## Estrutura de arquivos

- Criar `pagamentos/reservaranch/cinematic.js`: progressão das cenas, frames, parallax, redução de movimento e preload.
- Criar `pagamentos/reservaranch/soundscape.js`: voz única, desbloqueio por gesto e agenda aleatória de SFX.
- Modificar `pagamentos/reservaranch/index.html`: substituir galerias pela narrativa e integrar o mapa como desfecho.
- Modificar `pagamentos/reservaranch/arizona.css`: visual cinematográfico, camadas 3D, transições e responsividade.
- Modificar `pagamentos/reservaranch/app.js`: preservar reserva/pagamento e delegar narrativa/áudio aos novos módulos.
- Criar `pagamentos/reservaranch/assets/cinematic/manifest.json`: contrato de cenas e frames exclusivos.
- Criar `pagamentos/reservaranch/assets/cinematic/*.webp`: artes finais geradas e otimizadas.
- Criar `pagamentos/reservaranch/assets/sfx/*.mp3`: efeitos locais curtos e normalizados.
- Modificar `tests/arizona-ranch-landing.test.js`: contrato da narrativa, unicidade e ausência de galeria.
- Modificar `tests/arizona-ranch-flow.test.js`: voz única, som ambiente e preservação do fluxo.
- Criar `tests/arizona-ranch-cinematic.test.js`: testes unitários do manifesto e módulos visuais/sonoros.

### Task 1: Fixar o contrato cinematográfico em testes

**Files:**
- Modify: `tests/arizona-ranch-landing.test.js`
- Modify: `tests/arizona-ranch-flow.test.js`
- Create: `tests/arizona-ranch-cinematic.test.js`

- [ ] **Step 1: Substituir o teste de galerias pelo contrato de cenas**

Adicionar verificações equivalentes a:

```js
test("a narrativa usa cenas cinematográficas exclusivas e não uma galeria", () => {
  const html = read("pagamentos", "reservaranch", "index.html");
  assert.doesNotMatch(html, /editorial-gallery|gallery-dialog|gallery-image/);
  ["gate", "trail", "saloon", "stage", "tables"].forEach((scene) => {
    assert.match(html, new RegExp(`data-cinematic-scene=["']${scene}["']`));
  });
  assert.match(html, /id=["']mapa-de-mesas["']/);
});
```

- [ ] **Step 2: Adicionar teste de unicidade e sequência ao novo arquivo**

```js
test("o manifesto não reutiliza arquivo entre cenas", () => {
  const manifest = JSON.parse(read("pagamentos", "reservaranch", "assets", "cinematic", "manifest.json"));
  const files = manifest.scenes.flatMap((scene) => scene.frames);
  assert.equal(new Set(files).size, files.length);
  assert.ok(manifest.scenes.filter((scene) => scene.frames.length >= 3).length >= 4);
});
```

- [ ] **Step 3: Adicionar teste do contrato sonoro**

Verificar que `soundscape.js` exporta `createSoundscape`, contém categorias ambientais e não agenda `openingVoice` após `start()`.

- [ ] **Step 4: Executar os testes e confirmar falha esperada**

Run: `node --test tests/arizona-ranch-landing.test.js tests/arizona-ranch-flow.test.js tests/arizona-ranch-cinematic.test.js`

Expected: FAIL porque o manifesto e os módulos ainda não existem e a galeria antiga permanece.

- [ ] **Step 5: Commit**

```bash
git add tests/arizona-ranch-landing.test.js tests/arizona-ranch-flow.test.js tests/arizona-ranch-cinematic.test.js
git commit -m "test: define jornada cinematografica Arizona Ranch"
```

### Task 2: Produzir as artes-mestras e sequências de frames

**Files:**
- Create: `pagamentos/reservaranch/assets/cinematic/gate-01.webp` até `gate-04.webp`
- Create: `pagamentos/reservaranch/assets/cinematic/trail-01.webp` até `trail-04.webp`
- Create: `pagamentos/reservaranch/assets/cinematic/saloon-01.webp` até `saloon-04.webp`
- Create: `pagamentos/reservaranch/assets/cinematic/stage-01.webp` até `stage-03.webp`
- Create: `pagamentos/reservaranch/assets/cinematic/tables-01.webp`
- Create: `pagamentos/reservaranch/assets/cinematic/manifest.json`

- [ ] **Step 1: Gerar quatro frames da porteira com GPT Imagem**

Usar uma chamada separada por frame, mantendo noite âmbar, câmera baixa, realismo cinematográfico e progressão explícita de porteira fechada até aberta. Proibir texto, logotipo, marca d'água, colagem e repetição de elementos.

- [ ] **Step 2: Gerar quatro frames da estrada**

Criar avanço contínuo pela estrada com cerca, vegetação, cavalo distante e saloon crescendo no horizonte; cada frame deve mudar posição de câmera e poeira sem duplicar composição.

- [ ] **Step 3: Gerar quatro frames da entrada do saloon**

Criar fachada própria do Arizona Ranch e progressão das portas fechadas até visão interna. Reservar área de contraste para texto HTML, sem texto embutido.

- [ ] **Step 4: Gerar três frames de aproximação do palco**

Criar interior coerente com balcão, luz de lampião, pista, palco e mesas; nenhuma pessoa em primeiro plano e nenhuma fotografia anterior reutilizada.

- [ ] **Step 5: Gerar visão superior do salão para sustentar o mapa**

Criar um único fundo limpo, simétrico e legível, com palco como referência espacial e áreas livres onde botões HTML das mesas serão posicionados.

- [ ] **Step 6: Inspecionar todas as imagens**

Abrir cada saída, rejeitar arte com texto deformado, membros anômalos, objetos duplicados, inconsistência forte de luz ou enquadramento incompatível com desktop/mobile.

- [ ] **Step 7: Copiar finais ao projeto e criar manifesto**

```json
{
  "version": 1,
  "scenes": [
    {"id":"gate","frames":["gate-01.webp","gate-02.webp","gate-03.webp","gate-04.webp"]},
    {"id":"trail","frames":["trail-01.webp","trail-02.webp","trail-03.webp","trail-04.webp"]},
    {"id":"saloon","frames":["saloon-01.webp","saloon-02.webp","saloon-03.webp","saloon-04.webp"]},
    {"id":"stage","frames":["stage-01.webp","stage-02.webp","stage-03.webp"]},
    {"id":"tables","frames":["tables-01.webp"]}
  ]
}
```

- [ ] **Step 8: Executar o teste do manifesto**

Run: `node --test tests/arizona-ranch-cinematic.test.js`

Expected: o teste de manifesto passa; módulos ainda falham.

- [ ] **Step 9: Commit**

```bash
git add pagamentos/reservaranch/assets/cinematic
git commit -m "feat: add frames cinematograficos do Arizona Ranch"
```

### Task 3: Implementar motor de frames, parallax e preload

**Files:**
- Create: `pagamentos/reservaranch/cinematic.js`
- Modify: `pagamentos/reservaranch/index.html`
- Modify: `tests/arizona-ranch-cinematic.test.js`

- [ ] **Step 1: Escrever testes para seleção de frame e redução de movimento**

```js
test("frameIndex limita progresso ao intervalo da sequência", () => {
  assert.equal(frameIndex(-1, 4), 0);
  assert.equal(frameIndex(.5, 4), 2);
  assert.equal(frameIndex(2, 4), 3);
});
```

- [ ] **Step 2: Confirmar que o teste falha**

Run: `node --test tests/arizona-ranch-cinematic.test.js`

Expected: FAIL com `frameIndex is not defined`.

- [ ] **Step 3: Implementar API do motor**

O módulo deve expor para testes CommonJS e para o navegador `window.ArizonaCinematic`:

```js
function frameIndex(progress, count) {
  const safe = Math.min(1, Math.max(0, Number(progress) || 0));
  return Math.min(count - 1, Math.floor(safe * count));
}

function initCinematicExperience({ root = document } = {}) {
  // registra cenas, IntersectionObserver, requestAnimationFrame e preload da próxima cena
  // atualiza --scene-progress, --parallax-x, --parallax-y e src do frame ativo
  // retorna destroy() para remover listeners e observers
}
```

- [ ] **Step 4: Criar marcação semântica das cinco cenas**

Cada `<section data-cinematic-scene>` contém `<picture class="cinematic-frame">`, camadas decorativas independentes, texto HTML e CTA. Remover `#galeria`, `.editorial-gallery`, modal e fotos originais da narrativa.

- [ ] **Step 5: Rodar testes do módulo e landing**

Run: `node --test tests/arizona-ranch-cinematic.test.js tests/arizona-ranch-landing.test.js`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add pagamentos/reservaranch/cinematic.js pagamentos/reservaranch/index.html tests/arizona-ranch-cinematic.test.js tests/arizona-ranch-landing.test.js
git commit -m "feat: add motor de narrativa western"
```

### Task 4: Construir a direção visual 3D responsiva

**Files:**
- Modify: `pagamentos/reservaranch/arizona.css`
- Modify: `tests/arizona-ranch-landing.test.js`

- [ ] **Step 1: Adicionar teste estrutural dos efeitos e fallback**

Verificar no CSS: `perspective`, `translate3d`, variáveis `--scene-progress`, `prefers-reduced-motion`, estilos de `.page-turn`, `.dust-layer`, `.cinematic-frame` e mapa legível.

- [ ] **Step 2: Confirmar falha**

Run: `node --test tests/arizona-ranch-landing.test.js`

Expected: FAIL nas novas assinaturas CSS.

- [ ] **Step 3: Implementar sistema visual**

Definir cenas com `min-height` de 140–220svh, painel sticky, camadas com `transform: translate3d(...) scale(...)`, máscaras de virada de página e tinta, luz volumétrica e poeira. O texto deve permanecer em plano estável e não receber zoom que prejudique leitura.

- [ ] **Step 4: Implementar modos mobile e reduced-motion**

Em até 760px, reduzir camadas simultâneas e deslocamento; em `prefers-reduced-motion`, manter pôster estático, opacidade simples e fluxo completo.

- [ ] **Step 5: Rodar teste estrutural**

Run: `node --test tests/arizona-ranch-landing.test.js`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add pagamentos/reservaranch/arizona.css tests/arizona-ranch-landing.test.js
git commit -m "feat: style cinematic western journey"
```

### Task 5: Implementar paisagem sonora variada

**Files:**
- Create: `pagamentos/reservaranch/soundscape.js`
- Create: `pagamentos/reservaranch/assets/sfx/*.mp3`
- Modify: `pagamentos/reservaranch/index.html`
- Modify: `pagamentos/reservaranch/app.js`
- Modify: `tests/arizona-ranch-cinematic.test.js`
- Modify: `tests/arizona-ranch-flow.test.js`

- [ ] **Step 1: Testar sorteio sem repetição imediata**

```js
test("pickNonRepeating não devolve o último efeito quando há alternativa", () => {
  const items = ["wind", "horse", "wood"];
  for (let i = 0; i < 20; i += 1) assert.notEqual(pickNonRepeating(items, "wind", () => 0), "wind");
});
```

- [ ] **Step 2: Confirmar falha**

Run: `node --test tests/arizona-ranch-cinematic.test.js tests/arizona-ranch-flow.test.js`

Expected: FAIL porque `soundscape.js` não existe.

- [ ] **Step 3: Implementar controlador**

```js
function createSoundscape({ voice, effects, random = Math.random, timers = window } = {}) {
  let lastEffect = null;
  let timer = null;
  let voicePlayed = false;
  return {
    async start() { /* toca voice uma vez e agenda primeiro efeito */ },
    setScene(sceneId) { /* prioriza categorias coerentes sem forçar reprodução */ },
    mute(value) { /* controla somente áudio da experiência */ },
    destroy() { if (timer) timers.clearTimeout(timer); }
  };
}
```

Usar intervalo aleatório de 12–32 segundos, volume individual limitado e nenhuma repetição imediata. Tiro distante terá peso baixo e intervalo mínimo maior.

- [ ] **Step 4: Integrar no clique inicial**

`setupOpening()` chama `soundscape.start()` no gesto do botão; remover música contínua do YouTube e a síntese fixa antiga. A abertura continua sem bloquear quando um arquivo falhar.

- [ ] **Step 5: Rodar testes**

Run: `node --test tests/arizona-ranch-cinematic.test.js tests/arizona-ranch-flow.test.js`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add pagamentos/reservaranch/soundscape.js pagamentos/reservaranch/assets/sfx pagamentos/reservaranch/index.html pagamentos/reservaranch/app.js tests/arizona-ranch-cinematic.test.js tests/arizona-ranch-flow.test.js
git commit -m "feat: add ranch soundscape without repeated voice"
```

### Task 6: Integrar narrativa ao mapa, Google e pagamento

**Files:**
- Modify: `pagamentos/reservaranch/index.html`
- Modify: `pagamentos/reservaranch/app.js`
- Modify: `pagamentos/reservaranch/arizona.css`
- Modify: `tests/arizona-ranch-flow.test.js`

- [ ] **Step 1: Escrever teste do CTA e resumo persistente**

Verificar que `data-reserve-cta` leva ao mapa, seleção define `selectedTable`, resumo mostra número/capacidade/valor e avanço abre `login`, seguido de `payment`.

- [ ] **Step 2: Confirmar falha**

Run: `node --test tests/arizona-ranch-flow.test.js`

Expected: FAIL no novo resumo e nos hooks cinematográficos.

- [ ] **Step 3: Integrar o CTA persistente**

Todos os CTAs usam o mesmo helper `scrollToReservation()`; após seleção, o resumo recebe `is-visible` e o foco vai ao botão “Conectar com Google para pagar”.

- [ ] **Step 4: Integrar fundo cinematográfico ao mapa real**

Usar `tables-01.webp` apenas como cenário e manter mesas como botões HTML com estados `✓ Livre` e `✕ Comprada`; nenhuma informação de disponibilidade fica dentro da imagem.

- [ ] **Step 5: Preservar o fluxo de compra**

Manter `flow = ["table", "login", "payment"]`, endpoints, Pix exatos, tratamento de mesa indisponível e identificação Google existentes.

- [ ] **Step 6: Rodar testes de fluxo e domínio**

Run: `node --test tests/arizona-ranch.test.js tests/arizona-ranch-flow.test.js`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add pagamentos/reservaranch/index.html pagamentos/reservaranch/app.js pagamentos/reservaranch/arizona.css tests/arizona-ranch-flow.test.js
git commit -m "feat: connect cinematic journey to table checkout"
```

### Task 7: Verificação local completa e acabamento

**Files:**
- Modify only if defects are found in files already listed.

- [ ] **Step 1: Executar suíte completa**

Run: `node --test tests/arizona-ranch.test.js tests/arizona-ranch-landing.test.js tests/arizona-ranch-flow.test.js tests/arizona-ranch-cinematic.test.js`

Expected: PASS sem testes ignorados.

- [ ] **Step 2: Iniciar servidor local**

Run: `node server.js`

Expected: servidor responde e `/pagamentos/reservaranch/` retorna HTTP 200.

- [ ] **Step 3: Validar visualmente em desktop**

Confirmar abertura, voz única, quatro sequências de frames, parallax, zoom, transições, textos legíveis, CTA, mapa, Google e Pix. Capturar screenshot da abertura, saloon e mapa.

- [ ] **Step 4: Validar visualmente em celular**

Usar viewport aproximado de 390x844; confirmar ausência de cortes, scroll fluido, CTA alcançável, mapa tocável e carga progressiva.

- [ ] **Step 5: Validar áudio**

Confirmar que a voz toca uma vez, que os efeitos variam sem sobreposição incômoda e que falha de áudio não bloqueia a compra.

- [ ] **Step 6: Corrigir apenas defeitos observados e repetir a suíte**

Run: `node --test tests/arizona-ranch*.test.js`

Expected: PASS.

- [ ] **Step 7: Commit final local**

```bash
git add pagamentos/reservaranch tests/arizona-ranch*.test.js
git commit -m "fix: polish Arizona Ranch cinematic reservation"
```

- [ ] **Step 8: Parar antes de publicação**

Apresentar screenshots e evidências locais. Push e deploy Render somente depois de autorização explícita do usuário; após autorização, verificar HTTP e visual da URL pública antes de declarar online.
