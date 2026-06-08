# Handoff

Updated: 2026-06-08T22:25:00.000Z

Site CZS v63 - notícias + patrocinador Norte Ultra Fibra:

- Captação disparada em 2026-06-08: `capturedItems=371`, `capturedToday=227`, `activeWindowItems=420`, `archiveItems=620`.
- Arquivos sincronizados: `index.html`, `news-data.js`, `data/runtime-news.json`, `data/news-archive.json`, `data/latest-news-capture-report.json`.
- Cache-buster/versão: `20260608-norte-news-v63`.
- Patrocinador distribuído no V8:
  - arte temporária: `assets/sponsors-norte-ultra-fibra.svg`;
  - WhatsApp oficial: `https://wa.me/5568992096037`;
  - CTA principal: `Contratar internet`;
  - pontos: apoio local, bloco comercial, campanhas 500/600/800 Mega, anúncios internos e formato comercial.
- Validações locais já feitas:
  - `node --check assets/v8-final/v8-merge-ready.js`;
  - `git diff --check` nos arquivos da rodada;
  - `npm run review:team` com guard PubPaid OK;
  - `Invoke-WebRequest http://localhost:3001/?skipIntro=1&fresh=20260608-norte-news-v63` retornou 200 e `total=620`;
  - capturas CDP em `.codex-temp/norte-v63/`.
- Próximo passo imediato: commitar somente os arquivos da rodada, fazer push para `main`, disparar Render e checar online com `?skipIntro=1&fresh=20260608-norte-news-v63`.

Rotina social 2026-06-08 tarde:

- WhatsApp concluido via WhatsApp Business Web no Chrome atual.
- Log principal: `.codex-temp/social-routine-20260608-1315/whatsapp-routine-log.json`.
- Total enviado sem erro no log: 95 itens.
- Rotas:
  - `VENDAS E ALUGUEL! CZS`: 24 itens, com `01-perfume-assadi` enviado no teste manual antes do lote.
  - `03 POSTAR QUE VENDE LOGO CZS`: 25 itens.
  - `GRUPO DE DESAPEGO`: 25 itens.
  - `Catálogo CZS`: 20 noticias de 2026-06-08 + 1 chamada de servicos/canais.
- Produtos Inova e servicos foram enviados como arte + legenda separada, porque o preview do WhatsApp nao mantinha legenda com seguranca.
- Noticias nao foram enviadas a grupos de venda; grupos de Uber/transporte e `GRUPO VIP DONA D` foram ignorados.
- Facebook foi bloqueado de proposito: o Facebook aberto mostrava `Antonio e Rnascimento Jr.` e `Ver todos os perfis` nao exibia `Clovis Sampaio`.
- Fila Facebook pronta para retomada: `.codex-temp/social-routine-20260608-1315/facebook-ready-blocked-queue.json`.

Correcao/novo pacote apos reclamacao do usuario:

- Protocolo atualizado: `Catálogo CZS` WhatsApp e vitrine premium; nao receber texto cru quando a pauta pede midia.
- Convites premium separados gerados:
  - `.codex-temp/social-premium-invites-20260608/artes/convite-instagram-premium.jpg`
  - `.codex-temp/social-premium-invites-20260608/artes/convite-whatsapp-premium.jpg`
  - `.codex-temp/social-premium-invites-20260608/artes/convite-site-premium.jpg`
- Regra de convites: Instagram, WhatsApp e site separados; usar no maximo 1 convite por dia por destino de venda.
- Campanha Norte Ultra Fibra preparada:
  - `.codex-temp/norte-ultra-fibra-campanha-20260608/PLANO-SEMANA.md`
  - `.codex-temp/norte-ultra-fibra-campanha-20260608/PROSPECCAO-CLIENTES.md`
  - `.codex-temp/norte-ultra-fibra-campanha-20260608/manifest.json`
  - legendas em `.codex-temp/norte-ultra-fibra-campanha-20260608/legendas/`
- Atendimento oficial Norte Ultra Fibra na campanha: `https://wa.me/5568992096037`.
- Reels agora e linha propria: todo dia transformar noticia, servico, festa, oferta, piada local leve, bastidor ou produto em video curto com CTA para site/Instagram/WhatsApp.

## Next

- Para terminar o Facebook a noite, primeiro abrir/trocar para o perfil correto `Clovis Sampaio`.
- Depois publicar no perfil e compartilhar em grupos usando a fila `facebook-ready-blocked-queue.json`.
- Nao postar Facebook pelo perfil `Antonio e Rnascimento Jr.`.
- Para postar Norte Ultra Fibra, usar feed para criativos abrangentes e stories para ofertas especificas. Em Facebook, so depois de confirmar perfil `Clovis Sampaio`.
