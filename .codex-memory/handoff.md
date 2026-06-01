# Handoff

Updated: 2026-05-31T11:55:00-05:00

Retomar pela rotina Catálogo CZS. O lote principal do Instagram já foi concluído:

- Feed: 24 posts com fotos reais, log em `.codex-temp/instagram/premium-news-pack/current-20260530-20260531/premium-real-photo/posting-log-feed.txt`.
- Stories de notícias: 12 vídeos com áudio, log em `.codex-temp/instagram/premium-news-pack/current-20260530-20260531/premium-real-photo/posting-log-stories.txt`.
- Stories de serviços/convites: 11 vídeos com áudio, log em `.codex-temp/whatsapp-catalogo-20260531/instagram-story-servicos/posting-log-stories.txt`.
- WhatsApp próprio recebeu atualizações às 11:25 e 11:53.
- Automação `checar-whatsapp-do-usu-rio` está ativa em intervalo de 15 minutos.

## Next

- Verificar se há ordem nova no WhatsApp antes de seguir.
- Se continuar a divulgação, priorizar Facebook/Marketplace e grupos já validados.
- Não postar em chats individuais; exceção apenas para o próprio número/status do usuário.
- Manter filtro editorial: hiperlocal, factual, centro/direita ou neutro; policial pode entrar; evitar sensacionalismo de esquerda.
- Não executar follow/unfollow em massa. Se mexer em rede, manter só nichos de jornal, notícias, fofocas, Acre/Juruá/Cruzeiro.

## Files In Focus

- .codex-temp/instagram/premium-news-pack/current-20260530-20260531/premium-real-photo/
- .codex-temp/whatsapp-catalogo-20260531/
- catalogo-servicos-data.js
- index.html
- data/runtime-news.json
- news-data.js

## Regra De Comunicação WhatsApp

- Sempre que Codex mandar mensagem para o WhatsApp próprio do usuário, deixar o próprio chat aberto e ficar monitorando a resposta antes de navegar para outro destino.
- Usar o botão de ligar/chamada do WhatsApp para chamar atenção quando a mensagem exigir resposta, somente no próprio chat do usuário, nunca em grupos ou terceiros.
- O próprio chat vira sala de espera ativa depois de prompts, perguntas, aprovações ou status importantes.

## Regra De Link Publico

- Jornal/site publico do Catalogo CZS: `https://catalogo-cruzeiro-web.onrender.com/`.
- Nunca usar `127.0.0.1`, `localhost` ou URL local em legenda, comentario, WhatsApp, Facebook ou Instagram.
- Nao usar `catalogo-servicos.html` como link principal do jornal; essa pagina so entra em peca de servico/diretorio.

## Landing Divulgue + SEO Render - 2026-05-31

- Foco atual: landing comercial `divulgue.html` para divulgar jornal, catalogo, SEO local, redes, sites, videos e PubPaid.
- Arquivos em foco: `divulgue.html`, `divulgue.css`, `index.html`, `catalogo-servicos.html`, `catalogo-servicos.css`, `catalogo-servicos-data.js`, `server.js`.
- SEO publicado: home do jornal usa title/description/canonical/OG/JSON-LD via template vars, `SITE_URL` padrao aponta para `https://catalogo-cruzeiro-web.onrender.com`, landing entrou no `STATIC_PAGE_SEO` e sitemap.
- Verificacao online no Render OK para `/divulgue.html`, `/`, `/catalogo-servicos.html`, `/robots.txt` e `/sitemap.xml`.
- Proximos passos: Google Search Console, envio de sitemap, inspeção de URLs e paginas/perfis por nicho do catalogo.

## Redesign Divulgue apos critica - 2026-05-31

- A versao publicada anterior foi rejeitada pelo usuario como muito feia.
- Estudo salvo em `docs/commercial/czs-divulgue-redesign-study-2026-05-31.md`.
- Nova versao local substitui hero generico por proposta regional clara, provas comerciais, 3 passos, formatos e SEO local para leigo.
- Arquivos alterados localmente: `divulgue.html`, `divulgue.css`, `server.js`, `.codex-memory/orders.json`, `.codex-memory/current-state.md`, `.codex-memory/handoff.md`.
- Bloqueio atual: comandos externos/git falharam com EPERM/740 e escrita via GitHub API falhou com 403. Antes de encerrar de vez, quando ambiente permitir, rodar `node --check server.js`, `npm run review:team`, captura desktop/mobile, commit/push para `main` e conferir Render.

