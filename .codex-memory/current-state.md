# Current State

Updated: 2026-05-16T18:05:00.000Z

## Active Goal

- PubPaid 2.0 asset direction / sprite-agent learning layers

## Summary

Usuario enviou novo estudo de pixel art (`https://www.youtube.com/watch?v=hqbohVUzpiI`) para melhorar olhos, rosto, cabelo e detalhe controlado. O agente de sprites foi atualizado com a lição: começar pelo olho quando a expressão importa, esculpir cabeça/cabelo por massas, usar variantes lado a lado, evitar contorno total, aplicar sombra abaixo/atrás e só adicionar nariz/boca/sobrancelha quando couber em leitura de jogo.

Foi criada uma bíblia visual curta externa em `C:\Users\junio\AppData\Local\hermes\hermes-agent\sprite-agent-demo\pubpaid-concepts.html`, reunindo conceito do jogo, screenshots reais do PubPaid 2.0, protagonistas oficiais, prancha de sprites e pipeline por camadas. O runtime oficial do PubPaid 2.0 não foi alterado nesta rodada.

## Next

- Usar `pubpaid-concepts.html` como referência visual antes de criar novos assets do PubPaid 2.0.
- Próximo asset deve nascer já dentro do conceito do jogo inteiro: rua, salão, palco, lobby, carteira, aposta e mini-games.
- Manter protagonistas/NPCs adultos em 96x144/8 direções quando forem do mesmo sistema dos protagonistas atuais.
- Continuar rodando `npm run guard:pubpaid` antes de qualquer alteração real no runtime PubPaid 2.0.

## Files In Focus

- C:\Users\junio\AppData\Local\hermes\hermes-agent\sprite-agent-demo\pubpaid-concepts.html
- C:\Users\junio\AppData\Local\hermes\hermes-agent\sprite-agent-demo\index.html
- C:\Users\junio\AppData\Local\hermes\skills\gaming\pixel-art-character-agent\SKILL.md
- CODEX_MEMORY.md

## Assets In Focus

- assets/pubpaid/sprites/protagonist/protagonist-male-generated-idle-breathe-8dir-4f.png
- assets/pubpaid/sprites/protagonist/protagonist-female-generated-idle-breathe-8dir-4f.png
- output/playwright/pubpaid-v2-character-select-playable-20260516.png
- output/playwright/pubpaid-v2-street-player-walk-playable-20260516.png
- output/playwright/pubpaid-v2-interior-map-corrected-20260516.png
- output/playwright/pubpaid-v2-lobby-waiter-clean-floor-20260516.png

## Runtime Note

- A seleção, a rua e o salão agora compartilham os protagonistas jogáveis reais por `selectedCharacter.id`, usando `walk`, `idle-breathe` e `idle-phone` em 8 direções.
- Capturas novas da validação final desta correção: `output/playwright/pubpaid-v2-street-female-playable-20260516.png` e `output/playwright/pubpaid-v2-interior-female-playable-20260516.png`.
- Damas real 1x1 agora usa matchmaking PvP autoritativo no backend; sem saldo segue demo, com saldo real suficiente entra em fila contra outro jogador real.
- A liquidação real foi alinhada ao exemplo pedido: stake 100 + 100 => casa 20, vencedor 180.
