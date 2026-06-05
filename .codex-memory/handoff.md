# Handoff

Updated: 2026-06-05T12:25:27-05:00

## Rodada V8 final speed/hydration v32

- Entrega em fechamento: CZS V8 com intro aprovada preservada, hidratação mais leve, cache-bust v32, licitações com lista útil e popup comercial validado.
- Teste local principal: `http://127.0.0.1:3001/?forceIntro=1`.
- Teste local direto do popup: `http://127.0.0.1:3001/?skipIntro=1&forcePopup=1`.
- Evidências locais: `output/v31-final-audit/`.
- Validações OK: `node --check` nos JS tocados, `git diff --check`, `npm run review:team`, `npm run perf:budget`, `npm run codex:health`.
- Antes de mexer de novo na home, preservar o fluxo da intro: 100% primeiro, botão "Clique para iniciar", vídeo original com áudio embutido, site só depois do final.
- Próximo assunto do usuário: colocar a IA online através do PC local. Não usar `127.0.0.1` no Render como se fosse o PC; precisa túnel/host seguro para Ollama/local runner.

## Nota anterior

Rotina WhatsApp corrigida concluida: grupos de venda = servicos/propagandas/convite sem noticia; Catálogo CZS = servicos + convite + todas as noticias do pacote do dia; VIP Dona D nao tocado.

## Next

- Na proxima rotina
- tratar todos os grupos de venda iguais: recebem tudo comercial/servico/convite
- nunca noticia. Catálogo CZS recebe todas as noticias do dia e servicos/convite
- mas nao venda/classificado.
