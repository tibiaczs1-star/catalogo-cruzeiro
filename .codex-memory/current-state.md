# Current State

Updated: 2026-05-31T11:55:00-05:00

## Active Goal

- Rotina Catálogo CZS: notícias, stories, serviços e divulgação segura.

## Summary

Pacote de notícias de 30/05 e 31/05 foi refeito com fotos reais das fontes, sem cards vazios. O site recebeu imagens recuperadas em `news-data.js` e `data/runtime-news.json`, e o catálogo de serviços ganhou ofertas de IA, design, sites, vídeos, anúncios, gift cards, logística digital e PubPaid.

Instagram `@catalogo_czs_`:

- Feed concluído com 24 notícias revisadas e postadas em ordem para deixar Cruzeiro do Sul/Juruá no topo.
- Stories concluídos com 12 vídeos de notícias com áudio embutido.
- Stories de venda/convite concluídos com 11 vídeos verticais com áudio leve, sem postar produto no feed.

WhatsApp:

- Status enviado para o próprio número do usuário às 11:25 e 11:53 com o andamento.
- Automação heartbeat ativa a cada 15 minutos para checar WhatsApp e captar ordens novas.
- Grupos já usados nesta rodada: `VENDE-SE TUDO EM CZS`, `VENDAS E ALUGUEL! CZS` e `GRUPO DE DESAPEGO`.

## Next

- Renovar Facebook/Marketplace quando o navegador estiver estável.
- Continuar divulgação em destinos validados, evitando chats individuais.
- Seguir/curtir apenas perfis de nicho jornal/notícias/fofoca do Acre, Vale do Juruá e Cruzeiro do Sul; não executar rotina de seguir pessoas normais em massa.
- Em nova rodada de notícias, usar apenas cards com foto real ou imagem premium revisada.

## Files In Focus

- news-data.js
- data/runtime-news.json
- catalogo-servicos-data.js
- index.html
- .codex-temp/instagram/premium-news-pack/current-20260530-20260531/premium-real-photo/
- .codex-temp/whatsapp-catalogo-20260531/

## Landing Divulgue + SEO Render - 2026-05-31

- Ordem atual: criar landing comercial para propagacao da proposta do Catalogo CZS/Jornal no Render, ajustar SEO do jornal e melhorar indexacao do catalogo em buscadores.
- Implementacao em andamento: `divulgue.html`, `divulgue.css`, links internos em `index.html` e `catalogo-servicos.html`, SEO/schema/sitemap em `server.js`, reforco de texto em `catalogo-servicos-data.js`.
- Regra publica: manter `https://catalogo-cruzeiro-web.onrender.com/` como canonical/base publica do jornal.
- Publicado em `main` e verificado online no Render: `/divulgue.html`, `/`, `/catalogo-servicos.html`, `/robots.txt` e `/sitemap.xml`.
- Proximo passo: acompanhar indexacao no Google Search Console, enviar sitemap e evoluir paginas/perfis por nicho do catalogo.

## Redesign Divulgue apos critica - 2026-05-31

- Usuario rejeitou a versao visual da landing como horrivel e pediu estudo antes de refazer.
- Estudo criado em `docs/commercial/czs-divulgue-redesign-study-2026-05-31.md`.
- Redesign local aplicado em `divulgue.html` e `divulgue.css`: proposta mais regional, H1 `Apareca no Catalogo CZS`, provas comerciais, passos de divulgacao, formatos e SEO local explicado.
- `server.js` ajustado localmente para `CommercialServicePage` com `mainEntity` de Service/OfferCatalog.
- Pendencia: shell/processos externos bloquearam validacao e git com EPERM/740; conector GitHub bloqueou escrita com 403. Ainda falta validar com comandos, commitar/pushar e conferir Render online.

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

- Nova ordem do usuario: corrigir padrao de stories e feed, trocar trilha de terror por musica jornalistica, captar video das fontes primeiro, usar contexto/narracao, intercalar propaganda, criar carrosseis/destaques/editorias, limpar seguindo para manter apenas nichos e promover agentes para times de aprendizado/crescimento.
- Documentos criados em `docs/social/`: `czs-executive-order-2026-05-31.md`, `czs-instagram-news-standard-2026-05-31.md`, `czs-growth-following-cleanup-2026-05-31.md`, `czs-editorial-growth-formats-2026-05-31.md`.
- Regra nova: stories jornalisticos devem usar video real da fonte primeiro, contexto claro, narracao curta quando util, imagem depois e propaganda a cada 3 a 5 stories.
- Regra de musica: sem terror/suspense exagerado; policia/acidente/luto com silencio ou base neutra baixa; politica institucional; servico leve; propaganda comercial limpa.
- Regra de crescimento: parar de seguir perfis pessoais comuns; manter somente nichos de jornal, noticias, fofoca, radios, politica regional, Acre, Jurua e Cruzeiro; sem automacao de massa.

## Correcao Arte Premium Social - 2026-05-31

- Usuario reprovou artes atuais como nao premium, com exemplo de logo/assinatura do Catálogo CZS cortado e composicao fraca.
- Criado `docs/social/czs-premium-visual-system-2026-05-31.md` com safe area, assinatura CZS, referencias de composicao jornalistica e prompt de regeneracao.
- Atualizado `docs/social/czs-instagram-news-standard-2026-05-31.md` para reprovar automaticamente logo cortado, marca pequena e texto gerado por IA.
- Criado bloqueio em `.codex-temp/catalogo-czs-premium-sales-20260531/VISUAL_REGENERATION_ORDER.md`: nao repostar lote atual antes de regenerar cada arte/produto/servico como asset unico.
- Regra nova: GPT Image deve gerar fundo/foto sem texto; texto real, logo, preco, CTA e fonte entram por template para evitar letras erradas.
