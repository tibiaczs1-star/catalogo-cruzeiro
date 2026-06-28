# Handoff

Updated: 2026-06-27T19:10:00-05:00

Rodada Mailza Reels concluida em 2026-06-28:

- Pedido: reforcar Mailza no Instagram com muitos Reels reais, baixados/refeitos, logo CZS e formato padrao.
- Captacao nova feita: 371 itens, 147 de hoje, 360 ativos, 480 no arquivo; PCAC abortou, pacote geral valido.
- Itens Mailza no runtime: 17; quase todos sem `videoUrl`, portanto nao transformar foto/texto em Reel falso.
- Pacote/provas: `.codex-temp/mailza-round-20260628/`.
- Videos reais baixados do Facebook publico em `original/`; Instagram publico bloqueou yt-dlp com `empty media response`.
- Renderizados 9 MP4 CZS validos em `videos/com-logo-czs/`; captions incluem fonte/link, site, Instagram, WhatsApp e Norte Ultra Fibra.
- Instagram `@catalogo_czs_` via BlueStacks/ADB `127.0.0.1:5555`: `publish-results.json` registra 9 envios `submitted=true`.
- Contador/prova: perfil antes `846 posts`; perfil final limpo `861 posts` em `proof/profile-final-mailza-clean.png/xml`.
- Relatorio final: `.codex-temp/mailza-round-20260628/RELATORIO-MAILZA-REELS-20260628.md`.
- Nao repetir os IDs desta rodada: `mailza-arraial-cultural-2026`, `mailza-feijo-cirurgias`, `mailza-br364-investimentos`, `mailza-chega-cruzeiro-do-sul`, `mailza-empresa-construcao-jurua`, `mailza-turismo-acre`, `mailza-novo-mercado-velho`, `fala-governadora-investimentos`, `mailza-oportunidade-servidores`.
- Site/Render finalizado: commit `b7731f73` (`chore: update CZS Mailza capture and reels proof`) enviado para `main`; Render deploy `dep-d90dbhgjs32c73ch2nh0` ficou `live`.
- Validacao publica: `news-data.js?fresh=b7731f73` retornou 200 com `Mailza`, `Terceirizados` e `Skatepark`; API `/api/news/archive?limit=20&fresh=b7731f73` retornou pauta `CNPJs ligados a Assem Cameli... Mailza`.

Tour noturna CZS concluida em 2026-06-27:

- Executada com foco em Juruá/região, vídeos polêmicos e memes leves para seguidores.
- Agentes auxiliares usados: insights locais, captação web e rotina. Resultado consolidado: Reels reais/polêmicos/curiosos funcionam melhor que card; Juruá/Cruzeiro do Sul sustenta identidade; manhã/noite são boas janelas operacionais; medir sempre com contador/print/XML.
- Rotina atualizada em `docs/CZS_REAL_VIDEO_REELS_AGENT_PROMPT.md` e `docs/social/czs-reels-video-polemico-training-2026-06-26.md`.
- Regra nova: se vídeo público vier com marca de terceiro e não houver origem limpa rápida, cobrir/dominá-la com logo/tarja CZS forte, mantendo `Fonte:` visível.
- Site/Render atualizado: captação 370 itens, 210 de hoje, 360 ativos, 480 no arquivo; commit `4586d224`; deploy `dep-d9065e67r5hc73b6qf5g` live.
- Validação pública: `news-data.js?fresh=4586d224` retornou 200 e confirmou pautas noturnas de 27/06 local.
- Instagram `@catalogo_czs_` via BlueStacks/ADB: `844 -> 846` posts, +2 Reels confirmados.
- Reels publicados: `Tanque de guerra improvisado chama atenção nas ruas de Cruzeiro do Sul` e `Criadora acreana relata sintomas e diagnóstico de endometriose`.
- Pasta/provas: `.codex-temp/tour-noturna-20260627/`; principais provas em `proof/profile-before.xml`, `proof/profile-after.xml`, `proof/profile-final-refresh.xml`, `proof/profile-final-refresh.png`, `proof/publish-results.json`.
- Bloqueios: carro/moto e freiras ficaram sem MP4 acessível por bloqueio de rede social; jovem armado/Sobral e agressão com terçado foram segurados por risco gráfico/sensibilidade/áudio.
- Não declarar WhatsApp/Facebook como executados nesta tour; não foram feitos.

Rodada matinal CZS concluida em 2026-06-27:

