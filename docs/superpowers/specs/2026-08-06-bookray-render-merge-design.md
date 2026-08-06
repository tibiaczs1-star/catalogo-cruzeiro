# Bookray Render Merge Design

## Objetivo

Publicar em `/bookray/` a melhor combinação do editorial já reconhecível no Render com a galeria e o media kit ampliados da revisão R5/R6, preservando a rota e corrigindo a falha JavaScript que interrompe a renderização atual.

## Direção visual

**Tese visual:** editorial country de luxo, tipografia monumental, fotografia em primeiro plano e ritmo cinematográfico em preto, vinho e vermelho.

**Conteúdo:** hero de impacto; manifesto curto; coleções campanha/produto/parceiros/passarela; prova social contextualizada; CTA para media kit e contato responsável.

**Movimento:** entrada coreografada no hero, ticker contínuo, revelações por scroll, profundidade sutil nas imagens e lightbox navegável. Com `prefers-reduced-motion`, todo o conteúdo permanece visível e funcional.

## Arquitetura

- `bookray/index.html` contém todos os pontos de montagem e conteúdo essencial.
- `bookray/app.js` declara as coleções, monta cartões apenas quando o contêiner existe e inicializa lightbox/animações defensivamente.
- `bookray/styles.css` concentra composição responsiva e estados de movimento; nenhum conteúdo depende de animação para existir.
- `bookray/media-kit.html` e `bookray/downloads/media-kit-rayane.pdf` mantêm a entrega profissional.
- `bookray/bookray.test.js` impede regressão de seletores ausentes, assets quebrados, ausência de fallback e perda das seções.

## Critérios de aceite

1. `/bookray/`, `media-kit.html` e o PDF retornam HTTP 200.
2. Console do navegador sem erros.
3. Todas as seções aparecem no desktop e no celular, com JavaScript ativo ou falhando parcialmente.
4. Lightbox, navegação, progresso e animações funcionam; movimento reduzido é respeitado.
5. As fotos novas e as features anteriores permanecem acessíveis.

