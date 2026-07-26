# Plano de Sincronização Total CZS — 2026-07-26

## Objetivo

Consolidar o Catálogo CZS e seus módulos numa base Git limpa, validar a publicação automática no Render, inventariar subsites e ferramentas e preparar a sincronização social sem apagar alterações paralelas nem publicar em conta errada.

## Fontes incorporadas

- `origin/main` / commit `e6561b8a`: correção editorial, ordenação das notícias e ajustes da home.
- Artefatos de identidade e captação em `C:\Users\junio\Documents\Codex\2026-07-23\ul\outputs`.
- Regras vigentes de produto, portal regional, propaganda e rotinas sociais em `docs/`.
- Estado compartilhado do AgentHub e handoffs do Projeto Codex.

## Sequência operacional

### 1. Congelar a base de referência

- Usar a worktree limpa `catalogo-recovery-20260726`.
- Confirmar que `HEAD`, `origin/main` e o commit publicado são idênticos.
- Manter intacta a raiz `C:\Users\junio\projeto codex`, que contém alterações locais paralelas.

### 2. Validar o produto integrado

- Executar checagem sintática do servidor e scripts alterados.
- Executar saúde editorial, orçamento de desempenho e checagem de armazenamento.
- Subir o servidor local temporariamente e validar home e APIs críticas.
- Conferir que o portal mantém hierarquia regional e que anúncios não invadem o texto editorial.

### 3. Verificar GitHub e Render

- Confirmar o SHA remoto de `main`.
- Consultar serviços, deploy atual e histórico do Render sem expor segredos.
- Comparar o commit do deploy com `e6561b8a`.
- Validar publicamente a home, os assets alterados e endpoints essenciais.
- Só disparar novo deploy se o auto-deploy estiver ausente, falho ou apontando para SHA antigo.

### 4. Inventariar subsites e ferramentas

- Mapear rotas e módulos habilitados pelo servidor e pelo `render.yaml`.
- Testar cada rota pública encontrada e classificar: operacional, restrita, desabilitada ou quebrada.
- Verificar ferramentas de saúde, editorial, DNS, armazenamento, agentes e ponte Render.
- Não incorporar branches antigas apenas por existirem; exigir diferença útil, testes e compatibilidade.

### 5. Incorporar identidade social concluída

- Preservar o piloto e o layout v2 como artefatos de referência.
- Aplicar as regras aprovadas: logo discreta no canto, exceção apenas para cobrir marca concorrente, faixa inferior uniforme e outro CZS.
- Publicação Instagram somente após confirmar visualmente `@catalogo_czs_` e o preview final.
- Facebook/comercial somente com o perfil visível `Clovis Sampaio`.
- WhatsApp de vendas somente para conteúdo comercial aprovado; notícia segue para canal jornalístico.

### 6. Otimização e limpeza conservadora

- Rodar auditoria de limpeza antes de remover qualquer item.
- Remover apenas metadados de worktree comprovadamente órfãos.
- Não usar reset, force-push ou exclusão em massa.
- Não apagar outputs, relatórios, branches ou worktrees com trabalho não incorporado.
- Registrar candidatos a limpeza que dependam de decisão posterior.

### 7. Evidência e encerramento

- Registrar SHA Git, estado do deploy, URLs verificadas, testes e inventário de rotas.
- Atualizar handoff somente com resultados comprovados.
- Separar claramente: sincronizado, validado, pendente de gate visual e bloqueado por sessão/conta.

## Critérios de conclusão

- `origin/main` contém a versão integrada e testada.
- Render serve o mesmo commit ou uma versão comprovadamente equivalente.
- Home, APIs e subsites críticos respondem conforme esperado.
- Nenhuma alteração paralela é perdida.
- Canais sociais só recebem publicação na identidade correta e após seus gates obrigatórios.
- O relatório final contém provas reproduzíveis e pendências reais, sem declarar sucesso por inferência.
