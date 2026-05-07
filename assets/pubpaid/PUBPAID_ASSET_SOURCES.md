# PubPaid Asset Sources

## Traffic pixel vehicles art pass - 2026-04-28

Status: integrado no runtime da PubPaid 2.0 em 2026-05-06 como trafego oficial por sprite-seeds individuais.

- `assets/pubpaid/traffic/reference-sources/opengameart-chasersgaming-classiccar-cc0.png`
  - Fonte: OpenGameArt, `2D car sprite`, Chasersgaming.
  - URL: https://opengameart.org/content/2d-car-sprite-2
  - Licenca: CC0.
  - Uso: base aberta para estudo/derivacao de carro lateral, recolorida e animada para avaliacao PubPaid.
- `assets/pubpaid/traffic/reference-sources/opengameart-chasersgaming-chopper-rider-cc0.png`
  - Fonte: OpenGameArt, `2D Bike Sprite`, Chasersgaming.
  - URL: https://opengameart.org/content/2d-bike-sprite-1
  - Licenca: CC0.
  - Uso: base aberta para estudo/derivacao de moto lateral com piloto integrado, recolorida e animada para avaliacao PubPaid.
- `assets/pubpaid/traffic/pubpaid-pixel-vehicles-art-pass-8f-v1.png`: atlas de avaliacao com 9 veiculos, 8 frames por veiculo.
- `assets/pubpaid/traffic/pixel-vehicles-art-pass-v1/*-8f.png`: sheets individuais, 4 frames direita + 4 frames esquerda, rodas animadas dentro do PNG. O runtime carrega estes arquivos diretamente por `BootScene` e instancia por chave individual em `StreetScene`, sem atlas composto de trafego e sem moto gerada por canvas/procedural.
- Ativos no runtime atual: `taxi-yellow-8f.png`, `black-sedan-8f.png`, `red-coupe-8f.png`, `teal-compact-8f.png`, `blue-police-8f.png`, `red-sport-rider-8f.png` e `delivery-blue-rider-8f.png`.

Regra: referencias de banco/stock com marca d'agua continuam somente como direcao visual. Nao copiar, nao tracar, nao recortar e nao remover marca d'agua.

## Traffic artistic left runtime pass - 2026-05-05

Status: historico/local; fora do runtime desde 2026-05-06 por leitura visual de moto composta/canvas-like.

- `assets/pubpaid/traffic/pubpaid-traffic-artistic-left-3f-v28.png`: spritesheet 384x192, 10 veiculos x 3 frames, base anterior; deriva do `v22`, mantem hard-alpha nas motos e aplica patch minimo de visor/capacete sem criar preenchimento fora do contorno, mas nao e mais carregado no runtime.
- `assets/pubpaid/traffic/pubpaid-traffic-artistic-left-3f-v28.json`: contrato do sheet anterior.
- `assets/pubpaid/traffic/pubpaid-traffic-artistic-left-3f-v22.png`/`.json`: fonte intermediaria mantida; endurece alpha das motos e remove buracos internos sem os underlays descartados das tentativas seguintes.
- `assets/pubpaid/traffic/pubpaid-traffic-artistic-left-3f-v19.png`: spritesheet 384x192, 10 veiculos x 3 frames, base anterior; preserva a moto bitmap original do `v16`, torna todos os pixels pintados opacos e remove semialpha sem redesenhar a silhueta por canvas/procedural.
- `assets/pubpaid/traffic/pubpaid-traffic-artistic-left-3f-v19.json`: contrato da base anterior. Registra que o `v18` foi descartado por parecer moto procedural/canvas.
- `assets/pubpaid/traffic/pubpaid-traffic-artistic-left-3f-v16.png`: spritesheet 384x192, 10 veiculos x 3 frames, base anterior; deriva do `v15`, mantendo carros/van corrigidos e estabilizando as duas linhas de motos com o melhor frame replicado nos 3 frames.
- `assets/pubpaid/traffic/pubpaid-traffic-artistic-left-3f-v16.json`: contrato da base anterior e resumo da estabilizacao das motos.
- `assets/pubpaid/traffic/pubpaid-traffic-artistic-left-3f-v15.png`/`.json`: base anterior com carros/van corrigidos e rodas/aros limpos; mantida como referencia, substituida no runtime pelo `v16` porque alguns frames das motos ainda alternavam entre bom e defeituoso.
- `assets/pubpaid/traffic/pubpaid-traffic-artistic-left-3f-v14.png`/`.json`: tentativa descartada; preencheu motos por contorno agressivo e criou massa cinza onde deveria haver vazio natural.
- `assets/pubpaid/traffic/pubpaid-traffic-artistic-left-3f-v13.png`/`.json`: base anterior com preenchimento interno por suporte; mantida como referencia, substituida no runtime pelo `v14` e depois pelo `v15`.
- `assets/pubpaid/traffic/pubpaid-traffic-artistic-left-3f-v12.png`/`.json`: base limpa com capacetes opacos; mantida como referencia e usada como fonte do `v15`.
- `assets/pubpaid/traffic/pubpaid-traffic-artistic-left-3f-v11.png`/`.json`: base anterior com van branca preenchida; mantida como referencia, substituida no runtime pelo `v12`.
- `assets/pubpaid/traffic/pubpaid-traffic-artistic-left-3f-v6.png`/`.json`: base conservadora anterior; mantida como referencia, substituida no runtime pelo `v11`.
- `assets/pubpaid/traffic/pubpaid-traffic-artistic-left-3f-v5.png`/`.json`: tentativa descartada; limpou demais e escureceu brilho interno, criando leitura de buraco/transparencia no meio.
- `assets/pubpaid/traffic/pubpaid-traffic-artistic-left-3f-v3.png`/`.json`: base boa mantida como referencia; refaz as motos a partir do source completo para manter capacetes inteiros sem desenho novo por cima.
- `assets/pubpaid/traffic/pubpaid-traffic-artistic-left-3f-v2.png`/`.json`: versao anterior mantida como referencia; substituida no runtime pelo `v3`, depois pelo `v6`, `v11`, `v12`, `v13`, `v14`, `v15` e finalmente pelo `v16`.