## Relatorio Comercial CZS Jornal - 2026-05-31

- Criados relatorios para compradores de cotas do Catálogo CZS Jornal em docs/commercial/czs-jornal-investor-report-2026-05-31.md e .html.
- Apuracao confirmou site publico no Render, arquivo local de 480 noticias, logs de 24 posts de feed, 12 stories de noticias e 11 stories comerciais em 31/05.
- Ressalva importante: analytics locais comprovam o motor de medicao, mas os acessos apurados sao majoritariamente locais/teste; para pitch final, anexar Instagram Insights, Render logs publicos e UTMs.

## Revisao Pitch Comercial CZS Jornal - 2026-05-31

- Relatorio comercial refeito como pitch para cotas: HTML e Markdown agora destacam 9.000 views informadas em aproximadamente 3 dias, 552 seguidores, 1.137 seguindo e 181 posts verificados online no Instagram.
- Incluidos graficos de pizza, projecoes conservadora/realista/agressiva e inventario comercial de 12 modulos e 49 itens/listagens.
- Metrica tecnica/local fraca foi removida da vitrine; para fechamento com comprador, anexar print do Instagram Insights.

## Propaganda Premium Jogos + Enquete - 2026-05-31

- Ordem atual incorporada: divulgar jogos/PubPaid e enquete eleitoral em todos os canais, usando somente link publico do Render.
- Pacote premium fechado em `.codex-temp/catalogo-czs-premium-sales-20260531/`: 11 itens, captions, manifesto, preview, `CHANNEL_POSTING_PACK.md`, artes WhatsApp e videos story/status 9:16 com audio embutido.
- Home local atualizada em `index.html` com cards para `./pubpaid.html` e `./pesquisa-acre-2026.html`.
- Instagram/BlueStacks: PubPaid e Enquete Acre 2026 postados como stories com audio; evidencias em `.codex-temp/instagram-after-concluir-pubpaid.png` e `.codex-temp/instagram-poll-final-screen.png`.
- WhatsApp: PubPaid enviado no grupo validado `03 POSTAR QUE VENDE LOGO CZS`; Enquete enviada no canal/grupo `Catalogo CZS`; grupo `FLORESTÃO AC NOTICIAS PREMIUM` estava admin-only e foi pulado. Log: `.codex-temp/catalogo-czs-premium-sales-20260531/whatsapp-execution-log.json`.
- Facebook/Marketplace: pacote e captions prontos, mas nao houve postagem confirmada nesta rodada; usar `CHANNEL_POSTING_PACK.md` e evitar destino nao verificado.

## Ordem Executiva Social CZS - 2026-05-31

- Nova regra de producao social registrada em `docs/social/`: video de fonte primeiro, contexto claro, narracao curta, trilha jornalistica sem terror, imagem depois, propaganda intercalada e crescimento por nicho.
- Limpeza de seguindo: remover perfis pessoais comuns apenas com conferencia visual em blocos pequenos; manter jornais, radios, noticias, fofocas, politica regional, Acre, Jurua e Cruzeiro.
- Novos formatos: destaques do mes, servicos da semana, giro do dia, carrosseis explicativos e destaques fixos (`Hoje`, `Cruzeiro`, `Jurua`, `Acre`, `Policia`, `Politica`, `Servicos`, `Vendas`, `PubPaid`, `Enquete`, `Anuncie`, `Mes`).

## Correcao Arte Premium Social - 2026-05-31

