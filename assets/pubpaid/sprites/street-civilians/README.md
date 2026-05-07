# Civis de rua PubPaid 2.0
Pacote local V1 para substituir clones na rua durante o desenvolvimento.
Cada arquivo e um spritesheet 4 frames de idle, frame 64x128, ancora inferior central.
Os sprites sao paintovers locais em cima dos seeds aprovados para manter acabamento mais perto do jogo.
Status: jogavel/local. Pode receber pintura final depois sem mudar a grade.
Arquivos:
- `bus-lady-idle-v1.png`
- `terminal-man-idle-v1.png`
- `hooded-youth-idle-v1.png`
- `worker-backpack-idle-v1.png`
- `curb-sitter-idle-v1.png`
- `bouncer-wide-idle-v1.png`

## Arcade nerds v4

Pacote local V4 para os 3 NPCs na calcada do arcade.
Cada arquivo e um spritesheet 4 frames de idle, frame 96x144, ancora inferior central, hard-alpha 0/255.
Os sprites foram normalizados para a mesma linha visual do protagonista: o ultimo pixel opaco fica na row 139 em todos os frames.
Direcao: meio termo entre silhueta simples/cartoon das referencias e paleta noturna do fundo PubPaid, sem acessorio solto fabricado em runtime.
As poses sao distintas: sentado com controle no colo, em pe com fichas na mao, e encostado mexendo no celular.

- `arcade-nerd-seated-stick-idle-v4.png`
- `arcade-nerd-token-stand-idle-v4.png`
- `arcade-nerd-phone-lean-idle-v4.png`

## NPCs PubPaid 2 runtime v1

Pacote aprovado pelo usuario em 2026-05-06 para entrar no jogo, mantendo a direcao `PUBPAID_2_VISUAL_DIRECTION.md`.
Cada arquivo e um spritesheet 5 frames, frame 96x144, ancora inferior central, hard-alpha 0/255 e groundY 139.
Os sheets atuais foram restaurados dos bitmaps aprovados depois da rejeicao de uma tentativa procedural de pernas.
Nova caminhada real deve ser feita como arte/spritesheet aprovado em preview externo, sem remendo procedural.

Rua:
- `arcade-controller-wall-idle-v1.png`
- `arcade-token-wall-idle-v1.png`
- `arcade-phone-wall-idle-v1.png`
- `pedestrian-commuter-walk-v1.png`
- `pedestrian-delivery-walk-v1.png`
- `pedestrian-hoodie-tote-walk-v1.png`
- `pedestrian-woman-denim-walk-v1.png`
- `pedestrian-woman-umbrella-walk-v1.png`
- `pedestrian-woman-hoodie-walk-v1.png`
- `pedestrian-elder-woman-coat-walk-v1.png`
- `pedestrian-elder-man-cane-walk-v1.png`
- `pedestrian-elder-woman-tote-walk-v1.png`

Interior:
- `pub-bartender-idle-v1.png`
- `pub-cue-regular-idle-v1.png`
- `pub-patron-drink-idle-v1.png`

Preview/estudo externo:
- `approval/pubpaid-npc-runtime-v1-preview.png`
- `approval/pubpaid-npc-themes-source-v1.png`
- `approval/pubpaid-women-elders-source-v1.png`