## Wallet pixel phone UI - 2026-05-05

Status: integrado no runtime da PubPaid 2.0.

- `assets/pubpaid/ui/pubpaid-wallet-phone-ui-v2.png`: sprite bitmap 320x520 do celular/carteira, opaco dentro da silhueta, desenhado como pixel art e usado pela `WalletScene` no lugar do menu procedural em Phaser.
- `assets/pubpaid/ui/pubpaid-wallet-phone-ui-v2.json`: contrato do sprite, ancoras dos saldos, zonas de clique e politica de alpha sem semitransparencia.
- `assets/pubpaid/ui/pubpaid-wallet-phone-ui-v1.png`/`.json`: primeira tentativa descartada; tinha camadas translúcidas que deixavam a rua aparecer por dentro da tela.
- `assets/pubpaid/ui/pubpaid-wallet-pixel-digits-v1.png`: spritesheet numerico bitmap para os saldos dinamicos da carteira.
- `assets/pubpaid/ui/pubpaid-wallet-pixel-digits-v1.json`: frame map dos digitos.

Regra: a casca visual da carteira deve continuar como bitmap/sprite opaco. Phaser pode posicionar o aparelho, animar abertura e usar hotspots, mas nao voltar a desenhar cards/botoes/moldura por `graphics()` nem usar UI translucida.

## Street ambient bitmap layer - 2026-05-05

Status: desligado do runtime desde 2026-05-06 ate existir seed animado aprovado.

- `assets/pubpaid/background/pubpaid-street-ambient-life-4f-v6.png`: spritesheet 1280x720 x 4 frames usado anteriormente apenas para LED/searchlight, chuva e reflexos discretos. Nao contem NPCs embutidos, mas foi retirado do runtime para eliminar qualquer leitura de fundo procedural.
- `assets/pubpaid/background/pubpaid-street-ambient-life-4f-v6.json`: contrato do sheet, politica de alpha e registro de que os NPCs foram removidos do fundo.
- `assets/pubpaid/sprites/street-civilians/*.png`: NPCs decorativos da rua como spritesheets independentes; no runtime atual ficam apenas civis pequenos de fundo aprovados por seed (`curb-sitter` e `bus-lady`). Os 3 nerds do arcade V4 foram retirados da rua e voltam somente depois de aprovacao visual no HTML externo.

Regra: personagens decorativos de rua devem continuar como spritesheets bitmap/sprite-seeds carregados por `BootScene`; a cena pode posicionar e tocar animacao, mas nao fabricar personagem por canvas/runtime.

## Protagonist sheets - 2026-04-27

