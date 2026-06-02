# Correção P0 - Catálogo CZS Render - 2026-06-01

## Escopo
Correção local reversível dos P0 levantados no diagnóstico do Render para o Catálogo CZS.

## Backup antes das mudanças
Backup pré-alteração confirmado em:

`C:/Users/junio/projeto codex/.codex-backups/czs-render-fix-before-20260601-162728`

## Raiz dos problemas corrigidos
1. `/api/health` não existia no servidor principal do Render, gerando 404 em health check simples.
2. Um slug público antigo da notícia do Rio Juruá não tinha fallback estável em `/api/news/:slug`, gerando notícia quebrada/404.
3. Popups de PubPaid/enquete apareciam automaticamente sobre a leitura principal e sobre o catálogo de serviços.
4. O splash/mobile mantinha esperas longas demais para primeira dobra e thumbnails (`7600ms`/`18000ms`), gerando sensação de travamento.
5. O card SEO claro do catálogo de serviços dependia de herança visual e precisava de contraste explícito.

## Arquivos alterados nesta correção
- `server.js`
  - adicionada rota `GET /api/health` com `ok=true`.
  - adicionado fallback editorial para slug antigo do Rio Juruá.
- `script.js`
  - limite mobile de primeira dobra definido em `mobileFirstFoldMaximumMs = 3000`.
  - removido agendamento automático do popup central da home.
  - criado card inline não bloqueante para PubPaid/enquete.
  - reduzidos delays de thumbnails/fallback mobile.
- `styles.css`
  - estilos do card inline não bloqueante da home.
- `catalogo-servicos.js`
  - popup de ativação deixou de abrir automaticamente.
  - convite passou a aparecer como card inline e só abre modal por clique do usuário.
- `catalogo-servicos.css`
  - contraste explícito em `.svc-seo-local`.
  - estilos do convite inline do catálogo.
- `scripts/czs-render-p0-regression-check.js`
  - novo teste/regressão para health, slug de notícia, popup, mobile splash e contraste.

## Verificações executadas

### Regressão P0
Comando:

`node scripts/czs-render-p0-regression-check.js`

Resultado:

`CZS_RENDER_P0_REGRESSION_OK`

### Syntax check JS
Comando:

`node --check server.js && node --check script.js && node --check catalogo-servicos.js && node --check scripts/czs-render-p0-regression-check.js`

Resultado: exit code 0, sem erros.

### Performance budget
Comando:

`npm run perf:budget`

Resultado:

- `ok: true`
- `over: 0`
- observações em `watch` permanecem dentro do teto (`ceiling`) e não bloqueiam.

### Servidor local e API
Servidor local de teste:

`http://127.0.0.1:3198`

Health retornou:

`200 {"ok":true,"service":"catalogo-czs-render","status":"healthy",...}`

### Verificação visual Playwright
Screenshots salvos em:

`C:/Users/junio/projeto codex/reports/czs-render-diagnostic/fix-verification/`

Evidências:
- `home-desktop-fixed.png`
  - popup central da home: `0`
  - card inline: `1`
- `home-mobile-fixed.png`
  - popup central mobile: `0`
  - card inline: `1`
  - body carregado como `site-loaded`
- `catalogo-servicos-fixed.png`
  - popup visível automático: `0`
  - convite inline: `1`
- `noticia-fallback-fixed.png`
  - slug antigo abriu com título: `Rio Juruá segue em atenção e exige monitoramento em Cruzeiro do Sul`

## Status
Correção local concluída e validada. Próximo passo, se aprovado pelo Junior: revisar diff final e fazer deploy/push do Render. Nenhum deploy/push foi executado nesta etapa.
