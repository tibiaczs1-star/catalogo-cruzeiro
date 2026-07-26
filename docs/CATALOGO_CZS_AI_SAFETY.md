# Protocolo de segurança — Catálogo CZS

Este arquivo é obrigatório para qualquer IA, automação ou pessoa que altere o portal Catálogo CZS, seus subsites ou sua publicação.

## 1. Antes de editar

1. Leia `AGENTS.md`, `CODEX_MEMORY.md`, `.codex-memory/current-state.md`, `.codex-memory/handoff.md`, `docs/CODEX_SOCIAL_SITE_ROUTINES.md` e `docs/CZS_PRODUCT_MASTER_RULES.md`.
2. Rode `git status --short`. Se a raiz estiver suja, preserve tudo e crie uma worktree limpa. Nunca use `reset --hard`, descarte ou sobrescreva mudanças do usuário.
3. Registre o commit saudável de origem e compare o diff antes de alterar arquivos centrais.
4. Não substitua nem reorganize em massa `index.html`, `home.css`, `server.js`, `render.yaml` ou `package.json`. Faça mudanças pequenas, revisáveis e testadas.

## 2. Contrato público que não pode quebrar

- `/` abre diretamente o portal regional completo, com `home.css` existente e rastreado pelo Git.
- A abertura cinematográfica só aparece quando solicitada explicitamente por `?intro=1` ou `?forceIntro=1`; ela nunca pode prender o acesso normal.
- `/bookray` redireciona para `/bookray/`.
- `/ashotelaria` redireciona para `/ashotelaria/`.
- `/questfest` redireciona para `/questfest/`.
- `/metafest` redireciona para `/metafest/`.
- `/reservar` e `/reservar/` redirecionam para `/reservar/hotel-jurua-palace/`.
- `/pubpaid` abre o PubPaid publicado.
- `/downloads/catalogo-czs-android.apk` responde como `application/vnd.android.package-archive`.
- `/downloads/catalogo-czs-android.json` responde sem cache e descreve o APK real.

O CZS é um portal regional/editorial, não uma landing page genérica. Preserve notícias, utilidade pública, serviços, feed e a hierarquia Juruá, Cruzeiro do Sul, Purus, Acre e Brasil/Mundo.

## 3. Testes mínimos antes de commit

```powershell
npm ci --ignore-scripts
node --test scripts/__tests__/homepage-stylesheet-deploy.test.js scripts/__tests__/public-portal-route-contract.test.js scripts/__tests__/czs-android-pwa-download.test.js
node --test scripts/__tests__/*.test.js
```

Também abra localmente, em desktop e celular, cada rota da seção 2. Verifique título, CSS, imagens, console, rolagem horizontal, links e redirecionamentos.

Não declare “corrigido” apenas porque o servidor iniciou. Uma falha já existente na linha de base deve ser registrada separadamente; nenhuma regressão nova pode ser aceita.

## 4. Git, Render e prova pública

1. Confirme com `git diff --check`, revise `git diff` e confirme que todos os assets referenciados estão rastreados com `git ls-files`.
2. Push e deploy são ações externas: só execute com autorização explícita do usuário.
3. Depois do push, espere o Render publicar exatamente o novo commit.
4. Repita a matriz de rotas na URL pública e verifique que CSS, JavaScript, imagens, JSON e APK não retornam 404.
5. Só informe sucesso com evidência pública recente. Um commit, push ou status “deploying” não prova que o site está saudável.

## 5. Instagram e outras contas

- O Instagram oficial do CZS é `@catalogo_czs_`.
- Antes de publicar, confirme visualmente que a conta ativa é exatamente essa e faça preview visual da peça.
- Não publique, apague conteúdo, troque perfil ou mexa na conta sem autorização explícita.
- Nunca use notícia crua em grupo comercial e nunca use outro perfil do Facebook para conteúdo CZS/comercial.

## 6. Segurança

- Nunca grave tokens, cookies, chaves ou senhas no repositório, na documentação ou em screenshots.
- Não introduza senha administrativa padrão no código.
- Não execute pagamento, login sensível, exclusão importante ou alteração de conta por inferência.

## 7. Recuperação se algo falhar

1. Pare novas mudanças e preserve a árvore atual.
2. Reproduza a falha em uma worktree isolada.
3. Compare com o último commit comprovadamente saudável.
4. Restaure somente o contrato quebrado, com um teste que falha antes e passa depois.
5. Valide localmente, publique somente com autorização e teste novamente no endereço público.

Última revisão: 26 de julho de 2026.
