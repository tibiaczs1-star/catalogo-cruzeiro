# Prompt de reuniao dos 181 agentes reais - Revisao editorial de materias

Reunir os agentes reais do workspace em `.codex-agents/agents/` para uma rodada focada na pagina interna de noticia (`noticia.html`, `noticia.js`, `noticia-enhance.css`, `news-data.js` e fluxo `/api/news/:slug`).

## Problema observado

Na materia aberta, o topo ja mostra titulo, imagem e resumo. Embaixo, no corpo editorial, o mesmo resumo apareceu de novo. Isso esta errado: a pagina deve ter titulo, resumo e depois uma leitura editorial propria, com contexto, checagem, impacto e cautelas. O corpo nao pode repetir literalmente a chamada/resumo.

## Ordem para os agentes

1. Mapear todos os pontos onde `summary`, `lede`, `description`, `analysis`, `body`, `development` e `highlights` sao renderizados.
2. Identificar qualquer bloco que repita o mesmo texto em secoes diferentes da materia.
3. Garantir esta hierarquia editorial:
   - topo: imagem, editoria, titulo, data/fonte e resumo curto;
   - checagem: resultado, fatos confirmados, impacto, pendencias e boatos/desmentidos;
   - corpo: editorial proprio, contextualizado, sem copiar o resumo;
   - fonte: card lateral com nome da fonte e botao para abrir a origem.
4. Quando a fonte nao trouxer corpo completo, gerar fallback editorial transparente, dizendo que e acompanhamento editorial, citando fonte/data/tema e evitando inventar fatos.
5. Validar que o fallback nao usa frase interna, placeholder, texto de sistema ou promessa vazia.
6. Validar mobile e desktop: sem texto cortado, cards sem sobreposicao, leitura com boa hierarquia.
7. Rodar a equipe local de revisao com `npm run review:team` e ler `.codex-temp/review-team/latest-report.md`.
8. Corrigir todos os achados editoriais antes da revisao manual do usuario.

## Criterio de aceite

- Nenhuma materia deve repetir no corpo o mesmo texto exibido no resumo.
- Se houver `body` real, ele aparece no corpo, descontando duplicata do resumo.
- Se nao houver `body`, o corpo mostra uma leitura editorial propria e honesta.
- A checagem continua funcionando, mas nao substitui o corpo da materia.
- A fonte original continua visivel e clicavel.
