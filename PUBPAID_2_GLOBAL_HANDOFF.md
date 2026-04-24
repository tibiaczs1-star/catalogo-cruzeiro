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
Intro -> Rua -> Porta -> Salao -> Garcom -> Lobby DOM -> Oponente IA -> Aposta -> Confirmacao -> Tela do jogo
```

Primeiros jogos:

- Dardos: cena Phaser com comando/resultado via UI DOM.
- Dama: tabuleiro DOM com selecao, captura obrigatoria simples, IA local e resultado.

## Direcao visual fixa

- Pixel art bitmap semi-realista.
- Nada de personagem final desenhado por canvas/procedural.
- Adultos no mundo: 105-130 px no primeiro plano, 75-100 px no meio e 50-75 px no fundo.
- Carros, moto e cachorro antigos continuam fora do runtime ate existir pacote visual coerente.
- Reintroduzir vida aos poucos, sempre com escala aprovada.

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

## Proximos passos

- Validar visualmente no navegador real se player, pedestres, cantora e clientes estao em escala correta.
- Fazer o fluxo completo: intro -> rua -> salao -> garcom -> lobby -> Dardos -> resultado.
- Fazer o fluxo completo da Dama.
- Criar pacote coerente para veiculos/cachorro antes de religar trafego e animal.
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
