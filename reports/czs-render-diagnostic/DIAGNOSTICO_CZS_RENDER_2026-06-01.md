# Diagnostico completo - Catalogo CZS online no Render

Data/hora do teste: 2026-06-01 16:03:31 HPB
Alvo: https://catalogo-cruzeiro-web.onrender.com/
Escopo: Render online, home, catalogo de servicos, arquivo, divulgue, noticia, Cheffe Call, galeria, fontes, legal, SEO basico, endpoints publicos, console, screenshots desktop/mobile e interacoes principais.
Ferramentas usadas: urllib/curl via Python, Playwright com Chrome headless, capturas desktop/mobile, leitura visual das capturas, checagem de endpoints e recursos.

Arquivos de evidencia:
- Resultado bruto Playwright: C:\Users\junio\projeto codex\reports\czs-render-diagnostic\raw-playwright-results.json
- Rerun mobile: C:\Users\junio\projeto codex\reports\czs-render-diagnostic\mobile-rerun.json
- Pasta de screenshots: C:\Users\junio\projeto codex\reports\czs-render-diagnostic\screenshots

## Resumo executivo

Status geral: o site esta online e a maior parte das paginas principais responde 200 no Render, mas existem problemas importantes de experiencia, disponibilidade/intermitencia, noticia quebrada, popups bloqueando uso, catalogo de servicos ainda fraco como catalogo real e sinais de deploy/API desalinhados.

Contagem de problemas encontrados:

| Severidade | Quantidade |
|---|---:|
| Critico | 0 |
| Alto | 4 |
| Medio | 8 |
| Baixo | 5 |
| Total | 17 |

Pontos bons confirmados:
- Home responde 200.
- Paginas principais respondem 200: catalogo-servicos, arquivo, divulgue, cheffe-call, galeria, fontes-monitoradas, legal.
- API de noticias publica responde: /api/news?limit=5 retornou ok=true, total=1841.
- Arquivo de noticias carrega e busca no arquivo funciona no teste com termo "rio".
- SEO basico existe: title, meta description, canonical, OG/Twitter tags, robots.txt e sitemap.xml.
- Imagens da home possuem alt no HTML inicial testado: 7 imagens, 0 sem alt.
- Manifest e icones PWA existem: site.webmanifest, icon-192.png, icon-512.png.

Principais riscos:
1. Link de noticia da home aponta para materia que a API nao encontra, gerando 404 e tela "Noticia nao encontrada".
2. Popups/modal aparecem cedo demais e bloqueiam leitura/interacao, especialmente no catalogo de servicos mobile.
3. Home mobile apresentou splash/tela de carregamento dominando visualmente e grande area vazia na captura, mesmo com DOM tendo conteudo.
4. Render apresentou 502 Bad Gateway durante uma rodada automatizada com navegador, embora os re-testes HTTP tenham voltado 200. Isso indica risco de instabilidade/transiente sob carga ou durante renderizacao.

## Cobertura testada

Paginas testadas em desktop e/ou mobile:
- /
- /catalogo-servicos.html
- /arquivo.html
- /divulgue.html
- /noticia.html?slug=rio-jurua-esta-proximo-de-sair-da-cota-de-transbordamento-em-cruzeiro-do-sul
- /cheffe-call.html
- /galeria.html
- /fontes-monitoradas.html
- /legal.html

Endpoints testados:
- /api/news?limit=5: 200
- /api/news/archive?limit=5: 200
- /api/news/aggregator?limit=1: 200
- /api/elections/acre?scope=all: 200
- /api/auth/config: 200
- /api/auth/session: 200
- /api/cheffe-call: 200
- /api/cheffe-call/prompts: 200
- /api/social-trends: 200, mas total=0 e varios conectores pendentes
- /api/pubpaid/account: 401 esperado sem login
- /api/ninjas/opportunities: 410 indisponivel
- /api/ninjas/pix?amount=1: 410 indisponivel
- /api/health: 404
- /api/elections/ranking: 404
- /api/votes/summary: 404
- /api/topic-feed: 404 quando chamado sem topico

## Metricas observadas

Home desktop:
- Status: 200
- DOMContentLoaded: 476 ms
- Load: 6185 ms
- Transferencia total de recursos: aprox. 4.16 MB
- Recursos: 112 total, 9 JS, 66 CSS, 50 imagens
- ScrollHeight: 19024 px
- Console: sem erros JS na rodada desktop principal
- Screenshot: C:\Users\junio\projeto codex\reports\czs-render-diagnostic\screenshots\home-desktop.png

