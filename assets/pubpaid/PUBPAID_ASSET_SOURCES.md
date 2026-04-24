# PubPaid Asset Sources

## Runtime bitmap replacements - 2026-04-24

- `assets/pubpaid/sprites/adult-standing-tight-v1.png`: recorte justo do adulto em pe, usado como player e pedestre controlado em escala.
- `assets/pubpaid/sprites/guest-seated-tight-v1.png`: recorte justo do convidado sentado, usado como cliente de salao em escala.
- `assets/pubpaid/sprites/singer-stage-tight-v1.png`: recorte justo da cantora de palco, usado no salao em escala controlada.
- `assets/pubpaid/vehicles/pubpaid-car-side-v1.png`: bitmap PNG local criado para substituir carro procedural em canvas/runtime. Uso: `StreetScene`.
- `assets/pubpaid/vehicles/pubpaid-motorbike-side-v1.png`: bitmap PNG local criado para substituir moto procedural em canvas/runtime. Uso: `StreetScene`.
- `assets/pubpaid/animals/pubpaid-street-dog-v1.png`: bitmap PNG local criado para substituir cachorro procedural em canvas/runtime. Uso: `StreetScene`.
- `assets/pubpaid/characters/guest-standing-v2.png`: reaproveitado como player/pedestre adulto bitmap na rua enquanto nao existe sprite exclusivo final do player.
- `assets/pubpaid/characters/guest-seated-v2.png`: reaproveitado como pedestre/cliente bitmap na rua enquanto nao existe variação exclusiva final.

## Asset approval status - 2026-04-24

### Approved

- `assets/pubpaid/lobby/pubpaid-lobby-bg-v2-crowd.png`: aprovado como fundo de lobby/bar cheio.
- `assets/pubpaid/sprites/adult-standing-tight-v1.png`: aprovado provisoriamente para player/pedestres se renderizado entre 75 e 125 px de altura.
- `assets/pubpaid/sprites/guest-seated-tight-v1.png`: aprovado provisoriamente para cliente sentado se renderizado entre 55 e 85 px de altura.
- `assets/pubpaid/sprites/singer-stage-tight-v1.png`: aprovado provisoriamente para palco se renderizado perto de 100-115 px de altura e sem cobrir UI.
- `assets/pubpaid/characters/waiter-lobby-large-v1.png`: aprovado como garçom guia de lobby/UI, não como sprite de mundo.
- `assets/pubpaid/characters/waiter-lobby-speaking-v1.png`: aprovado como variação de fala do garçom guia de lobby/UI.
- `assets/pubpaid/characters/waiter-salon-small-v1.png`: aprovado provisoriamente para garçom do salão se usado abaixo de 130 px de altura visual.

### Provisional

- `assets/pubpaid-v2-street-bg-v1.png`: aprovado como fundo de rua, mas precisa de pack de sprites compatível.
- `assets/pubpaid-interior-v5.png`: aprovado como fundo de interior, mas personagens devem respeitar `PUBPAID_VISUAL_SCALE_GUIDE.md`.
- `assets/pubpaid/characters/guest-standing-v2.png`: provisional; boa qualidade bitmap, mas o canvas é grande demais para uso direto como player/pedestre sem recorte dedicado.
- `assets/pubpaid/characters/guest-seated-v2.png`: provisional; boa qualidade bitmap, mas não deve ser usado como pedestre em pé.
- `assets/pubpaid/characters/singer-stage-v2.png`: provisional; precisa escala/posição dedicada antes de voltar ao salão.

### Rejected For Current Runtime

- Sprites procedurais de `spriteFactory.js` como arte final: rejeitados, usar apenas como marcador temporário/debug.
- `assets/pubpaid/vehicles/pubpaid-car-side-v1.png`: rejeitado como arte final por não combinar com o cenário atual; manter fora da tela até pack novo.
- `assets/pubpaid/vehicles/pubpaid-motorbike-side-v1.png`: rejeitado como arte final por não combinar com o cenário atual; manter fora da tela até pack novo.
- `assets/pubpaid/animals/pubpaid-street-dog-v1.png`: rejeitado como arte final por não combinar com o cenário atual; manter fora da tela até pack novo.

Atualizado: 2026-04-23

Direção nova: o salão é hub e os jogos abrem em telas próprias. Os gráficos feitos só em código agora são provisórios; substituir por sprites/tilesets reais.

## Fontes pesquisadas

- OpenGameArt LPC Tavern: https://opengameart.org/content/lpc-tavern
  - Uso bom para salão, taverna, balcão, copos, cadeiras e props.
  - Licença CC-BY-SA 3.0. Exige crédito e atenção a share-alike.

- FreeGameSprites: https://www.freegamesprites.com/
  - Muitos assets CC0. Prioridade para efeitos, UI, objetos e placeholders livres.

- S Frisk Fantasy Tavern Tileset: https://sfrisk.itch.io/fantasy-tavern-tileset
  - Bom para interior pixel art com licença comercial com crédito.
  - Não redistribuir assets soltos.

- FreePixel.Art collection: https://freepixelart.itch.io/free-pixel-art-complete-collection-23000-assets
  - Grande volume, AI-assisted. Usar com cautela, melhor como referência/placeholder.

## Próxima troca visual

- Baixar/organizar sprites reais em `assets/pubpaid/sprites/`.
- Trocar salão por tileset/bitmap real.
- Criar telas próprias para Dardos e Dama com sprites dedicados.
