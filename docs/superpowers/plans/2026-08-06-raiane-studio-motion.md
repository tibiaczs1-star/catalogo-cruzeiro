# Raiane Book - direção de estúdio e movimento

## Tese visual

Construir um editorial digital de moda, não uma galeria genérica: preto, creme,
vermelho-sinal e dourado; fotos dominantes; tipografia serifada em escala de
revista; composição assimétrica e numeração de capítulos.

## Tese de conteúdo

Abertura cinematográfica, manifesto e medidas, capítulo de passarela, acervo
integral com 61 fotografias, trajetória e contato profissional. Nenhuma foto do
acervo novo fica fora do book principal.

## Tese de interação

- Cortina de abertura curta e não bloqueante.
- Profundidade 3D reagindo ao ponteiro na capa.
- Paralaxe baseada em rolagem com `requestAnimationFrame`.
- Revelação editorial via `IntersectionObserver`, sem depender de APIs CSS
  experimentais.
- Tilt suave nas fotos e lightbox com View Transition quando disponível.
- Experiência íntegra com redução de movimento e em dispositivos de toque.

## Entrega

1. Atualizar os testes do acervo, movimento e segurança visual.
2. Reconstruir capa, capítulo intermediário e grade editorial.
3. Remover fundos barrentos e colisões tipográficas do media kit.
4. Regenerar e renderizar o PDF para inspeção página a página.
5. Validar desktop e celular, versionar os assets, publicar e conferir as três
   rotas públicas.
