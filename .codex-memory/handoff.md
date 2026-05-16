# Handoff

Updated: 2026-05-16T18:05:00.000Z

PubPaid 2.0 / agente de sprites: o usuário enviou o vídeo `https://www.youtube.com/watch?v=hqbohVUzpiI` para estudo de olho/rosto/cabelo e pediu que os assets agora nasçam do conceito inteiro do jogo. A transcrição foi estudada e o skill `pixel-art-character-agent` foi atualizado com regras novas: começar pelo olho quando detalhe facial importa, construir cabeça/cabelo por massas e variantes, sombra abaixo/atrás, evitar contorno total, usar off-white/pele clara nos olhos quando branco ficar chapado, e só inserir boca/nariz/sobrancelha se couber.

Foi criada uma bíblia visual curta externa para o agente em:

`C:\Users\junio\AppData\Local\hermes\hermes-agent\sprite-agent-demo\pubpaid-concepts.html`

Ela mostra conceito do jogo, camadas de criação, screenshots reais do PubPaid 2.0, protagonistas oficiais, prancha de estudo e pipeline. `index.html` da demo recebeu link para essa página. Não houve mudança no runtime oficial do PubPaid 2.0 nessa rodada.

Validações: página abriu via browser em `file:///C:/Users/junio/AppData/Local/hermes/hermes-agent/sprite-agent-demo/pubpaid-concepts.html`, DOM carregou, imagens apareceram, console sem erros. O analisador visual do browser acusou token OAuth invalidado, mas a captura foi analisada via `vision_analyze` e confirmou layout legível.

## Next

- Antes de criar novos assets PubPaid, abrir/usar `pubpaid-concepts.html` como referência.
- Pensar nos assets no sistema do jogo inteiro: rua, salão, palco, lobby, carteira/celular, aposta e mini-games.
- Para protagonistas/NPCs compatíveis com os atuais, manter adulto alto 96x144, 8 direções, rosto/cabelo/roupa legíveis, hitbox nos pés.
- Se alterar runtime PubPaid 2.0, manter regra dura: não usar `createElement`, `canvas`, `createCanvas`, `addCanvas` no runtime e rodar `npm run guard:pubpaid`.

## Files In Focus

- `C:\Users\junio\AppData\Local\hermes\hermes-agent\sprite-agent-demo\pubpaid-concepts.html`
- `C:\Users\junio\AppData\Local\hermes\hermes-agent\sprite-agent-demo\index.html`
- `C:\Users\junio\AppData\Local\hermes\skills\gaming\pixel-art-character-agent\SKILL.md`
- `CODEX_MEMORY.md`

## Runtime Note

- O fluxo jogável do PubPaid 2.0 voltou a usar os protagonistas corretos, não sprites-conceito: `CharacterSelectScene.js`, `StreetScene.js` e `InteriorScene.js` agora usam o mesmo rig masculino/feminino restaurado por `selectedCharacter.id`.
- Os sheets restaurados são `protagonist-male-generated-*` e `protagonist-female-generated-*`, com `walk`, `idle-breathe` e `idle-phone` em 8 direções x 4 frames.
- Capturas úteis desta correção: `output/playwright/pubpaid-v2-character-select-playable-20260516.png`, `output/playwright/pubpaid-v2-street-player-walk-playable-20260516.png`, `output/playwright/pubpaid-v2-street-female-playable-20260516.png`, `output/playwright/pubpaid-v2-interior-female-playable-20260516.png`.
- Damas real 1x1 foi ligada ao backend PvP já existente: fila real só com saldo real suficiente, servidor valida turno/jogada/tabuleiro e o cliente apenas renderiza o estado autoritativo.
- Correção essencial aplicada em `pubpaid-runtime.js`: `lockedMatchCoins` agora sobrevive ao rebuild canônico da carteira, então o escrow da partida real permanece travado.
- Liquidação definida conforme pedido: com 100 de cada jogador, pote 200, casa 20, vencedor 180.
