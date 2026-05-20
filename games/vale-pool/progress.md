Original prompt: Promover o prototipo aprovado Vale Pool Round2 para substituir a Sinuca antiga do PubPaid, preservando arte, Demo/PvP, branca + bolas 1-9, fotos Google no PvP e musica 16-bit relaxante.

## 2026-05-19

- Promovido de `.codex-temp/vale-pool-round2` para `games/vale-pool`.
- Integrado no PubPaid por iframe em Demo e PvP.
- Correção funcional: liberar eventos de mouse/teclado/touch no wrapper PubPaid para a Demo nao virar apenas imagem.
- Correção funcional: canvas agora recebe foco, mira por mouse/pointer, teclas 1-5 no efeito, clique na bola de efeito e clique na mesa para tacar.
- Demo ganhou estado de treino com jogador e Robo IA; a IA escolhe uma tacada simples depois da vez do jogador.
- `render_game_to_text` inclui turno, placar jogador/IA, bolas dentro/fora, jogadas e histórico recente.
- Correção do taco/pontilhado: desaceleração foi encurtada e a tacada fecha em poucos segundos para voltar a `MIRANDO`; captura validada mostra taco e linha pontilhada visíveis.
- Física do efeito ajustada para ser relativa à direção da tacada: esquerda/direita aplicam desvio lateral, segue/puxa alteram a reação da branca depois da colisão.
- HUD ajustado: bloco superior esquerdo deixou de ser `PONTOS` e agora mostra `VEZ`; placar do treino fica nos cartões laterais Jogador/Robo IA.
- Ponte Demo ajustada: o iframe envia `vale-pool:demo-state` e o PubPaid atualiza placar/status dos cartões laterais.
- Controle de efeito corrigido: o ponto vermelho pode ser clicado livremente dentro da bola branca do HUD, fica centralizado ao voltar para `CENTRO` e calcula a física pelo vetor do ponto de impacto.
- Correção rápida standalone-pool5: a pontuação abstrata saiu; cartões laterais agora mostram explicitamente `BOLAS` encaçapadas e o HUD declara regra de Bola 9.
- Física de caçapa corrigida: zona de captura das bocas foi ampliada para a madeira interna antes do repique no trilho; teste dirigido confirmou a branca caindo/respawnando em vez de voltar.
- Responsividade ampliada: o iframe/jogo agora usa mais largura em desktop e mantém proporção 16:9 para mobile horizontal.
- Força reforçada: velocidade base e pico da tacada aumentados para a barra de força ter impacto visível.
- Rodada standalone-pool8: modos de jogo consolidados. Demo/IA começa com moeda; vencedor escolhe começar ou escolher modalidade; quem escolhe modalidade joga por segundo.
- Modalidades atuais: Livre (branca + 1-9, placar por bolas), Brasileira (branca + 1-7 oficiais, bola da vez menor em mesa, placar por pontos) e Par/Ímpar (branca + 2-15, primeiro encaçape define grupo, 15 fecha/castiga).
- PvP agora tem endpoint de escolha inicial `/api/pubpaid/pvp/pool/setup`, estado de setup no servidor, montagem de rack por modalidade e bloqueio de tacada até a escolha da moeda/modalidade terminar.
- Conhecimento de regras salvo na skill `game-director-general/references/pool-modalities.md`.
- Validação pool8: `node --check` em `games/vale-pool/game.js`, `pubpaid-phaser/ui/domGameInterface.js`, `pubpaid-phaser/services/pvpService.js` e `server.js`; `npm run guard:pubpaid`; servidor local respondeu build `20260519-standalone-pool8`; capturas da Demo confirmaram moeda, escolha inicial, seleção de modalidades e modo Brasileira com 7 bolas.
- Rodada standalone-pool9: organização das bolas revisada com referência de racks. Modo Livre usa diamante 1-2-3-2-1 com bola 1 na frente e bola 9 no centro; Par/Ímpar usa triângulo compacto com bola 15 no miolo; Brasileira mantém rack compacto de 7 coloridas sem misturar com bola 9.
- Decisão a partir da referência Blackball: não incluir Bilhar Inglês/3 Tabelas agora, porque exigem outro tipo de mesa/regras; se houver quarto modo, o próximo candidato é Bola 8/Alta-Baixa separado.
- Rodada standalone-pool10: moeda ganhou animação e regra complementar completa. Quem vence a moeda escolhe apenas uma parte (`ser primeiro` ou `modalidade`); quem perde escolhe a parte restante.
- Tutorial obrigatório antes da mesa: depois da modalidade definida, Demo/IA mostra explicação do modo e só libera a partida ao apertar `COMEÇAR PARTIDA`; no PvP os dois jogadores precisam confirmar o tutorial antes de qualquer tacada.
- Rodada standalone-pool11: caçapas abertas visualmente para o lado do pano, sem a tampa/brilho superior fechando a boca. A captura real ficou mais larga no protótipo e no PvP do servidor; a física agora considera o trajeto entre frames para a bola não bater na boca e voltar.
- Rodada poolrules1: regra viva adicionada na HUD e nos cartoes laterais. Livre informa que qualquer bola 1-9 vale; Brasileira mostra a bola da vez; Par/Ímpar mostra que a primeira bola define grupo e depois exibe PAR/ÍMPAR com bolas restantes. O PubPaid ganhou botao `REGRAS` nos cartoes para abrir manual pop-up sem mudar a arte da mesa.
