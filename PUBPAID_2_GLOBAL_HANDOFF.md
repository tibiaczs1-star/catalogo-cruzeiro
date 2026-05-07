# PubPaid 2.0 - Retomada Global

Este arquivo existe para qualquer conta, agente ou sessao conseguir continuar a PubPaid 2.0 mesmo que o projeto/thread antigo nao apareca mais na lista do app.

## Entrada oficial

- Pagina: `pubpaid-v2.html`
- Runtime: `pubpaid-phaser/`
- Estilo principal: `pubpaid-phaser.css`
- Assets: `assets/pubpaid/`
- Memoria viva: `CODEX_MEMORY.md` e `.codex-memory/`

## Como retomar em qualquer conta

1. Abrir o workspace `C:\Users\junio\projeto codex`.
2. Ler este arquivo.
3. Ler `.codex-memory/current-state.md` e `.codex-memory/handoff.md`.
4. Procurar no `CODEX_MEMORY.md` por `PubPaid 2.0`.
5. Rodar `npm start`.
6. Abrir `http://127.0.0.1:3000/pubpaid-v2.html`.

Se outro agente assumir, a primeira frase de comando recomendada e:

```text
Continue a PubPaid 2.0 lendo PUBPAID_2_GLOBAL_HANDOFF.md, CODEX_MEMORY.md e .codex-memory/ antes de editar.
```

## Estado atual

A frente correta e a PubPaid 2.0 em Phaser/canvas com UI DOM, nao a `pubpaid.html` antiga.

Fluxo atual:

```text
Intro -> Escolha de personagem -> Carro deixa o protagonista na rua -> Porta -> Salao -> Garcom -> Lobby DOM -> Oponente IA -> Aposta -> Confirmacao -> Tela do jogo
```

Primeiros jogos:

- Dardos: cena Phaser com comando/resultado via UI DOM.
- Dama: tabuleiro DOM com selecao, captura obrigatoria simples, IA local e resultado.

## Direcao visual fixa

- A lei visual detalhada esta em `PUBPAID_2_VISUAL_DIRECTION.md`; seguir antes de qualquer arte nova.
- O prompt master de NPCs esta em `PUBPAID_V2_NPC_PIXEL_ART_MASTER_PROMPT.md`; o protocolo operacional de personagens e pedestres esta em `PUBPAID_2_CHARACTER_ART_PROMPT.md`.
- Toda arte humana nova deve ser entregue antes em HTML simples de aprovacao, como `pubpaid-character-approval.html`.
- Pixel art bitmap semi-realista.
- Nada de personagem final desenhado por canvas/procedural.
- Adultos no mundo: 105-130 px no primeiro plano, 75-100 px no meio e 50-75 px no fundo.
- Carros, moto e cachorro antigos continuam fora do runtime ate existir pacote visual coerente.
- Reintroduzir vida aos poucos, sempre com escala aprovada.
- Comparar artes novas sempre fora do runtime, em HTML/preview separado; nao trocar carros, motos, NPCs ou fundo da rua para comparar.
- Antes de concluir rodada visual, rodar `npm run pubpaid:visual-audit`. Se o audit apontar canvas/procedural/visual moderno, nao concluir como aprovado.

## Ultima retomada aplicada

Foram criados sprites recortados em:

- `assets/pubpaid/sprites/adult-standing-tight-v1.png`
- `assets/pubpaid/sprites/guest-seated-tight-v1.png`
- `assets/pubpaid/sprites/singer-stage-tight-v1.png`

Arquivos ligados a essa retomada:

- `pubpaid-phaser/scenes/BootScene.js`
- `pubpaid-phaser/scenes/StreetScene.js`
- `pubpaid-phaser/scenes/InteriorScene.js`
- `pubpaid-v2.html`
- `assets/pubpaid/PUBPAID_ASSET_SOURCES.md`
- `PUBPAID_VISUAL_SCALE_GUIDE.md`

## Ajuste visual mais recente

Em 2026-05-05, a chegada da rua e os veiculos foram corrigidos localmente:

- `assets/pubpaid/traffic/pubpaid-traffic-artistic-left-3f-v16.png`
- `assets/pubpaid/traffic/pubpaid-traffic-artistic-left-3f-v16.json`
- `pubpaid-phaser/app.js`
- `pubpaid-phaser/scenes/BootScene.js`
- `pubpaid-phaser/scenes/StreetScene.js`

