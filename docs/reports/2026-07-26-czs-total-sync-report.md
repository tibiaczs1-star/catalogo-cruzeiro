# Relatório de sincronização total CZS — 2026-07-26

## Resultado executivo

- Git remoto, Render e portal público estão no commit `e6561b8afecf3c0e05b2071f695c26739f2813b3`.
- Deploy Render `dep-d9iqofd0kf9s73bq736g` confirmado como `live`.
- Portal e subsites públicos responderam HTTP 200.
- Rotina editorial validada sem erro estrutural; 58 itens continuam exigindo aprovação humana de fonte.
- Publicação social não foi declarada: os materiais de Instagram foram refinados em tarefa separada, mas ainda exigem preview final e confirmação visual da conta `@catalogo_czs_`.

## Superfícies verificadas

| Superfície | Estado |
| --- | --- |
| Portal `catalogo-cruzeiro-web.onrender.com` | HTTP 200 |
| API `/api/news` | HTTP 200 |
| `/bookray/` | HTTP 200 |
| `/ashotelaria/` | HTTP 200 |
| `/questfest/` | HTTP 200 |
| `/metafest/` | HTTP 200 |
| `/reservar/` | HTTP 200 |
| `ashotelaria-saas.onrender.com` | HTTP 200 |
| `questfest-x5te.onrender.com` | HTTP 200 |

## Provas técnicas

- `node --check server.js`: aprovado.
- `node --check assets/v8-final/v8-merge-ready.js`: aprovado.
- `npm run rayx:test`: 6 testes aprovados.
- `npm run editorial:health`: `ok: true`.
- `npm run perf:budget`: executado; orçamento informativo detectou a home acima do teto.
- `npm run cleanup:audit`: 1 candidato gerado, `dist/rayx/RayX.exe`, 5,5 KB.
- Metadado órfão de worktree `deploy-divulgue-main-a2a` removido com `git worktree prune`.
- Validação de armazenamento administrativo ficou bloqueada pela ausência de `ADMIN_TOKEN`.

## Otimização priorizada

O `index.html` tem cerca de 2,16 MB. Aproximadamente 2,05 MB estão no bloco
`<script id="newsData" type="application/json">`, que embute 480 registros.
O servidor público entrega gzip, mas a página usa `Cache-Control: no-store`.

Migração recomendada:

1. manter no HTML somente um snapshot inicial pequeno;
2. carregar o arquivo editorial completo sob demanda;
3. preservar fallback local/offline;
4. atualizar os scripts de ingestão para gravarem na fonte canônica, não no HTML;
5. testar busca, arquivo, modo compacto, carregamento frio e recuperação sem API;
6. só então reduzir o bloco embutido e publicar.

Essa mudança não foi aplicada nesta rodada porque altera a arquitetura editorial e
o mecanismo de recuperação. Remover o bloco isoladamente quebraria scripts atuais.

## Pendências com gate

- Instagram: aprovar o preview final e conferir visualmente `@catalogo_czs_` antes de publicar.
- Facebook: operar somente com o perfil visível `Clovis Sampaio`.
- Storage Render: fornecer a credencial administrativa no ambiente para executar a checagem protegida.
- Limpeza física de artefato: `dist/rayx/RayX.exe` foi identificado, mas não removido automaticamente.