- Site/Render atualizado com captacao nova: 373 itens, 147 de hoje, 360 ativos, 480 no arquivo.
- PCAC abortou por timeout; pacote final valido.
- Commit publicado: `3bcf8a47` (`chore: update CZS news capture 2026-06-27`), pushado para `main`.
- Render `catalogo-cruzeiro-web` deploy `dep-d8vsrap9rddc73a2cdf0` ficou `live`.
- Validacao publica: `news-data.js?fresh=3bcf8a47` retornou 200 com `Bastidores da sucessao`, `Temperaturas amenas`, `Ajude Isadora` e `Tanque de guerra`; API `/api/news/archive?limit=10&fresh=3bcf8a47` retornou 200.
- Instagram `@catalogo_czs_` via BlueStacks/ADB `127.0.0.1:5555`: contador final 838 posts, vindo de 827 antes da rodada, portanto +11 posts confirmados na grade.
- Foram enviados 12 videos com `submitted=true` somando pacote principal e extra, mas apenas +11 entraram no contador apos refresh; nao declarar 12 como confirmados.
- Pacote principal: `.codex-temp/daily-protocol-20260627/`; resultados em `publish-proof/publish-results-fast.json`; prova de contador intermediario `profile-final-refresh-2min.png` com 835 posts.
- Pacote extra: `.codex-temp/daily-protocol-20260627-extra/`; resultados em `publish-proof/publish-results-fast.json`; prova final `profile-final-refresh.png` e XML com 838 posts.
- Indices do manifesto principal enviados: `1,2,4,5,6,7,9,10,11`.
- Indices do manifesto extra enviados: `1,3,4`.
- Erros de renderizacao conhecidos por `maximum recursion depth exceeded`: Tanque de guerra, Braz Aguiar, endometriose/Katrielly, primeiro emprego Assis Brasil/Porto Walter e outros candidatos do extra inicial. Se retomar, filtrar ou corrigir o gerador antes de insistir.
- Facebook/WhatsApp nao foram executados nesta rodada; nao declarar como feitos sem nova prova.

Rodada noturna CZS concluida em 2026-06-26:

- Site/Render atualizado com captacao nova: 376 itens, 239 de hoje, 360 ativos, 480 no arquivo.
- Arquivos alterados de noticia: `data/runtime-news.json`, `data/news-archive.json`, `news-data.js`, `data/latest-news-capture-report.json`.
- Commit publicado: `c8458cb1` (`chore: update CZS evening capture and reels filter`), pushado para `main`.
- Render `catalogo-cruzeiro-web` deploy `dep-d8vhev67r5hc73as52m0` ficou `live`.
- Validacao publica: `news-data.js?fresh=c8458cb1` retornou 200 e contem `Cafe ganha destaque`, `Ajude Isadora`, `Tanque de guerra` e `Em Cruzeiro do Sul`; `/api/news/archive?limit=10&fresh=c8458cb1` retornou 200 com 10 itens.
- Observacao tecnica: PCAC abortou por timeout nessa captacao, sem derrubar o pacote final.
- Instagram `@catalogo_czs_` publicado via BlueStacks/ADB `127.0.0.1:5555`; contador confirmado 821 -> 827 posts.
- Reels publicados: `05-carro-incendio-escola-militar-acre-czs.mp4`, `08-roubo-loja-celulares-rio-branco-czs.mp4`, `03-flagra-traição-pode-arrancar-camisa-czs.mp4`, `04-briga-casa-shows-feridos-destruicao-czs.mp4`, `02-audio-loja-toda-quebrada-bosque-czs.mp4`, `01-empresaria-agride-marido-loja-bosque-czs.mp4`.
- Pasta fonte dos MP4s: `C:\Users\junio\Desktop\videos-polemicos-acre-2026-06-26\com-logo-czs`.
- Provas: `.codex-temp/polemical-videos-instagram-20260626/proof/publish-results.json`, `profile-final-refresh.xml`, `profile-final-refresh.png`.
- Nao declarar Facebook/WhatsApp como feitos nesta rodada; o pedido desta retomada foi finalizado em site Render e Instagram.

Site CZS atualizado e publicado em 2026-06-26:

- Captacao nova feita antes de subir: 383 itens, 197 de hoje, 360 ativos, 480 no arquivo.
- Commit publicado: `6d95779b` (`chore: update CZS news capture 2026-06-26`), enviado para `main`.
- Render `catalogo-cruzeiro-web` deploy `dep-d8v7ggd7vvec73erk4b0` ficou `live`.
- Validacao publica: `https://catalogo-cruzeiro-web.onrender.com/news-data.js?fresh=20260626-live` contem pautas de 26/06, incluindo Ana Flavia/acidente em Cruzeiro do Sul, MPF/abastecimento, Mailza, Expoacre Jurua e adolescente morto apos parada obrigatoria.
- API publica tambem retornou itens de 26/06 em `/api/news/archive?limit=30&fresh=20260626-live`.
- Nao houve Instagram/Facebook/WhatsApp nesta rodada. Se o usuario pedir Reels, usar a captacao de 26/06 e filtrar os 3 itens com `videoUrl` real + cards narrados apenas quando nao houver video.

