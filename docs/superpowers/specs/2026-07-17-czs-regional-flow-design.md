# CZS Regional Flow Design

## Objetivo

Transformar a home do CZS em um fluxo editorial vivo inspirado no ritmo modular do MSN, mas com prioridade regional: Destaques, Cruzeiro do Sul, Vale do Juruá, Rio Branco, Vale do Purus, Brasil e Geral orgânico.

## Regra editorial

Cada região precisa ter subeditorias internas. Exemplo: `Polícia do Juruá`, `Polícia de Rio Branco`, `Polícia do Brasil`, `Serviços de Cruzeiro`, `Política do Acre`, `Vídeos e virais`.

## Comportamento

- O feed principal deve virar `CZS Flow`.
- O fluxo deve alternar blocos regionais com pequenos respiros orgânicos.
- Memes, polêmicas, vídeos e curiosidades entram no meio quando combinarem com o ritmo, sem passar por cima do hiperlocal.
- Propagandas nativas entram entre blocos, parecendo parte do jornal, mas marcadas como patrocinadas.
- O carregamento continua em lotes para manter a sensação infinita.

## Arquitetura

- `assets/v8-final/czs-flow-engine.js`: classifica matéria por região/subeditoria e monta entradas do fluxo.
- `assets/v8-final/v8-merge-ready.js`: consome o motor, substitui o feed antigo por uma seção `CZS Flow` e renderiza os cards.
- `assets/v8-final/v8-merge-ready.css`: estiliza trilhos, cards regionais, anúncios e responsivo.
- `index.html`: carrega o motor antes do script principal e atualiza cache-bust.

## Critérios de pronto

- Deve existir card/linha com região e subeditoria.
- Deve classificar polícia local e polícia nacional de forma diferente.
- Deve inserir anúncios nativos dentro do fluxo.
- Deve inserir itens gerais/orgânicos entre blocos regionais.
- Deve funcionar no mobile sem overflow horizontal.