Home mobile:
- Status no rerun: 200
- Load medido: 2272 ms
- Transferencia total de recursos: aprox. 3.40 MB
- Recursos: 60 total, 4 JS, 39 CSS, 26 imagens
- ScrollHeight: 29564 px
- Screenshot rerun: C:\Users\junio\projeto codex\reports\czs-render-diagnostic\screenshots\home-mobile-rerun.png

SEO/HTML inicial:
- Title: Catalogo CZS | Jornal de Cruzeiro do Sul e Vale do Jurua
- Description: Noticias de Cruzeiro do Sul, Vale do Jurua e Acre, com servicos uteis, arquivo local, fontes verificadas e catalogo de empresas da regiao.
- Canonical: https://catalogo-cruzeiro-web.onrender.com/
- OG tags: 6
- Twitter tags: 4
- H1 count: 1
- robots.txt: 200
- sitemap.xml: 200

## Problemas encontrados

### 1. Link de noticia da home quebra na pagina de noticia

Severidade: Alto
Categoria: Funcional / SEO / Conteudo
URL: https://catalogo-cruzeiro-web.onrender.com/noticia.html?slug=rio-jurua-esta-proximo-de-sair-da-cota-de-transbordamento-em-cruzeiro-do-sul
Evidencia: C:\Users\junio\projeto codex\reports\czs-render-diagnostic\screenshots\noticia-rio-jurua-desktop.png

Resultado observado:
- A pagina /noticia.html carrega 200, mas a chamada interna para /api/news/rio-jurua-esta-proximo-de-sair-da-cota-de-transbordamento-em-cruzeiro-do-sul retorna 404.
- A tela mostra H1 "Noticia nao encontrada".
- Console: Failed to load resource: the server responded with a status of 404.

Impacto:
- Leitor que clica em materia da home cai em erro.
- O sitemap e SEO podem indexar noticia morta.
- Quebra confianca editorial.

Acao recomendada:
- Sincronizar slugs da home/sitemap com /api/news/:slug.
- Criar fallback por id/originalUrl quando slug antigo nao existir.
- No deploy, rodar teste automatico: todo href noticia.html?slug=X deve retornar /api/news/X 200.

### 2. Render mostrou 502 Bad Gateway durante rodada com navegador

Severidade: Alto
Categoria: Disponibilidade / Infra
URLs afetadas na rodada: home, catalogo-servicos, arquivo, divulgue, noticia, cheffe-call, galeria, fontes, legal
Evidencias:
- C:\Users\junio\projeto codex\reports\czs-render-diagnostic\screenshots\home-mobile.png
- C:\Users\junio\projeto codex\reports\czs-render-diagnostic\raw-playwright-results.json

Resultado observado:
- Durante uma rodada Playwright, as paginas mobile retornaram 502 Bad Gateway.
- Request ID visivel na tela: a0511f353ac14fe0-GIG.
- Re-testes HTTP depois retornaram 200 para home/catalogo/arquivo com UA generic, desktop e mobile.

Impacto:
- Nao parece queda permanente, mas indica risco transiente no Render sob sequencia de carregamentos/browser.
- Pode afetar usuario real quando o servico acorda, reinicia ou atinge limite.

Acao recomendada:
- Conferir logs do Render no horario do teste.
- Adicionar rota /api/health real em producao e monitoramento a cada 1-5 min.
- Se for plano free/sleep, considerar keepalive leve ou otimizar cold start.
- Verificar memoria/CPU no Render e volume de requests gerados por prefetch, popup e analytics.

### 3. Popup/convite bloqueia interacao no catalogo de servicos mobile

Severidade: Alto
Categoria: UX / Funcional
URL: https://catalogo-cruzeiro-web.onrender.com/catalogo-servicos.html
Evidencia: C:\Users\junio\projeto codex\reports\czs-render-diagnostic\screenshots\catalogo-servicos-mobile-rerun.png

Resultado observado:
- Modal "Conheca o PubPaid e participe da nossa enquete eleitoral" aparece sobre categorias e conteudo.
- Ao tentar clicar em categorias como Farmacias, Saude, Restaurantes e Emergencia, Playwright registrou bloqueio por interceptacao de pointer events pelo modal.
- O usuario precisa fechar popup antes de usar o catalogo.

Impacto:
- A primeira experiencia do catalogo fica travada por promocao.
- A pagina que deveria ser consulta rapida vira uma barreira.

Acao recomendada:
- Nao abrir popup automaticamente no catalogo de servicos.
- Se insistir no convite, abrir so apos 30-45 segundos ou apos scroll/click voluntario.
- Salvar estado no localStorage/cookie para nao repetir a cada visita.
- Nunca cobrir categorias/CTA principal em mobile.