Motivo: a rua comecava antes da escolha, a seta acima do player estava feia, o player parecia por cima dos carros, e o sheet anterior cortava os capacetes das motos. O `v16` deriva do `v15`, mantendo carros/van corrigidos e estabilizando as duas linhas de motos com o melhor frame replicado nos 3 frames para acabar com flicker de transparencia dentro da mesma animacao. A escolha agora vem antes da cena; depois da escolha, o carro deixa o protagonista na rua e a bolinha verde marca a revelacao. A carteira tambem fecha com ESC como acao de jogo, anima o celular voltando para o bolso e o menu aberto por Enter usa sprites bitmap pixel art opacos (`assets/pubpaid/ui/pubpaid-wallet-phone-ui-v2.png` e `pubpaid-wallet-pixel-digits-v1.png`), sem shell procedural no Phaser. Nao voltar para `v1`/`v2`/`v5`/`v14` sem ordem explicita.

## Ajuste visual atual

Em 2026-05-05, apos feedback de que o fundo/NPCs e uma moto pareciam canvas/procedural:

- `pubpaid-phaser/core/spriteFactory.js` deixou de fabricar personagens por `document.createElement("canvas")`; agora so expoe chaves/helpers.
- `pubpaid-phaser/scenes/IntroScene.js` nao cria mais textura por `createCanvas`.
- Naquela etapa, `pubpaid-phaser/scenes/BootScene.js` passou a carregar `assets/pubpaid/background/pubpaid-street-ambient-life-4f-v6.png`, `assets/pubpaid/traffic/pubpaid-traffic-artistic-left-3f-v19.png` e spritesheets `assets/pubpaid/sprites/street-civilians/*.png`.
- `pubpaid-phaser/scenes/StreetScene.js` usa `v6` apenas para luz/reflexo discreto e posiciona 5 NPCs decorativos como spritesheets bitmap 64x128 x 4 frames.
- `v19` foi a base anterior de trafego: preserva motos bitmap do sheet original, remove semialpha dos pixels pintados e descarta o `v18` por parecer moto procedural/canvas-like. Depois foi substituido no runtime pelo `v28`.

Validado localmente naquela rodada: `node --check` em app/Boot/Street/Intro/Interior/Wallet; JSONs ok; busca por `createCanvas`/`addCanvas` sem retorno em `pubpaid-phaser`; assets v6/NPC/v19 200; Playwright abriu a rua sem erros com `ambientV6=true`, `trafficV19=true` e `decorativeNpcs=5`.

Em 2026-05-06, apos feedback de que a moto ainda estava grande/transparente e os NPCs do arcade pareciam clones pequenos:

- Na etapa anterior, `BootScene` carregou `assets/pubpaid/traffic/pubpaid-traffic-artistic-left-3f-v28.png` e uma tentativa V2 de 3 nerds do arcade.
- `StreetScene` reduziu motos de scale 1.34 para 0.92 e trocou os clones pequenos do arcade por nerds V2 distintos 96x144 em scale 0.88/alpha 1.
- Esses nerds V2 foram substituidos/removidos na rodada seguinte porque ainda pareciam chapados/clones e tinham leitura de prop solto.
- `assets/pubpaid/traffic/pubpaid-traffic-artistic-left-3f-v28.png` e o sheet ativo de trafego; deriva do v22 e mantem rows 8/9 das motos com alpha apenas 0/255. Nao voltar para v18/v19 sem ordem explicita.

Validado localmente: `node --check` em Boot/Street/app; assets v28 e nerds 200; audit alpha dos 3 nerds e traffic rows 8/9 sem semi-alpha; Playwright abriu a rua sem erro e mostrou os 3 nerds na calcada.

Ainda em 2026-05-06, apos novo feedback de que os nerds V2/V3 continuavam fora do plano correto:

- Os arquivos V2 e V3 dos nerds arcade foram removidos do diretório vivo.
- `BootScene` agora carrega somente `arcade-nerd-seated-stick-idle-v4.png`, `arcade-nerd-token-stand-idle-v4.png` e `arcade-nerd-phone-lean-idle-v4.png`, todos frame 96x144 x 4, hard-alpha 0/255.
- Os V4 seguem meio termo entre silhueta pixel/cartoon das referencias e paleta noturna PubPaid, com controle/fichas/celular integrados no bitmap.
- Todos os frames V4 tem ultimo pixel opaco na row 139, igual ao protagonista; `StreetScene` usa `OPENING_SIDEWALK_TARGET.y` nos 3 NPCs para alinhar a linha de chao.
- `pubpaid-v2.html` usa cache-bust `20260506arcadenerdsv4groundline`.

