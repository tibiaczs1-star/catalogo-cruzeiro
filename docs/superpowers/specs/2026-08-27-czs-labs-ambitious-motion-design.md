# CZS Labs — Direção da fase ambiciosa

**Data:** 2026-08-27

## Tese visual

A CZS Labs deixa de parecer uma página estática de portfólio e passa a se comportar como uma infraestrutura em atividade: uma rede de sinais nasce no hero, reage à rolagem e conduz a pessoa por evidências de autonomia regional.

## Princípios

- O movimento serve à leitura: cada efeito anuncia uma mudança de etapa, sistema ou prova.
- A narrativa começa no conflito de concentração nas capitais e chega à capacidade local de criar, operar e ganhar referência no Acre e no Brasil.
- O hero recebe a maior densidade visual. O restante usa movimento em camadas, para manter contraste e desempenho.
- Há controles explícitos para interromper movimento e respeito integral a `prefers-reduced-motion`.
- Sem dependências de 3D pesadas. Canvas, CSS progressivo e APIs nativas dão o efeito sem comprometer conexões móveis.

## Componentes aprovados

1. Campo de sinais no hero, com núcleo CZS Labs, órbitas e eixos de produção local.
2. Linha de progresso da jornada e leitura de etapa no topo.
3. Alternância de movimento para a pessoa controlar a experiência.
4. Seção Atlas de Ambição que mostra a passagem de escuta a operação e referência.
5. Transições por View Transition API quando suportadas, com fallback natural.
6. Reveals guiados por scroll em browsers compatíveis e IntersectionObserver como fallback.

## Não entra nesta fase

- Reprodução automática de som.
- Vídeos decorativos adicionais sem função narrativa.
- WebGL/Three.js em toda a página.
- Imagens genéricas de rio, mockups de logo ou capturas do portal antigo.
