# Current State

Updated: 2026-04-28T14:12:00-05:00

## Active Goal

- Sincronizar o jornal automatico com as atualizacoes recentes da home e da rotina online-local.

## Summary

`npm run sync:online-local` foi rodado na arvore limpa `.codex-temp/deploy-home-sync`, baseada em `origin/main`, para evitar misturar o pacote local do PubPaid. A rotina terminou com `ok: true`: 360 noticias, 0 missing, 54 imagens reparadas, `review-team totalIssues=0`, auditoria de imagens `360/360 ok` e runtime com 181 agentes/5 escritorios. O gerador `scripts/write-online-local-sync-pdf.js` foi promovido porque a rotina dependia dele para fechar o PDF. Depois do primeiro push, uma segunda conferencia na worktree principal promoveu apenas caches publicos mais novos (`article-integrity`, `image-preview`, `social-trends`, `topic-feed-buzz` e `topic-feed-economy`), mantendo `runtime-news` e `office-orders` do `main` porque estavam mais recentes.

## Next

- Commitar e enviar para `main` a segunda leva de caches publicos.
- Verificar producao apos o deploy com cache-bust na home e API publica.
- PubPaid continua local-only e nao deve entrar em deploy sem ordem explicita do usuario.
