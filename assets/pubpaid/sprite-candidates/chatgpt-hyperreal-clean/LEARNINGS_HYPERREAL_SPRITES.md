# Aprendizado Rayxpx — sprites/assets hiper-realistas via ChatGPT Imagem

Status: teste feito com assets locais já baixados do ChatGPT Imagem.

## O que funcionou

1. ChatGPT Imagem gera assets com aparência premium/hiper-realista:
   - madeira envernizada;
   - metal dourado com brilho radial;
   - botão vermelho laqueado;
   - molduras com ornamentação.

2. Para UI/game assets, o resultado fica forte em tamanhos grandes e médios:
   - 512 px: ótimo para catálogo, loja, inventário, tela de vitória;
   - 256 px: bom para botão grande, carta, item especial;
   - 128 px: ainda legível;
   - 64 px: moedas/botões circulares continuam bons, mas molduras compridas perdem detalhes.

3. A melhor rota é gerar grande e depois preparar para o jogo:
   - pedir PNG isolado;
   - remover fundo falso/checkerboard;
   - cortar borda vazia;
   - exportar escalas 512/256/128/64;
   - verificar no fundo real do jogo.

## Problema encontrado

Os arquivos do ChatGPT vieram em RGB com checkerboard falso, não transparência real.
Isso engana: parece PNG transparente, mas não é. Corrigi por script removendo tons neutros claros do fundo e criando alpha real.

## Prompt base para ChatGPT Imagem

Use este padrão para repetir melhor:

```text
Create a single game-ready hyper-realistic 2D sprite asset, isolated object, transparent background, no checkerboard, no shadows outside the object unless asked, centered, orthographic/front view, clean silhouette, premium mobile game UI style, high detail but readable at 128px, consistent top-left soft studio lighting, polished material rendering, crisp edges, no text, no watermark.

Asset: [descrever aqui: red lacquer round poker token / ornate wooden checkers board / gold coin button / fantasy inventory icon]

Deliver as a clean PNG-style asset with true transparent background.
```

## Prompt para sprite/personagem hiper-realista de jogo

```text
Create a game-ready hyper-realistic 2D character sprite for a top-down / three-quarter mobile game, full body, isolated on true transparent background, consistent 3/4 camera angle, readable silhouette, realistic fabric/leather/metal materials, clean separated limbs, no background, no text, no watermark, high detail but simplified enough to remain readable at 128px and 64px. Neutral idle pose, feet aligned to a flat ground plane, top-left soft studio lighting.

Character: [descrição do personagem]
```

## Gate de qualidade antes de usar no jogo

- Fundo é alpha real, não checkerboard falso.
- Silhueta é legível em 128px e 64px.
- Luz vem da mesma direção em todos os assets.
- Câmera/ângulo é igual entre peças do mesmo jogo.
- Asset não tem texto inventado, watermark ou borda cortada.
- No Godot/HTML, renderizar com escala correta e testar no fundo real.

## Próxima melhoria

Para personagens/sprites animados, pedir primeiro uma pose frontal limpa, depois variações controladas:
- idle 4 frames;
- walk 4 ou 8 frames;
- attack 3 a 5 frames;
- hurt/death.

Não pedir sprite sheet complexo logo de primeira: gera inconsistência. Melhor gerar pose mestre, depois reconstruir sheet por etapas.