### 4. Home mobile fica visualmente presa em splash/carregamento e area vazia

Severidade: Alto
Categoria: UX / Performance visual
URL: https://catalogo-cruzeiro-web.onrender.com/
Evidencia: C:\Users\junio\projeto codex\reports\czs-render-diagnostic\screenshots\home-mobile-rerun.png

Resultado observado:
- O screenshot mobile apos carregamento mostra a marca em uma tela azul e uma enorme area vazia escura, com repeticao visual do splash mais abaixo.
- O DOM ja tinha texto/conteudo, mas visualmente a primeira tela nao entregou manchete/utilidade.
- Isso conflita com a regra do produto: em menos de 5 segundos a home precisa responder o que aconteceu agora e o que muda hoje.

Impacto:
- Mobile e o canal principal local; se a primeira tela parece carregando/vazia, perde leitor.
- A home deixa de funcionar como painel diario rapido.

Acao recomendada:
- Remover ou encurtar drasticamente o splash no mobile.
- Garantir que a manchete principal apareca sem depender de animacao pesada.
- Adicionar teste visual mobile: apos 3 segundos, H1/manchete e CTA devem estar visiveis acima da dobra.

### 5. Home desktop tem popup central e cookie box competindo com a manchete

Severidade: Medio
Categoria: UX / Visual
URL: https://catalogo-cruzeiro-web.onrender.com/
Evidencia: C:\Users\junio\projeto codex\reports\czs-render-diagnostic\screenshots\home-desktop.png

Resultado observado:
- Popup central "Jogue, opine e ajude o Jurua" cobre a manchete principal.
- Cookie box tambem aparece na lateral direita.
- A primeira dobra fica com excesso de elementos concorrendo pela atencao.

Impacto:
- A hierarquia editorial fica prejudicada.
- A manchete, que deveria dominar, fica parcialmente bloqueada.

Acao recomendada:
- Priorizar manchete e servico publico acima de qualquer popup.
- Transformar convite PubPaid/enquete em card lateral/inline apos a primeira dobra.
- Cookie consent mais discreto e sem competir com modal.

### 6. Catalogo de servicos ainda nao se comporta como catalogo local completo

Severidade: Medio
Categoria: Conteudo / Produto
URL: https://catalogo-cruzeiro-web.onrender.com/catalogo-servicos.html

Resultado observado:
- A pagina informa "EM PREPARACAO" e mostra servicos digitais/proprios antes de contatos locais uteis.
- Para termos "farmacia", "farmacia", "saude", "saúde" e "uber", a busca reduziu para os mesmos 4 artigos visiveis ligados ao modulo promocional, nao para uma lista real de estabelecimentos correspondentes.
- Categorias locais existem como chips, mas a primeira experiencia fica dominada por modal e publicidade.

Impacto:
- O usuario que procura farmacias, saude, emergencia ou transporte pode nao encontrar resposta util rapida.
- O site promete catalogo regional, mas entrega primeiro a oferta de servicos digitais do proprio CZS.

Acao recomendada:
- Separar "Servicos do CZS" de "Catalogo util local".
- Fazer categorias retornarem listas reais e prioritarias: farmacia, hospital, emergencia, taxi/moto/uber, prefeitura, agua, energia.
- Implementar estado vazio claro quando nao houver item na categoria.

### 7. Card claro no catalogo mobile tem contraste ruim

Severidade: Medio
Categoria: Acessibilidade / Visual
URL: https://catalogo-cruzeiro-web.onrender.com/catalogo-servicos.html
Evidencia: C:\Users\junio\projeto codex\reports\czs-render-diagnostic\screenshots\catalogo-servicos-mobile-rerun.png

Resultado observado:
- O card "Guia local de Cruzeiro do Sul para servicos, telefones e empresas" aparece com fundo cinza claro e texto muito claro/branco.
- Legibilidade baixa no mobile.

Impacto:
- Dificulta leitura, especialmente em tela pequena e brilho alto.

Acao recomendada:
- Usar texto escuro no card claro ou manter fundo escuro com texto claro.
- Validar contraste WCAG AA.

### 8. Metricas publicas inconsistentes entre paginas/API

Severidade: Medio
Categoria: Conteudo / Confianca
URLs: home, arquivo, divulgue, API /api/news

Resultado observado:
- /api/news retornou total=1841 e archiveTotal=1841.
- A pagina arquivo exibiu "723 noticias ja postadas".
- A pagina divulgue exibiu "480 noticias no arquivo local".