WhatsApp Catálogo CZS finalizado em 2026-06-25:

- Chrome foi reaberto pelo usuário e a sessão do WhatsApp Business carregou pelo plugin.
- Destino validado antes do envio: `Digite uma mensagem para o grupo Catálogo CZS`.
- Enviadas notícias com card + legenda completa do pacote `.codex-temp/daily-protocol-20260624-morning/`: índices `1, 2, 3, 4, 5, 6, 9, 11, 12`.
- Cards finais usados para a retomada: `.codex-temp/daily-protocol-20260624-morning/whatsapp-catalogo-jpg/`.
- Provas: `.codex-temp/daily-protocol-20260624-morning/whatsapp-catalogo-proof/`; captura final `catalogo-final-after-completion.png`.
- A busca mostrava a notícia 4 repetida de tentativas anteriores. Não enviar novamente esse lote sem revisar o histórico visual do grupo.

Rodada matinal CZS site + Instagram concluida em 2026-06-24:

- Site ja atualizado e live no commit `76a0595` com captacao matinal: 382 itens, 141 de hoje, 360 ativos, 480 no arquivo.
- Pacote Instagram publicado: `.codex-temp/daily-protocol-20260624-morning/`.
- Instagram `@catalogo_czs_` via BlueStacks/ADB `127.0.0.1:5555`; contador final confirmado 757 -> 766 posts.
- Prova principal: `.codex-temp/daily-protocol-20260624-morning/publish-proof/instagram-profile-final-confirmed.png`.
- Log principal: `.codex-temp/daily-protocol-20260624-morning/publish-proof/publish-results.json`.
- Nao repetir os indices publicados `1,2,3,4,5,6,9,11,12` desse manifest.
- Observacao: apenas o indice 5 tinha video real captado; os demais sao cards jornalisticos narrados com musica baixa, porque a captacao do dia trouxe so 1 `videoUrl`.

Documento analitico de financiamento CZS para deputado entregue em 2026-06-24:

- Pedido complementar do usuario: deixar o apoio total em `R$ 10.000,00` para 90 dias, dividir por demandas, incluir insights de views/virais do Instagram, o que foi feito ou nao, graficos, organograma logico do jornal e fotos/prints/demo.
- PDF final recomendado para envio/impressao: `C:\Users\junio\Downloads\proposta-financiamento-catalogo-czs-deputado-analitica-2026-06-24.pdf`.
- Revisao final nomeada para o destinatario: `C:\Users\junio\Downloads\proposta-financiamento-catalogo-czs-deputado-ze-adriano-2026-06-24.pdf`.
- Fonte no repo: `output/propostas/proposta-financiamento-catalogo-czs-deputado-analitica-2026-06-24.pdf`.
- Fonte nova no repo: `output/propostas/proposta-financiamento-catalogo-czs-deputado-ze-adriano-2026-06-24.pdf`.
- HTML editavel/visual: `C:\Users\junio\Downloads\proposta-financiamento-catalogo-czs-deputado-analitica-2026-06-24.html` e `output/propostas/proposta-financiamento-catalogo-czs-deputado-analitica-2026-06-24.html`.
- HTML novo para edicao/visual: `C:\Users\junio\Downloads\proposta-financiamento-catalogo-czs-deputado-ze-adriano-2026-06-24.html` e `output/propostas/proposta-financiamento-catalogo-czs-deputado-ze-adriano-2026-06-24.html`.
- Documento tem 9 paginas: capa/pedido direto ao Deputado Ze Adriano, resumo, orçamento, relatorio tecnico de PC, views/cenarios, feito/parcial/pendente, organograma, provas visuais e fechamento/contrapartidas.
- Provas usadas na versao final: print publico do site CZS em desktop, print publico do site CZS em mobile e print do Instagram com painel profissional. Nao usar print de erro/bloqueio nesta proposta.
- Correcoes finais: sem `wa.me`; telefone impresso `(68) 99209-6037`; texto com `712 mil` visualizacoes em `14 dias`; recursos para programacao e poder computacional.
- Regra de orcamento valida apos correcao do usuario: os `R$ 3.000,00` sao adicionais aos `R$ 10.000,00`, nao retirados deles. Pedido correto: `R$ 10.000,00` para nucleo operacional de alta performance/programacao/poder computacional + `R$ 3.000,00` adicionais para logistica de crescimento rapido, total `R$ 13.000,00`.
- Linguagem valida: evitar `improviso`, `padronizar`, `padronizacao` e `prototipo`; usar linguagem de alto nivel: `alta performance`, `niveis mais altos`, `qualidade`, `desempenho`, `precisao` e `perfeicao na execucao`.
- Inclui espaco para patrocinios ja existentes e ainda nao usados, explicacao de crescimento conduzido com controle estrategico para elevar qualidade/desempenho/perfeicao e apoio institucional a materias, material grafico e difusao publica do Deputado Ze Adriano e aliados institucionais adjacentes.
- Validacao final: PDF com header `%PDF-`, 9 paginas, `R$ 13.000,00`, `R$ 10.000,00`, `R$ 3.000,00 adicionais`, `logística de crescimento rápido`, `Deputado Zé Adriano`, `712 mil`, `14 dias` e `(68) 99209-6037` presentes; `wa.me`, `Destinatário sugerido`, `improviso`, `padronizar`, `padronização`, `protótipo` e `R$ 45.000,00` ausentes; render PNG conferido por contact sheet das 9 paginas.
- Nota para retomada: usar esta versao analitica como a mais completa; a versao de 2026-06-23 permanece como historico mais curto.