Validado localmente: `node --check` em Boot/Street/app; assets V4 200; audit alpha dos 3 nerds V4 e rows 8/9 das motos com alpha apenas 0/255; busca por `createCanvas`/`addCanvas` sem retorno em `pubpaid-phaser`; browser/playtest local em `http://127.0.0.1:3000/pubpaid-v2.html?v=20260506arcadenerdsv4groundline` sem erros e com os 3 nerds alinhados ao protagonista.

Ainda em 2026-05-06, apos travamento de que ainda havia moto/canvas/procedural e que tudo deve vir de sprite seeds:

- `BootScene` deixou de carregar `pubpaid-street-ambient-life-4f-v6.png`, `pubpaid-traffic-artistic-left-3f-v28.png` e os 3 nerds arcade V4 no runtime.
- `BootScene` agora carrega trafego diretamente dos sprite-seeds individuais `assets/pubpaid/traffic/pixel-vehicles-art-pass-v1/*-8f.png`, todos frame 128x64, 8 frames, alpha 0/255.
- `StreetScene` instancia cada veiculo por chave propria (`ppg-traffic-seed-*`) e usa frames esquerda 4-7; nao ha atlas composto de trafego nem moto v28 no runtime.
- Os 3 nerds arcade V4 ficam fora da rua ate aprovacao visual externa; o runtime manteve apenas 2 civis pequenos de fundo por seed.
- A camada DOM `ppg-canvas-shell` virou `ppg-game-viewport`; o canvas restante e apenas o canvas tecnico do Phaser como motor.
- `pubpaid-v2.html` usa cache-bust `20260506trafficseeds1`.

Validado localmente: `node --check` em app/Boot/Street; page/app/Boot/Street e seeds ativos 200 no servidor local; audit dos 7 seeds ativos em `pixel-vehicles-art-pass-v1` com frame 128x64 e `semi=0`; busca sem retorno para `createCanvas`/`addCanvas`, `ppg-traffic-vehicles-sheet`, `pubpaid-traffic-artistic-left-3f-v28`, `pubpaid-street-ambient-life`, `ppg-street-npc-arcade`, `arcade-nerd-*-idle-v4` e `ppg-canvas-shell` no runtime. `web_game_playwright_client` foi tentado em headless/headed, mas o Windows bloqueou o Chromium com `EPERM`/operacao requer elevacao.

Rollback imediato desta tentativa: o usuario corrigiu que a ordem era comparar artes, nao mudar carros/motos/NPCs no runtime. O runtime foi restaurado por patch para `pubpaid-traffic-artistic-left-3f-v28.png`, `pubpaid-street-ambient-life-4f-v6.png`, 3 nerds arcade V4 na rua e `ppg-canvas-shell`. Proxima comparacao de arte deve ser feita fora do jogo.

## Proximos passos

- Validar visualmente no navegador real se player, 3 nerds arcade V4, civis de fundo, trafego v28 e motos atuais estao no estado anterior.
- Montar comparacao de artes em HTML/preview separado, sem trocar o runtime.
- Para personagens/pedestres, usar `PUBPAID_V2_NPC_PIXEL_ART_MASTER_PROMPT.md` + `PUBPAID_2_CHARACTER_ART_PROMPT.md` e aprovar em `pubpaid-character-approval.html` ou HTML simples equivalente.
- Fazer o fluxo completo: intro -> rua -> salao -> garcom -> lobby -> Dardos -> resultado.
- Fazer o fluxo completo da Dama.
- Criar pacote coerente para cachorro antes de religar animal.
- Depois da validacao, atualizar `CODEX_MEMORY.md`, `.codex-memory/current-state.md`, `.codex-memory/handoff.md`, `.codex-memory/orders.json` e `.codex-memory/assets.json`.

## Validacoes rapidas

```powershell
node --check pubpaid-phaser\app.js
node --check pubpaid-phaser\scenes\BootScene.js
node --check pubpaid-phaser\scenes\StreetScene.js
node --check pubpaid-phaser\scenes\InteriorScene.js
node --check pubpaid-phaser\scenes\GameLobbyScene.js
node -e "JSON.parse(require('fs').readFileSync('.codex-memory/orders.json','utf8')); console.log('orders ok')"
```

## Regra de seguranca

Nao apagar a versao antiga `pubpaid.html`; ela e historica/demo. A evolucao oficial continua em `pubpaid-v2.html`.
