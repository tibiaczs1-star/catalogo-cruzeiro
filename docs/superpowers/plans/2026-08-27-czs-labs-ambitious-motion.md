# Plano de implementação: CZS Labs — fase ambiciosa

> **Execução:** execução inline nesta tarefa, pois o usuário aprovou a direção e pediu a implementação imediata.

**Objetivo:** tornar a CZS Labs uma experiência cinematográfica de autonomia tecnológica regional, com movimento progressivo, controle de acessibilidade e performance móvel preservada.

**Arquivos:**
- Modificar: `czslbs/index.html`
- Modificar: `czslbs/styles.css`
- Modificar: `czslbs/script.js`
- Modificar: `scripts/__tests__/public-portal-route-contract.test.js`
- Criar: `docs/superpowers/specs/2026-08-27-czs-labs-ambitious-motion-design.md`

## Etapa 1 — Proteger a proposta com contrato

1. Criar um teste de contrato para campo de sinais, controle de movimento, progresso de scroll, Atlas de Ambição e fallbacks de acessibilidade.
2. Executar `node --test scripts/__tests__/public-portal-route-contract.test.js` e confirmar falha antes de alterar a implementação.

## Etapa 2 — Construir a experiência

1. Inserir no HTML as superfícies semânticas da experiência e reforçar o texto sobre controle local da ferramenta.
2. Criar os estilos do campo de sinais, da barra de progresso, do Atlas de Ambição e das transições CSS progressivas.
3. Implementar no JavaScript preferência de movimento, progresso com `requestAnimationFrame`, canvas pausável, visibilidade de aba e rotação de texto sem loops redundantes.
4. Manter fallback estático quando JavaScript, suporte a scroll animation ou movimento não estiverem disponíveis.

## Etapa 3 — Verificar o produto

1. Executar teste de contrato, `node --check czslbs/script.js` e `git diff --check`.
2. Abrir a rota local e validar HTTP 200.
3. Capturar desktop e celular com Playwright; conferir ausência de overflow horizontal, legibilidade e controle de movimento.
4. Fazer commit local. Deploy fica bloqueado até autorização explícita.