Documento de financiamento CZS para deputado entregue em 2026-06-23:

- Pedido: consolidar Instagram, crescimento, propagandas, mecanismos, agentes, fluxo e alcance extrapolado com numeros compostos em documento para financiamento dos servicos.
- PDF final: `output/propostas/proposta-financiamento-catalogo-czs-deputado-2026-06-23.pdf`.
- Copia para envio/impressao: `C:\Users\junio\Downloads\proposta-financiamento-catalogo-czs-deputado-2026-06-23.pdf`.
- HTML imprimivel/editavel: `output/propostas/proposta-financiamento-catalogo-czs-deputado-2026-06-23.html`; copia em `C:\Users\junio\Downloads\proposta-financiamento-catalogo-czs-deputado-2026-06-23.html`.
- Documento tem 6 paginas: capa/pedido, evidencias, fluxo/agentes, crescimento/alcance composto, orcamento/contrapartidas e encaminhamento.
- Ajuste em 2026-06-24: usuario corrigiu que o financiamento total e `R$ 10.000,00`; PDF/HTML foram atualizados e copiados novamente para Downloads.
- Pedido recomendado no documento: `R$ 10.000,00` total para 90 dias, equivalente a `R$ 3.333,33/mes`; orcamento ajustado ao teto de 10 mil.
- Validacao: PDF final gerado via ReportLab, conferido com `pypdf`, header `%PDF-`, termos-chave extraiveis, `R$ 45.000,00` ausente, render `pdftoppm` em PNG das 6 paginas revisado.
- Nota para retomada: os numeros de alcance foram rotulados como cenarios/projecoes de exposicoes compostas, nao como metricas auditadas de pessoas unicas.

Rodada CZS protocolo diario em 2026-06-23:

- Captacao nova feita com `node scripts/capture-latest-news.js`: 379 itens captados, 287 de hoje, 360 ativos, 480 no arquivo.
- Site atualizado no commit `b24495f6` (`chore: update CZS daily news capture 2026-06-23`), pushado para `main`; Render deploy `dep-d8te7hkm0tmc73clil90` ficou `live`.
- API publica validada em `https://catalogo-cruzeiro-web.onrender.com/api/news/archive?limit=10&fresh=20260623-daily-final`, retornando itens de 23/06.
- Pacote social: `.codex-temp/daily-protocol-20260623/`.
- Gerador temporario: `generate_daily_package.py`; usa a logo local `assets/brand/catalogo-czs-logo-official-crops-20260603/catalogo-czs-horizontal-real-alpha-20260603.png`.
- A captacao de 23/06 nao trouxe `videoUrl` real; os Reels gerados sao cards narrados com musica baixa, 1080x1920 H.264/AAC. Nao chamar de video captado/flagrante.
- Instagram `@catalogo_czs_` operado pelo BlueStacks/ADB `127.0.0.1:5555`; contador visual inicial 742 e final 748 posts.
- Publicados 6 Reels: Festival da Farinha; servidores da Saude em frente a prefeitura; Tanizio/MDB/Mailza/Vagner; meningite em CZS; PNAE Porto Walter; PF/Edir Macedo.
- Prova final: `.codex-temp/daily-protocol-20260623/instagram-profile-final.png`; log: `.codex-temp/daily-protocol-20260623/publish-proof/publish-results.json`.
- Se continuar a rotina, evitar repetir indices `1,4,8,10,11,18` do manifest diario. Itens restantes disponiveis, mas revisar visual/tema antes de postar.
- Facebook/WhatsApp nao foram executados nesta retomada porque a superficie de navegador/perfil correto nao estava disponivel via ferramenta; nao declarar como publicado sem nova prova.
- Complemento pedido pelo usuario em seguida: publicados mais 9 Reels e contador foi de 748 para 757 posts.
- Indices adicionais publicados: `5,6,7,12,13,19,2,15,16`.
- Prova final apos complemento: `.codex-temp/daily-protocol-20260623/instagram-profile-final-after-more.png`.
- Resta no manifest apenas o indice `3`, mas ele duplica a pauta sensivel do indice `2`; segurar para nao saturar a grade com duas chamadas parecidas sobre o mesmo crime.

