# Current State

Updated: 2026-06-08T22:25:00.000Z

## Active Goal

- Publicar atualização CZS 2026-06-08 com notícias hidratadas e Norte Ultra Fibra como patrocinador/colaborador

## Summary

- Captação total do site disparada: 371 itens captados, 227 de hoje, 420 ativos e 620 no arquivo local.
- Cache/versionamento atual: `20260608-norte-news-v65` em `index.html` e `assets/v8-final/v8-merge-ready.js`.
- Norte Ultra Fibra distribuído no site como patrocinador: apoio local, bloco comercial, campanhas 500/600/800 Mega, anúncios internos e CTA `Contratar internet`.
- WhatsApp oficial usado nos CTAs: `https://wa.me/5568992096037`.
- Arte local temporária do patrocinador: `assets/sponsors-norte-ultra-fibra.svg`; pode ser trocada depois pelas artes finais do WhatsApp.
- Galeria premium ajustada para imagens locais de `assets/home-cache/` com carregamento `eager`, evitando cards cinza por redirects externos ou lazy-load.
- Validação local feita em `http://localhost:3001/?skipIntro=1&fresh=20260608-norte-news-v65`: HTML 200 com `total=620`, links do WhatsApp renderizados e capturas em `.codex-temp/norte-v63/`.
- `npm run review:team` rodou e passou o guard PubPaid; relatório geral ainda aponta achados antigos fora do escopo em `tools/creative-suite`, venvs e exemplos vendorizados.

## Prior Social State

- WhatsApp Business Web foi executado no Chrome atual. Foram enviados 95 itens sem erro no log:
  - `VENDAS E ALUGUEL! CZS`: 24 itens, pois `01-perfume-assadi` ja tinha sido enviado no teste manual.
  - `03 POSTAR QUE VENDE LOGO CZS`: 25 itens.
  - `GRUPO DE DESAPEGO`: 25 itens.
  - `Catálogo CZS`: 20 noticias de 2026-06-08 + 1 chamada de servicos/canais.
- Grupos de venda receberam produtos Inova, servicos e convite; noticias ficaram somente no `Catálogo CZS`.
- `GRUPO VIP DONA D` e grupos de Uber/transporte nao foram usados.
- Facebook nao foi publicado porque o Facebook aberto no Chrome `Default / juniorclovissampaio@gmail.com` mostrou somente o perfil `Antonio e Rnascimento Jr.` em `Ver todos os perfis`; como a ordem do usuario e usar sempre `Clovis Sampaio`, a publicacao foi bloqueada para evitar perfil errado.
- Fila pronta do Facebook: `.codex-temp/social-routine-20260608-1315/facebook-ready-blocked-queue.json`.
- Log/provas: `.codex-temp/social-routine-20260608-1315/whatsapp-routine-log.json`, prints `done-*.png` e `facebook-all-profiles.png`.
- Correcao de protocolo registrada: `Catálogo CZS` no WhatsApp nao deve receber texto cru quando a pauta exige midia; noticias, servicos e convites precisam sair como imagem/video/arte premium + legenda.
- Convites premium separados gerados em `.codex-temp/social-premium-invites-20260608/`: Instagram, WhatsApp e Site. Regra: no maximo 1 convite por dia por destino de venda.
- Campanha Norte Ultra Fibra preparada em `.codex-temp/norte-ultra-fibra-campanha-20260608/` com separacao feed/story, legendas, hashtags, plano semanal, prospeccao de clientes e regra de Reels diarios.
- Atendimento oficial Norte Ultra Fibra registrado para a campanha: `https://wa.me/5568992096037`.
- Reels entrou no protocolo como frente de captacao: noticias em video, festas, servicos, ofertas, bastidores, piadas locais leves e produtos, sempre com CTA para site/Instagram/WhatsApp quando cabivel.

## Next

- Fazer commit/push/deploy da atualização v63 e checar online em Render.
- A noite, antes de postar Facebook, abrir/trocar para o Facebook correto do `Clovis Sampaio`.
- Quando Clovis estiver visivel, usar `.codex-temp/social-routine-20260608-1315/facebook-ready-blocked-queue.json` para publicar/comparilhar os 6 criativos de captacao.
- Para Norte Ultra Fibra, publicar/comparilhar usando `.codex-temp/norte-ultra-fibra-campanha-20260608/PLANO-SEMANA.md` e legendas do pacote. Feed recebe criativos abrangentes; stories recebem planos especificos; grupos de venda podem receber todos um por vez.
- Para procurar clientes, usar `.codex-temp/norte-ultra-fibra-campanha-20260608/PROSPECCAO-CLIENTES.md`; nao sair mandando individual sem ordem explicita.

## Social Update 2026-06-08 17h

- Apos reclamacao sobre faltar celular/TV/gift cards, foi criada e disparada a fila direta `.codex-temp/sales-direct-missing-20260608/`.
- WhatsApp grupos de venda recebeu 8 itens por grupo, sem erro no log: TV, Redmi Note 13, gift/streaming/IA, suporte celular/computador, sites/chats/automacao e 3 convites premium separados.
- Destinos usados: `VENDAS E ALUGUEL! CZS`, `03 POSTAR QUE VENDE LOGO CZS` e `GRUPO DE DESAPEGO`; log em `.codex-temp/sales-direct-missing-20260608/whatsapp-sales-direct-log.json`.
- BlueStacks/Instagram: publicado 1 Reel comercial no perfil `catalogo_czs_` a partir da arte do Redmi, com legenda comercial curta, site, WhatsApp, Instagram, promo e hashtags. Prova: `.codex-temp/sales-direct-missing-20260608/reel-sales-after-share.png`.
- Foram gerados videos verticais prontos para Reels em `.codex-temp/sales-direct-missing-20260608/reels/`; a versao compativel que funcionou foi `VID_20260608_1715_REEL_CZS_REDMI.mp4`.
- Facebook continuou bloqueado por regra: o compartilhamento disponivel no Instagram/Facebook era `Antonio e Rnascimento Jr.`, nao `Clovis Sampaio`.
