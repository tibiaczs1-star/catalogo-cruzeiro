# Equipe Local de Revisao Premium

Equipe fixa de agentes locais para revisar o site com foco de publicacao real.

## Objetivo

Pegar o que normalmente passa batido em portais vivos:

- titulo ruim ou ausente em cards;
- texto editorial que parece recado interno para criador, nao leitura para usuario;
- placeholder, loading e copy provisoria vazando para o front;
- botoes, links e CTAs sem funcao clara;
- falta de fontes ou pouca diversidade de dominios por editoria.

## Agentes

- `agents/ui-detail-reviewer.md`
- `agents/editorial-reader-reviewer.md`
- `agents/cta-function-reviewer.md`
- `agents/source-scout.md`
- `agents/final-publishing-reviewer.md`

## Fluxo

1. Rodar `npm run review:team`.
2. Ler o relatorio em `.codex-temp/review-team/latest-report.md`.
3. Corrigir por bloco: interface, editorial, CTA, fontes.
4. Atualizar `CODEX_MEMORY.md` e `.codex-memory/` quando uma rodada grande fechar.

## Filtro de ruido

O auditor ja ignora diretorios de ambiente temporario e headless, alem de nao tratar `loading="lazy"` ou `document.readyState === "loading"` como problema editorial.

## Saidas do auditor

- `.codex-temp/review-team/latest-report.json`
- `.codex-temp/review-team/latest-report.md`

## Uso esperado

Esta equipe nao substitui revisao humana final. Ela funciona como triagem permanente antes da revisao manual com o usuario.