Rodada CZS captação + preview Instagram em 2026-06-18:

- Usuário pediu captação agora e preview-first para Instagram: um Reel e uma notícia normal no feed antes de postar.
- Captação local feita por `node scripts/capture-latest-news.js`: 352 itens captados, 280 de hoje, 360 ativos e 480 no arquivo; `agencia-acre` e `g1-brasil` abortaram, mas `ok=true`.
- Pacote: `.codex-temp/czs-captacao-instagram-preview-20260618/`.
- Reel preview: `reel-preview/reel-preview-natural-logo-certa.mp4`; pauta `Troca de tiros entre guarnições da PM em Cruzeiro do Sul; disparos quebram vidro de viaturas`; fonte `Jurua Online`; validado por `ffprobe` como 1080x1920, H.264/AAC, 21s.
- Feed preview: `feed-preview/feed-preview-4x5.png`; pauta `Recapeamento da AC-405 avança e obra deve alcançar quase 32 quilômetros entre Cruzeiro do Sul e Mâncio Lima`; fonte `Jurua Online`.
- Legendas estão em `reel-preview/caption.txt` e `feed-preview/caption.txt`.
- Não publicar sem nova aprovação visual do usuário; não houve Instagram/postagem/deploy/push nesta etapa.

Rodada CZS Jornal + Instagram com logo certa em 2026-06-17:

- Usuario mandou a logo correta e cobrou duramente: `C:\Users\junio\Downloads\ChatGPT Image 3 de jun. de 2026, 14_14_50.png`; usar esta quando ele disser "logo certa hoje".
- Pacote da rodada: `.codex-temp/czs-jornal-instagram-20260617-logo-certa/`.
- Captação local feita com `scripts/capture-latest-news.js`: 363 itens, 261 de hoje, 360 ativos, 480 no arquivo; arquivos locais de notícia foram alterados, mas não houve deploy.
- Reels renderizado com `CZS_BRAND_LOGO` apontando para a logo correta; preview validado em `cover.jpg`.
- ADB do BlueStacks funcionou em `127.0.0.1:5555`; `emulator-5554` apareceu inconsistente/offline antes.
- Instagram `@catalogo_czs_`: publicado o Reel correto `Em clima de Copa, vereador Moacir Junior, convoca população para doar sangue`; contador final 684 posts; prova `publish-proof/profile-final.png`.
- Erro registrado: antes do post correto, a automação selecionou a miniatura errada e publicou um duplicado de `Advogado questiona gastos da OAB Acre...`. Não apagar sem aprovação explícita do usuário, porque remoção de conteúdo é R5.

Ponte Telegram Codex criada em 2026-06-17:

- Bot confirmado: `@Codexjuniorcruzeirobot`.
- Script: `scripts/telegram-codex-bridge.js`.
- Doc: `docs/TELEGRAM_CODEX_BRIDGE.md`.
- Script npm: `npm run telegram:codex`.
- Token real fica em `.env.telegram.local`, ignorado pelo Git; nunca copiar para docs, memória ou commit.
- Processo local iniciado em segundo plano. Logs em `.codex-temp/telegram-codex-bridge/`.
- Estado seguro: sem `TELEGRAM_ALLOWED_CHAT_IDS`, só `/id` responde. Para liberar ordens reais, o usuário precisa mandar `/id` no Telegram e o chat_id deve ser colocado em `.env.telegram.local`.
- Texto comum e `/ordem` registram em `.codex-memory/orders.json` e `data/office-orders.json`; `/r5` registra aprovação explícita para ação sensível, ainda com validação final de destino/contexto.

Ofício Prefeitura / Expoacre Juruá 2026 concluído:

- Entrega válida: `C:\Users\junio\Downloads\PACOTE_CORRIGIDO_ORCAMENTO_COMPLEMENTAR_15000\05_CADERNO_PROTOCOLAR_CORRIGIDO_COMPLEMENTAR_15000.pdf`.
- Usar somente o pacote corrigido. Pacotes anteriores ficam invalidados porque misturavam/anexavam o orçamento principal.
- A minuta está endereçada ao prefeito Zequinha Lima e solicita exclusivamente `R$ 15.000,00` complementares para ações extras.
- Estrutura, ambientes, equipamentos, operação principal e ampliação de necessidades estão expressamente excluídos.
- O pacote contém somente PDFs. A pasta limpa de envio contém apenas o PDF final.
- Antes do protocolo, preencher número do ofício, nome/assinatura e contato do representante.

Facebook Catálogo CZS:

- Pacote pronto em `.codex-temp/facebook-jornal-catalogo-czs-20260614/`.
- O usuário autorizou explicitamente a sessão `Antonio e Rnascimento Jr.` para administrar esta operação.
- Página pública separada criada: `Catálogo CZS - Cruzeiro do Sul`.
- URL: `https://www.facebook.com/profile.php?id=61590705575363`.
- Categoria, bio, cidade, site e Instagram configurados.
- Apresentação institucional publicada e fixada.
- Quatro notícias publicadas com cards do site.
- Não foi apagado conteúdo pessoal: a separação foi feita por Página.
- Pendente apenas logo e capa. O upload exige ativar `Permitir acesso a URLs de arquivo` nos detalhes da extensão Codex do Chrome.
- Relatório: `.codex-temp/facebook-jornal-catalogo-czs-20260614/FINAL-EXECUTION-REPORT-20260614.md`.

Rodada noturna CZS concluida: captação nova, site atualizado online e 6 Reels publicados no @catalogo_czs_. Commit de site ca3fc8a9 pushado em main; Render dep ca3fc8a ficou live às 18:15; API online validou total e título corrigido 'Acre é contemplado...'. Reels publicados: saúde R,7 mi, água Juruá/Purus, ruas de CZS na Copa, gestante Rio Liberdade, Zequinha/Zezinho e Porto Walter.

## Next

- Se retomar Instagram
- não repetir os 6 Reels da pasta .codex-temp/czs-reels-news-20260614-night. Se retomar site
- partir do commit ca3fc8a9 e validar online com ?fresh=night-20260614.
- Para concluir o visual do Facebook, liberar a permissão de URLs de arquivo e aplicar os dois PNGs da pasta `assets/`.

## Headroom

- Headroom `0.25.0` instalado globalmente.
- Atalhos prontos: `codex-headroom`, `hermes-headroom`, `headroom-ollama`.
- Codex MCP e Hermes MCP `headroom` registrados e validados.
- Hermes provider opt-in `headroom-ollama` validado com Ollama local.
- Proxy Ollama fica em `127.0.0.1:8788`; logs em `C:\Users\junio\.headroom\logs`.
- Evitar `headroom wrap codex` diretamente no Windows: apresentou bugs de `cp1252` e restauração do `config.toml`.

## Rodada 2026-06-15

- Instagram concluído: 20 feed + 20 Reels no `@catalogo_czs_`, Story Norte Fibra ativo, colaboração com `@acre.diario` aguardando aceite e notícias enviadas no direct.
- Pacote e provas: `.codex-temp/czs-instagram-routine-20260615/`.
- Site atualizado pelo commit `d0c8bb22`; Render deploy `dep-d8o78cu8bjmc73bp0rs0` live.
- Próxima rodada não deve repetir os itens de `.codex-temp/czs-instagram-routine-20260615/publication-queue.json`.

## Desapego CZS - móveis e ventiladores

- Pacote pronto: `.codex-temp/desapego-moveis-ventiladores-20260616/release/`.
- Correção do usuário: não publicar móveis/ventilador no site/home CZS.
- Não postar no Instagram: é classificado/objeto.
- Site CZS fica para notícias, vídeos, utilidade pública, serviços e convites editoriais.
- WhatsApp: usar só grupos de venda aprovados e validar cabeçalho.
- Facebook: postar só se perfil/contexto correto estiver validado; bloquear se aparecer perfil errado.
- Pendência: fotos reais dos móveis não foram encontradas; o item móveis é chamada para WhatsApp, não anúncio com prova visual.

## Reels CZS - 2026-06-17

- Use BlueStacks/ADB para Instagram antes de navegador: dispositivo `emulator-5554`, pacote `com.instagram.android`.
- Pacote atual: `.codex-temp/czs-decent-social-20260616/`.
- Site publicado: `https://catalogo-cruzeiro-web.onrender.com`, commit `951034bc`.
- Instagram `@catalogo_czs_`: 3 Reels reais enviados pelo app Android nesta retomada.
- Evidências principais: `adb-instagram-reel-01/02/03-*` dentro do pacote; para o terceiro, `adb-instagram-reel-03-upload-check-90s.png/xml` mostrou ausência de erro após sumir o envio.
- Não tentar postar Facebook/WhatsApp pelo BlueStacks sem instalar/configurar os apps; nesta checagem só o Instagram estava instalado.

## Retomada Instagram CZS - 2026-06-19

- Última grande rotina concluída: 50 noticias publicadas no `@catalogo_czs_`.
- Pacote e prova ficam em `.codex-temp/czs-50-noticias-instagram-20260618/`; final proof: `publish-proof/profile-final-after-50.png`.
- Perfil confirmou 735 posts depois da rodada; antes da rodada estava em 685.
- Se retomar, evitar republicar os 50 itens deste pacote. A automação corrigida está em `post_reels_czs_50.py`.
- Logo correta obrigatória segue sendo `C:\Users\junio\Downloads\ChatGPT Image 3 de jun. de 2026, 14_14_50.png`.

