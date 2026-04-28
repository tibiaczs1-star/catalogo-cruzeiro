# Current State

Updated: 2026-04-28T14:05:00-05:00

## Active Goal

- Sincronizar o jornal automatico com as atualizacoes recentes da home e da rotina online-local.

## Summary

`npm run sync:online-local` foi rodado na arvore limpa `.codex-temp/deploy-home-sync`, baseada em `origin/main`, para evitar misturar o pacote local do PubPaid. A rotina terminou com `ok: true`: 360 noticias, 0 missing, 54 imagens reparadas, `review-team totalIssues=0`, auditoria de imagens `360/360 ok` e runtime com 181 agentes/5 escritorios. O gerador `scripts/write-online-local-sync-pdf.js` foi promovido porque a rotina dependia dele para fechar o PDF.

## Next

- Commitar e enviar para `main` apenas os arquivos reais da sincronizacao.
- Verificar producao apos o deploy com cache-bust na home.
- PubPaid continua local-only e nao deve entrar em deploy sem ordem explicita do usuario.