- Reprovado o padrao visual atual quando houver logo do Catálogo CZS cortado, marca minuscula, composicao de flyer simples, letra estranha ou card sem foto/video.
- Novo sistema visual em `docs/social/czs-premium-visual-system-2026-05-31.md`.
- Ordem de bloqueio/regeneracao em `.codex-temp/catalogo-czs-premium-sales-20260531/VISUAL_REGENERATION_ORDER.md`.
- Proxima rodada de vendas/servicos deve regenerar cada asset antes de postar nos grupos WhatsApp; a fila de destinos continua util, mas as imagens precisam ser substituidas.
- Lote V2 gerado e revisado visualmente: manifest em `.codex-temp/catalogo-czs-premium-sales-20260531/premium-v2-approved-assets.json`; fila em `.codex-temp/catalogo-czs-premium-sales-20260531/WHATSAPP_PREMIUM_V2_QUEUE.md`.
- Nao usar o asset reprovado `04-compras-entregas-url-wrong`, pois o dominio saiu errado dentro da imagem.

## Landing Divulgue Comercial Forte - 2026-05-31

- Retomar por `divulgue.html`, `divulgue.css` e `server.js` se a publicacao cair no meio.
- Nova versao local usa cache-bust `20260531-sales3` e hero comercial com imagem `assets/insiders-empty-street-v1.png`, prova na primeira dobra e pacotes comerciais.
- Screenshots locais principais: `.codex-temp/divulgue-sales3-desktop-1366-v2.png`, `.codex-temp/divulgue-sales3-mobile-v2.png` e `.codex-temp/divulgue-sales3-mobile-full.png`.
- Antes de encerrar: publicar em `main`, conferir `https://catalogo-cruzeiro-web.onrender.com/divulgue.html` e garantir que a pagina online contenha `Anuncie no Catálogo CZS` e `20260531-sales3`.

## Landing Divulgue Cinematica + Relatorio - 2026-05-31

- Pedido atual: juntar a landing com o projeto do chat `019e7f3c-c74e-7c43-96c8-b0e2138650c9` e transformar em landing/relatorio/forca de vendas premium.
- Versao local agora usa `20260531-cinema4` e inclui console animado, radar, terminal, metricas de 3 dias, 108 rotas API, 200 agentes, graficos, nodes e cotas.
- Validar/publicar a partir de `divulgue.html`, `divulgue.css`, `server.js` e materiais `docs/commercial/czs-jornal-investor-report-2026-05-31.*`.
- Prints locais: `.codex-temp/divulgue-cinema4-desktop.png`, `.codex-temp/divulgue-cinema4-mobile.png`, `.codex-temp/divulgue-cinema4-mobile-full.png`.
- Ao publicar, verificar online que `/divulgue.html` contem `20260531-cinema4`, `200 agentes`, `108` e `O anúncio entra. O sistema espalha.`
## Apresentacao Premium CZS Jornal - 2026-05-31

- HTML transformado em apresentacao premium cinematica para comprador: capa forte, prova pos-lancamento, mercado IBGE, sala de maquinas tecnologica, 108 rotas API, graficos de pizza e fechamento de cota.
- PDF final regerado em `docs/commercial/czs-jornal-investor-report-2026-05-31.pdf`; preview da capa em `docs/commercial/czs-jornal-investor-report-2026-05-31-preview.png`.

## Retomada Divulgacao Premium - 2026-05-31

- Usuario avisou que o sistema de divulgacao falhou e o chat fechou apos a criacao premium de imagens.
- Estado recuperado: os assets premium estao preservados; logs indicam Instagram feed/stories completo, stories de servicos completo e WhatsApp parcialmente concluido.
- Falha concreta registrada: `GRUPO VIP DONA` nao tinha caixa de mensagem acessivel no momento do envio; o fluxo abortou com erro de seletor e nao deve ser forçado.
- Fila a retomar: `.codex-temp/catalogo-czs-premium-sales-20260531/WHATSAPP_PREMIUM_V2_QUEUE.md`; conferir tambem `.codex-temp/catalogo-czs-premium-sales-20260531/whatsapp-missing-ads-queue.json` e `whatsapp-execution-log.json`.
- Heartbeat ativo criado para esta retomada: `retomar-divulgacao-czs-segura`.
- Regra de retomada: somente grupos validados, sem chats individuais, sem noticias/enquete em grupo de venda, sem envio se o navegador/WhatsApp nao estiver controlavel com seguranca.