## Proposta financiamento CZS - Deputado Ze Adriano

- Usar a versao final em `C:\Users\junio\Downloads\proposta-financiamento-catalogo-czs-deputado-ze-adriano-2026-06-24.pdf`.
- HTML editavel correspondente: `C:\Users\junio\Downloads\proposta-financiamento-catalogo-czs-deputado-ze-adriano-2026-06-24.html`.
- Copias internas: `output/propostas/proposta-financiamento-catalogo-czs-deputado-ze-adriano-2026-06-24.pdf/html`; a versao `analitica` foi sobrescrita com o mesmo conteudo final para nao sobrar arquivo antigo.
- Conteudo final: proposta institucional ao Deputado Ze Adriano, apoio total de `R$ 13.000,00`, com `R$ 10.000,00` para programacao/poder computacional/nucleo operacional e `R$ 3.000,00 adicionais` para logistica de crescimento rapido.
- Tração declarada no documento: `712 mil visualizacoes em 14 dias`.
- Inclui orcamento 90 dias, relatorio tecnico de PC compativel ate R$ 10 mil, cenarios de alcance, organograma do jornal, plano de monetizacao por banners/flyers/ads, registros visuais do site desktop/mobile e Instagram.
- Inclui pagina final de assinaturas: `Junior Clovis Sampaio` como programador/criador e `Deputado Ze Adriano ou responsavel pelo recebimento`.
- Validacao final ja feita: PDF 11 paginas; busca textual sem `Contato impresso`, `Canal`, `Periodo`, `wa.me`, `improviso`, `padronizar`, `prototipo`, `Pedido direto`, `Documento final`, `views`, `print de erro`, `Contrapartida institucional prevista`.
- Prova visual renderizada: `.codex-temp/proposta-ze-adriano-render-final-monetizacao/contact-sheet.png`.

## Proposta financiamento CZS - piloto ampliado 2026-06-25

- Versao atual para leitura: `output/propostas/proposta-financiamento-catalogo-czs-deputado-ze-adriano-piloto-leitura-ampliado-2026-06-25.pdf`.
- HTML editavel/navegavel: `output/propostas/proposta-financiamento-catalogo-czs-deputado-ze-adriano-piloto-leitura-ampliado-2026-06-25.html`.
- Esta versao substitui a narrativa anterior de `712 mil`; usa quase `1,6 milhao` de visualizacoes informadas pelo usuario e varios virais, com ressalva de confirmacao por print/exportacao Meta.
- Orçamento: `R$ 10.000,00` exclusivamente para computador/poder computacional; `R$ 3.000,00 adicionais` para impulsao, logistica e materias autorais.
- Inclui prints limpos do jornal web desktop/mobile, materias virais validas, alcance composto por ferramenta, tecnologias/mecanismos, organograma, monetizacao por banners/flyers/ads e pagina de assinaturas.
- PDF gerado via ReportLab; validacao textual com `pypdf` confirmou 14 paginas, obrigatorios presentes e proibidos ausentes. Render PDF nao foi feito porque o ambiente atual nao tem Ghostscript/Poppler/Mutool; a previa dos assets fica em `.codex-temp/proposta-ampliada-render/assets-contact-sheet.jpg`.

## Proposta financiamento CZS - v2 corrigida

- Usar esta versao em vez da `piloto-leitura-ampliado`: `output/propostas/proposta-financiamento-catalogo-czs-deputado-ze-adriano-v2-2026-06-25.pdf`.
- HTML correspondente: `output/propostas/proposta-financiamento-catalogo-czs-deputado-ze-adriano-v2-2026-06-25.html`.
- Imagens do HTML ficam em `output/propostas/proposta-ze-adriano-v2-assets/`; esta versao nao usa base64 e evita aparecer codigo na leitura.
- Melhorias feitas apos reclamacao do usuario: graficos proprios, texto mais forte/contextual, prints limpos do jornal, cards reais do pacote Instagram/noticias, retirada de prints quebrados.
- Validacao final: PDF 11 paginas; HTML sem `data:image` e sem `base64`; termos obrigatorios presentes e proibidos ausentes.

## Proposta CZS - deputado federal v4