Impacto:
- Numeros divergentes passam sensacao de sistema desatualizado ou inflado.

Acao recomendada:
- Centralizar contadores em uma fonte unica.
- Atualizar cards de prova social via API ou remover numeros fixos.

### 9. /api/health retorna 404 em producao

Severidade: Medio
Categoria: Operacao / Observabilidade
URL: https://catalogo-cruzeiro-web.onrender.com/api/health

Resultado observado:
- Endpoint retornou 404: {"ok":false,"message":"Rota não encontrada."}
- No codigo local existe app.get("/api/health"), indicando possivel deploy antigo, rota removida ou backend diferente.

Impacto:
- Dificulta monitoramento real do Render.
- Sinal de desalinhamento entre codigo esperado e producao.

Acao recomendada:
- Garantir /api/health em producao com status 200 e versao do build.
- Incluir commit/build timestamp no endpoint.

### 10. Rotas esperadas de votos/ranking retornam 404

Severidade: Medio
Categoria: API / Produto
URLs:
- /api/elections/ranking
- /api/votes/summary

Resultado observado:
- Ambas retornaram 404.
- No codigo local ha referencias/rotas para elections ranking e votes summary.

Impacto:
- Pode quebrar widgets eleitorais/PubPaid/votacao se frontend chamar essas rotas.

Acao recomendada:
- Verificar se essas rotas devem estar publicas em producao.
- Se nao forem usadas, remover chamadas/links mortos.
- Se forem usadas, publicar backend atualizado.

### 11. Google Identity script falhou/bloqueou em checagem automatizada

Severidade: Medio
Categoria: Auth / Console / Integracao
URL: home / auth Google

Resultado observado:
- Request para https://accounts.google.com/gsi/client apareceu como net::ERR_BLOCKED_BY_ORB na rodada Playwright.
- Teste direto retornou 403 para HEAD/GET com user-agent automatizado.
- /api/auth/config retorna enabled=true e clientId publico.

Impacto:
- Pode ser apenas efeito de ambiente automatizado, mas login Google precisa teste manual no Chrome real.

Acao recomendada:
- Testar login Google em Chrome normal com perfil real.
- Garantir origem autorizada no Google Cloud: https://catalogo-cruzeiro-web.onrender.com.
- Nao bloquear experiencia publica quando GSI falhar.

### 12. Imagem externa hotlinkada do AcreInfoCo foi bloqueada pelo navegador

Severidade: Medio
Categoria: Midia / Performance / Confianca visual
URL da imagem: https://acreinfoco.com/wp-content/uploads/2026/05/br-65.jpeg

Resultado observado:
- Na rodada Playwright, a imagem apareceu repetidamente como net::ERR_BLOCKED_BY_ORB.
- Teste direto do arquivo retornou 200 image/jpeg, ou seja, o problema e no contexto do navegador/hotlink/politica de recurso.

Impacto:
- Cards podem aparecer sem imagem ou com buracos visuais para usuarios reais dependendo do navegador/politicas.

Acao recomendada:
- Cachear/proxyar thumbnails no proprio dominio do CZS.
- Ter fallback visual local por categoria/fonte.
- Nao depender de hotlink externo para card principal.

### 13. Headers de seguranca ausentes

Severidade: Medio
Categoria: Seguranca / Infra
URL: https://catalogo-cruzeiro-web.onrender.com/

Headers ausentes no HEAD testado:
- strict-transport-security
- content-security-policy
- x-frame-options
- x-content-type-options
- referrer-policy
- permissions-policy

Impacto:
- Aumenta superficie de risco para clickjacking, MIME sniffing, vazamento de referer e injecoes.

Acao recomendada:
- Adicionar Helmet no Express ou headers no Render/Cloudflare.
- Comecar com CSP report-only se houver risco de quebrar scripts externos.

### 14. Carga visual/peso da home esta alta

Severidade: Medio
Categoria: Performance / UX
URL: https://catalogo-cruzeiro-web.onrender.com/

Resultado observado:
- Desktop: 112 recursos, aprox. 4.16 MB transferidos, 66 CSS, 50 imagens, load 6.185s.
- Mobile: 60 recursos, aprox. 3.40 MB, 39 CSS, 26 imagens.

Impacto:
- Em internet movel local, isso pode atrasar a leitura e aumentar rejeicao.

Acao recomendada:
- Reduzir CSS duplicado/fragmentado.
- Lazy-load abaixo da dobra com placeholders consistentes.
- Priorizar primeira dobra: logo, manchete, linha viva, servicos uteis.
- Converter thumbs para WebP/AVIF quando possivel.

