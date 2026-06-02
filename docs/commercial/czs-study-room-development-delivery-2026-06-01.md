# Grupo De Estudos CZS - Entrega De Desenvolvimento

Data: 2026-06-01

## Missao

Reunir o conhecimento das 3000 referencias, delegar bancadas de estudo e transformar a nova `divulgue.html` em uma landing de venda, media kit vivo, relatorio comercial e demonstracao tecnologica do Catálogo CZS.

## Bancadas Delegadas

### Jornal

Tese: o CZS precisa ser painel diario hiperlocal do Vale do Jurua, nao portal generico.

Aplicacao:

- primeira dobra com promessa regional clara;
- painel diario com noticia, fonte, servico, confianca e conversao;
- separacao entre confianca editorial e venda comercial.

### Tecnologia

Tese: tecnologia precisa aparecer como sistema funcionando.

Aplicacao:

- canvas de rede no hero;
- console operacional;
- radar Centro/Jurua/Acre;
- fluxo noticia -> catalogo -> SEO -> WhatsApp;
- agentes, rotas/API, PubPaid, captura e distribuicao como camadas visuais.

### Media Kit

Tese: anunciante local compra formato claro, nao promessa abstrata.

Aplicacao:

- pacotes `Cadastro inteligente`, `Propagação local`, `Landing + SEO` e `Cota CZS`;
- cada pacote com entrega, uso e CTA direto para WhatsApp;
- termos SEO hiperlocais na pagina.

### Ativo Digital

Tese: comprador/cotista precisa enxergar operacao, risco, ativos e crescimento.

Aplicacao:

- secao de relatorio;
- grafico do motor economico;
- linguagem de ativo operando;
- cuidado com metrica: dado operacional, informado ou em construcao deve ser rotulado.

## Decisoes Incorporadas

- H1 final: `Anuncie em Cruzeiro do Sul com o Catálogo CZS`.
- Posicionamento: presença local verificável para empresas de Cruzeiro do Sul e Vale do Jurua.
- Hero deixou de ser apenas cinematografico e virou sala de controle comercial.
- Mobile recebeu quebras e limites para nao cortar texto.
- CSS novo usa menos flyer/card generico e mais painel, terminal, orbitas, grafico e seções com funcao clara.
- SEO de `server.js` atualizado para `Anuncie em Cruzeiro do Sul | Catalogo CZS`.
- JSON-LD continua injetado pelo servidor quando a pagina e servida em HTTP.

## Arquivos Alterados

- `divulgue.html`
- `divulgue.css`
- `divulgue.js`
- `server.js`

## Evidencia De Validacao

- `node --check server.js`: OK
- `node --check divulgue.js`: OK
- `git diff --check -- divulgue.html divulgue.css divulgue.js server.js`: OK
- HTTP local `/divulgue.html`: 200
- HTTP local `/divulgue.css?v=20260601-studyroom1`: 200
- HTTP local `/divulgue.js?v=20260601-studyroom1`: 200
- HTML final sem `{{SEO_*}}`
- HTML final com `application/ld+json`
- sitemap local contem `/divulgue.html`
- `npm run review:team`: OK, 3 achados existentes fora da landing em `cruzeiro-do-sul-barzinho/index.html`
- `npm run perf:budget`: OK, sem arquivos `over`

Screenshots:

- `.codex-temp/divulgue-studyroom-desktop-v3.png`
- `.codex-temp/divulgue-studyroom-mobile-v7.png`

## Proxima Etapa Recomendada

Antes de publicar, abrir a pagina em navegador real e revisar scroll completo. Depois, publicar no Render e verificar online:

- `/divulgue.html` 200;
- CSS/JS versionados `20260601-studyroom1`;
- H1 `Anuncie em Cruzeiro do Sul com o Catálogo CZS`;
- JSON-LD presente;
- sitemap com `/divulgue.html`;
- mobile sem scroll horizontal.
