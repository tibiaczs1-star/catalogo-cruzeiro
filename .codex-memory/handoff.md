# Handoff

Updated: 2026-05-22T15:30:00.000Z

PubPaid HUD mobile corrigido no build `20260522-mobilehud2`.

- Xadrez treino mobile nao renderiza mais o botao redundante `Sair`; `Mesas` continua como volta.
- Instrucao mobile do Xadrez foi movida para o rodape esquerdo, separada de `Mesas` e `Mesa fixa`.
- Damas mobile landscape esconde a sidecar em ate 760px/430px para nao cobrir o tabuleiro nem duplicar acoes.
- Varredura Browser 740x420 validou Xadrez, Damas e Sinuca sem overlap de HUD essencial; console sem erros.
- Guard PubPaid, `node --check`, `git diff --check` e `npm run review:team` passaram localmente. O review-team segue reportando 42 apontamentos gerais ja existentes.

## Next

- Commitar e subir online.
