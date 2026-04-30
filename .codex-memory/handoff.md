# Handoff

Updated: 2026-04-30T12:20:00-05:00

Rodada geral em fechamento. O usuario pediu subir a pagina, sincronizar noticias/subsites, ordenar reuniao geral dos agentes, estudar fontes e publicar. Foram criados os prompts `PROMPT_CAPTACAO_SOCIAL_FACEBOOK_TENDENCIAS_2026-04-30.md` e `PROMPT_REUNIAO_GERAL_FLUXO_SITE_SUBSITES_2026-04-30.md`.

Principais mudancas: `script.js` usa `/api/social-trends` antes de buzz comum, so rotula Instagram/Facebook/X quando ha evidencia social, removeu tarefas internas dos cards publicos e corrigiu Capa Especial para priorizar noticias do dia antes de lotes antigos. `server.js` ganhou captacao Facebook por Graph API configuravel e classificacao de tendencias por divisao. `arquivo-noticias.js` limpa markup/atributos em cards do arquivo.

Validacoes feitas: `npm run sync:online-local` ok com 554 noticias e review 0; `npm run review:team` ok; `node --check` nos JS publicos; smoke HTTP em home, subsites e APIs; Playwright final com `hasRotinas=false`, `hasFakeEscuta=false` e `stale26Matches=[]`.

PubPaid continua fora de commit/deploy por regra do usuario. Nao incluir `data/heartbeats.json`, `data/visits.json`, `data/image-preview-cache.json`, `progress.md` ou arquivos `pubpaid*` no pacote desta publicacao.

Proximo passo: commitar o pacote publico e enviar para `render-target HEAD:main`; depois relatar o commit/deploy e lembrar que Facebook real precisa das variaveis `FACEBOOK_GRAPH_ACCESS_TOKEN` e `FACEBOOK_PUBLIC_PAGE_IDS`.