- `assets/pubpaid/sprites/protagonist/protagonist-male-generated-sheet-source-v1.png`: fonte local gerada por image generation, usada para extrair o protagonista masculino no novo fluxo de escolha/mapa.
- `assets/pubpaid/sprites/protagonist/protagonist-female-generated-sheet-source-v1.png`: fonte local gerada por image generation, usada para extrair a protagonista feminina no novo fluxo de escolha/mapa.
- `assets/pubpaid/sprites/protagonist/protagonist-male-turnaround-4f.png` e `protagonist-female-turnaround-4f.png`: strips de 4 vistas para a selecao de personagem girando.
- `assets/pubpaid/sprites/protagonist/protagonist-*-generated-walk-8dir-4f.png`: sheets jogaveis 96x144, 8 direcoes x 4 frames, extraidos dos sources gerados.
- `assets/pubpaid/sprites/protagonist/protagonist-*-generated-idle-breathe-8dir-4f.png` e `protagonist-*-generated-idle-phone-8dir-4f.png`: idles jogaveis no mesmo contrato.
- `assets/pubpaid/sprites/protagonist/protagonist-walk-8dir-3f.png`: protagonista local V1, 8 direcoes x 3 frames, frame 64x128. Uso atual: caminhada com pernas alternando por direcao.
- `assets/pubpaid/sprites/protagonist/protagonist-idle-breathe-8dir-3f.png`: idle respirando, 8 direcoes x 3 frames, frame 64x128. Uso atual: estado parado inicial.
- `assets/pubpaid/sprites/protagonist/protagonist-idle-phone-8dir-3f.png`: idle mexendo no celular, 8 direcoes x 3 frames, frame 64x128. Uso atual: entra apos cerca de 2800ms parado.
- `assets/pubpaid/sprites/protagonist/protagonist-final-3sheet-preview.png`: prancha local de revisao dos tres sheets.
- `output/web-game/pubpaid-protagonist-focused-phone-v2/protagonist-focused-contact.png`: captura local de validacao com rua limpa, walk leste/oeste/norte/sul, idle breathe e idle phone.

Status: desenvolvimento local V1 para aprovacao do usuario. Nao reativar civis, placa Google grande ou molduras extras ate o protagonista ser aprovado.

## Runtime bitmap replacements - 2026-04-24

- `assets/pubpaid/sprites/protagonist/protagonist-8dir-walk-v1.png`: spritesheet local de desenvolvimento do protagonista, 8 direcoes x 4 frames, frame 64x128. Status: animatic jogavel para reabrir movimento e escala; nao e arte final.
- `assets/pubpaid/sprites/protagonist/protagonist-8dir-walk-v1-preview.png`: prancha de revisao do spritesheet do protagonista.
- `assets/pubpaid/sprites/street-civilians/`: pacote local V1 de civis unicos da rua, 4 frames de idle por personagem, frame 64x128.

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

### Development Animatic

- `assets/pubpaid/sprites/protagonist/protagonist-8dir-walk-v1.png`: usar localmente para testar movimento, escala e integracao Phaser. Proxima passada deve redesenhar frames reais e limpar a sensacao de direcoes derivadas do mesmo seed.
- `assets/pubpaid/sprites/street-civilians/*.png`: usar localmente para tirar clones da rua e validar silhueta/escala. Proxima passada deve pintar/refinar os frames mantendo a grade.

### Provisional

- `assets/pubpaid-v2-street-bg-v1.png`: aprovado como fundo de rua, mas precisa de pack de sprites compatível.
- `assets/pubpaid-interior-v5.png`: aprovado como fundo de interior, mas personagens devem respeitar `PUBPAID_VISUAL_SCALE_GUIDE.md`.
- `assets/pubpaid/characters/guest-standing-v2.png`: provisional; boa qualidade bitmap, mas o canvas é grande demais para uso direto como player/pedestre sem recorte dedicado.
- `assets/pubpaid/characters/guest-seated-v2.png`: provisional; boa qualidade bitmap, mas não deve ser usado como pedestre em pé.
- `assets/pubpaid/characters/singer-stage-v2.png`: provisional; precisa escala/posição dedicada antes de voltar ao salão.

### Rejected For Current Runtime

- Sprites procedurais de `spriteFactory.js` como arte final: rejeitados e removidos do runtime visual. `spriteFactory.js` agora só expoe chaves/helpers; atores precisam vir de PNG/spritesheet.
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
