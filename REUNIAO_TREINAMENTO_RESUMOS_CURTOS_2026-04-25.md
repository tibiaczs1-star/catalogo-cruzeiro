# Reuniao de Treinamento - Resumos Curtos no Front

Data: 2026-04-25

## Ordem corrigida

O front/home do site deve ser feito de resumos, nao de artigos completos. A pessoa precisa ver a parte interessante e ter vontade de clicar. Quando abre para ler, a pagina de noticia continua com a estrutura completa.

## Agentes treinados

- `editorial-reader-reviewer`: deve identificar home/card usando `lede`, `summary`, `description` ou `rawLede` bruto e exigir resumo curto de chamada.
- `ui-detail-reviewer`: deve apontar card que vira parede de texto ou depende apenas de CSS para esconder artigo inteiro.
- `final-publishing-reviewer`: deve bloquear publicacao quando a auditoria reportar resumo publico com cara de artigo completo.

## Regra permanente

- Home/card/front: 1 a 2 frases, leitura rapida, gancho claro para o clique.
- Pagina de noticia: deve manter o texto completo quando houver materia propria, com corpo, analise, contexto, destaques e fonte.
- Fonte original: segue acessivel pelo link, sem copiar artigo inteiro para preview.

## Auditoria aplicada

`scripts/review-team-audit.js` agora pontua como erro alto na home:

- chamada usando `summary`, `lede`, `description` ou `rawLede` bruto sem `displaySummary`, `truncateCopy` ou normalizacao equivalente;
- texto literal de preview da home com cara de artigo colado.

## Criterio de pronto

Uma rodada so passa quando `npm run review:team` nao trouxer erro de chamada da home usando texto bruto. `noticia.html` nao deve ser reduzida por essa regra.