### 15. Cheffe Call exibe aviso de password fora de form

Severidade: Baixo
Categoria: Console / Acessibilidade
URL: https://catalogo-cruzeiro-web.onrender.com/cheffe-call.html

Resultado observado:
- Console verbose: [DOM] Password field is not contained in a form.

Impacto:
- Baixo, mas afeta semantica, autofill e acessibilidade.

Acao recomendada:
- Envolver campo de senha em form com submit claro e label.

### 16. /api/social-trends retorna total=0 com conectores pendentes

Severidade: Baixo
Categoria: Conteudo / Integracao
URL: https://catalogo-cruzeiro-web.onrender.com/api/social-trends

Resultado observado:
- ok=true, total=0.
- Reports indicam facebook_graph_config_pending e sinais desativados.

Impacto:
- Se a home depender de tendencias sociais, o modulo pode ficar vazio/desatualizado.

Acao recomendada:
- Ocultar modulo quando total=0 ou mostrar fallback editorial.
- Completar configuracoes somente se essa feature for prioridade.

### 17. ads.txt ausente

Severidade: Baixo
Categoria: Monetizacao / SEO tecnico
URL: https://catalogo-cruzeiro-web.onrender.com/ads.txt

Resultado observado:
- Retorna 404.

Impacto:
- Sem problema se ainda nao houver monetizacao programatica.
- Se for usar ads/AdSense/partners, precisa existir.

Acao recomendada:
- Criar ads.txt quando a monetizacao for ativada.

## Avaliacao por area

### Produto/editorial

O CZS ja tem base forte de noticias e cara de portal regional, mas a primeira experiencia esta sendo desviada por popup, convite PubPaid, cookie e modulos promocionais. Para cumprir a regra mestre, a home precisa entregar em segundos:
- o fato principal do dia;
- impacto pratico;
- linha viva;
- servicos uteis;
- confianca/fonte.

Hoje isso existe no DOM, mas a experiencia visual esta poluida e em mobile pode ficar escondida por splash/modal.

### Catalogo de servicos

A pagina esta online e bonita em partes, mas ainda parece mais landing de servicos digitais do CZS do que catalogo local util. Para virar catalogo forte:
- colocar categorias locais reais acima da oferta propria;
- garantir busca por nome/categoria/telefone;
- popular farmacias, hospitais, emergencia, transporte, prefeitura, agua, energia;
- reduzir modais;
- corrigir contraste.

### SEO

Base boa:
- robots ok;
- sitemap ok;
- title/description/canonical/OG/Twitter ok;
- imagens com alt no HTML inicial.

Riscos SEO:
- noticia quebrada por slug;
- possivel sitemap com URLs que dependem de API fora de sincronia;
- headers tecnicos ausentes;
- numeros e conteudo divergentes.

### Infra/Render

O Render esta respondendo, mas precisa de observabilidade melhor:
- /api/health faltando;
- episodio 502 registrado;
- endpoints do codigo local ausentes em producao;
- dependencia de recursos externos/hotlink.

## Prioridade de correcao recomendada

P0 - corrigir agora:
1. Corrigir slug/noticia quebrada da home.
2. Tirar popup automatico da frente da home e do catalogo mobile.
3. Corrigir home mobile para mostrar manchete real acima da dobra sem splash preso.
4. Criar /api/health em producao e verificar logs Render do 502.

P1 - proxima rodada:
5. Corrigir catalogo de servicos: busca/categorias devem retornar contatos uteis reais.
6. Corrigir contraste do card claro no catalogo mobile.
7. Unificar contadores de noticias/arquivo/contatos.
8. Cachear/proxyar imagens externas ou fallback local.

P2 - acabamento tecnico:
9. Adicionar headers de seguranca.
10. Reduzir CSS/recursos e peso total da home.
11. Confirmar login Google manualmente.
12. Decidir se rotas /api/elections/ranking e /api/votes/summary devem existir.
13. Criar ads.txt quando monetizacao for ativada.

## Veredito Rayxpx

O Catalogo CZS no Render esta vivo, indexavel e com bastante conteudo, mas ainda nao esta pronto como experiencia publica redonda. O maior problema nao e falta de pagina; e friccao: popup, splash, slug quebrado, catalogo que ainda nao prioriza servico local real e sinais de deploy/API desalinhados.

Se corrigirmos os P0, o site passa de "online com riscos" para "portal regional usavel". Depois os P1 transformam o catalogo em produto local de verdade.