- Usar como versao atual para deputado federal: `output/propostas/proposta-catalogo-czs-deputado-federal-v4-2026-06-26.pdf`.
- HTML navegavel/editavel: `output/propostas/proposta-catalogo-czs-deputado-federal-v4-2026-06-26.html`.
- Assets: `output/propostas/proposta-deputado-federal-v4-assets/`.
- Foco: fazer o deputado adotar/financiar a infraestrutura de comunicacao regional, com 11,6 milhoes de visualizacoes em 17 dias, perto de 4 mil seguidores, rotina de Reels na casa de 1 mil views, previsoes compostas, exemplos de linguagem parlamentar e plano de 90 dias.
- Orcamento: `R$ 10.000,00` apenas para computador/poder computacional; `R$ 3.000,00 adicionais` para impulsao, logistica e producao autoral.
- PDF final tem 8 paginas cheias, capa profissional, graficos, pizzas, diagrama do jornal, prints desktop/mobile/Instagram, cards virais, fechamento com protocolo e assinaturas.
- Validacao feita: sem vazamento de `Paragraph(`, `ParaFrag`, `Image(` ou `caseSensitive`; sem `wa.me`, `improviso`, `padronizar`, `prototipo`, `712 mil visualizacoes em 14 dias` ou `1,6 milhao`.
- Prova visual: `.codex-temp/proposta-deputado-federal-v4-pages.jpg`.
- Ultima correcao: regenerar a partir de `.codex-temp/build-deputado-federal-v4.py` evita titulo orfao/quebra vazia no estilo da secao 3 mostrada pelo usuario. PDF atual tem 11 paginas e inclui prints de maior tracao/virais (`viral-cadela`, `viral-meningite`, `viral-rapadura`) alem dos cards.
- Correcao mais recente: retirar linguagem "adocao"/"deveria adotar"/"justa e boa" e manter termos tecnicos (`parceria estrategica`, `financiamento tecnico`, `cooperacao tecnica`, `contrapartida institucional`, `prestacao verificavel`).
- Nao usar prints de materia com banco/bloco branco. A secao 9 atual usa grade Instagram, Reels e cards editoriais com conteudo grafico carregado.
- Ultima revisao visual: evitar repeticao de imagens entre secoes. Secao 4, 6, 7, 8 e 9 agora usam conjuntos diferentes; pagina 9 foi separada em tabelas para nao deixar celulas vazias.
- Revisao final: capa sem mosaico repetido; secao 6 usa painel `jornal-funcoes-board.png`; secao 8 usa painel `linguagem-coop-board.png`; miolo validado sem repeticao direta de imagens `IMG(...)` e sem print com metade em branco.

## CZS noticias/site/Instagram - 2026-06-26

- Site ja publicado em `main` pelo commit `6d95779b19182f7691c5a54160e17eea47346f91`; Render deploy live `dep-d8v7ggd7vvec73erk4b0`.
- Captura do site: 383 itens capturados, 197 de 2026-06-26, 360 ativos e 480 no arquivo.
- Pacote social atual: `.codex-temp/daily-protocol-20260626/`.
- Instagram `@catalogo_czs_`: 7 Reels publicados via BlueStacks/ADB `127.0.0.1:5555`; indices do manifesto: 1, 3, 6, 8, 9, 11 e 12.
- Perfil comprovado: 789 -> 796 posts; prova final em `.codex-temp/daily-protocol-20260626/publish-proof/final-profile-after-fast.png`.
- Para retomar, nao repetir os indices 1, 3, 6, 8, 9, 11 e 12 desse manifesto. Se precisar continuar a mesma rodada, usar `post_reels_fast.py` com novos `SELECTED_INDEXES`, porque a leitura XML/contador do `post_reels.py` travou apos o item 8.
- Facebook/WhatsApp ainda exigem superficie de navegador/perfil validada antes de postar; regra continua: perfil autorizado CZS/comercial e bloqueio se aparecer perfil errado.

## Videos polemicos / Reels com logo CZS - 2026-06-26

- Pacote pronto na Area de Trabalho: `C:\Users\junio\Desktop\videos-polemicos-acre-2026-06-26`.
- Versoes para WhatsApp/Reels com logo e tipagem CZS: `C:\Users\junio\Desktop\videos-polemicos-acre-2026-06-26\com-logo-czs`.
- Relatorio completo: `C:\Users\junio\Desktop\videos-polemicos-acre-2026-06-26\RELATORIO-VIDEOS-POLEMICOS-CZS-2026-06-26.md`.
- Arquivos CZS validados como MP4 H.264/AAC 1080x1920: `01-...-czs.mp4`, `02-...-czs.mp4`, `03-...-czs.mp4`, `04-...-czs.mp4`, `05-...-czs.mp4`, `08-...-czs.mp4`.
- Filtro de agente atualizado: `docs/CZS_REAL_VIDEO_REELS_AGENT_PROMPT.md`; treino auxiliar: `docs/social/czs-reels-video-polemico-training-2026-06-26.md`.
- Regra nova: buscar origem limpa; se so houver repost com logo de terceiro, aplicar marca CZS forte por cima, manter fonte visivel, gerar MP4 WhatsApp/Reels e validar por `ffprobe`.
