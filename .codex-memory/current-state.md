# Current State

Updated: 2026-06-27T19:10:00-05:00

## Rodada Mailza Reels - 2026-06-28

- Usuario pediu reforco de Mailza porque estava pouco no Instagram, com preferencia por Reels reais baixados/refeitos, logo CZS e formato padrao.
- Captacao nova executada com `node scripts/capture-latest-news.js`: `ok=true`, 371 itens captados, 147 de hoje, 360 ativos e 480 no arquivo; PCAC abortou novamente, demais fontes ficaram validas.
- Foram encontrados 17 itens Mailza/governadora no `data/runtime-news.json`; a maioria era foto/texto sem `videoUrl`, entao nao virou Reel fake.
- Instagram publico bloqueou downloads via yt-dlp com `empty media response`; Facebook publico permitiu baixar videos reais.
- Pacote da rodada: `.codex-temp/mailza-round-20260628/`.
- Baixados 10 MP4s publicos; renderizados 9 Reels reais CZS em `videos/com-logo-czs/` com logo oficial, tarja editorial, titulo, fonte e audio preservado. O item 10 de Brasileia ficou bloqueado por arquivo/render quebrado apos timeout.
- Captions reforcadas com fonte/link, site, Instagram, WhatsApp do Catalogo CZS e apoio Norte Ultra Fibra.
- Instagram `@catalogo_czs_` via BlueStacks/ADB `127.0.0.1:5555`: 9 envios Mailza registrados com `submitted=true`.
- Prova de perfil: antes `846 posts`; final limpo `861 posts`, com print/XML em `.codex-temp/mailza-round-20260628/proof/profile-final-mailza-clean.*`.
- Observacao operacional: o contador subiu +15 na janela da rodada, possivelmente incluindo processamentos pendentes anteriores; declarar com precisao que esta fila Mailza teve 9 envios `submitted=true`, nao atribuir isoladamente +15 apenas aos 9.
- Relatorio: `.codex-temp/mailza-round-20260628/RELATORIO-MAILZA-REELS-20260628.md`.

## Tour noturna CZS - 2026-06-27

- Usuario pediu tour noturna com Juruá/região, vídeos polêmicos e memes para chamar seguidores, além de adicionar o aprendizado à rotina/memória.
- Foram chamados agentes auxiliares: insights locais, captação web de ganchos e rotina; os três retornaram recomendações usadas.
- Insight consolidado: o que funciona melhor é Reel real/polêmico ou curioso, Juruá/Cruzeiro do Sul, pautas humanas regionais, frequência alta, janelas de manhã/noite e prova por contador/print.
- Regra adicionada em `docs/CZS_REAL_VIDEO_REELS_AGENT_PROMPT.md` e `docs/social/czs-reels-video-polemico-training-2026-06-26.md`: tour noturna curta/forte, Juruá primeiro, memes leves sem vítima, cobrir marca de terceiros com CZS mantendo fonte, e só declarar postagem com prova.
- Captacao noturna executada: 370 itens, 210 de hoje, 360 ativos, 480 no arquivo; PCAC abortou novamente.
- Site/Render atualizado no commit `4586d224` (`chore: update CZS night tour capture 2026-06-27`), pushado para `main`; Render deploy `dep-d9065e67r5hc73b6qf5g` ficou `live`.
- Validacao publica `news-data.js?fresh=4586d224` retornou 200 e confirmou `Acidente entre moto e bicicleta`, `Expoacre Juruá 2026`, `Governadora Mailza` e `Freiras viralizam`.
- Pasta da tour: `.codex-temp/tour-noturna-20260627/`.
- Vídeos reais aprovados e publicados no Instagram: `Tanque de guerra improvisado chama atenção nas ruas de Cruzeiro do Sul` (ac24horas/Facebook, com marca CZS por cima) e `Criadora acreana relata sintomas e diagnóstico de endometriose` (Portal Acre).
- Bloqueados/pendentes: meme do carro/moto por bloqueio de download; freiras por embed Instagram sem MP4 acessível; jovem armado/Sobral por risco visual e sem áudio; agressão com terçado por risco gráfico.
- Instagram `@catalogo_czs_` via BlueStacks/ADB: contador `844` antes do lote, `845` após script e `846` no refresh final, então +2 posts confirmados.
- Provas: `.codex-temp/tour-noturna-20260627/proof/profile-before.xml`, `profile-after.xml`, `profile-final-refresh.xml/png`, `publish-results.json`.

## Rodada matinal CZS - site Render + Instagram 2026-06-27

- Usuario pediu "ok denovo"; interpretado como repetir captacao, atualizar jornal online Render e Instagram.
- Captacao executada com `node scripts/capture-latest-news.js`: `ok=true`, 373 itens captados, 147 de hoje, 360 ativos e 480 no arquivo.
- PCAC voltou a falhar por abort/timeout; pacote geral ficou valido com demais fontes.
- Commit publicado no site: `3bcf8a47` (`chore: update CZS news capture 2026-06-27`), pushado para `main`.
- Render `catalogo-cruzeiro-web` deploy `dep-d8vsrap9rddc73a2cdf0` ficou `live` no commit `3bcf8a474c68f604c4ce73137a2f14cccd8f0bb8`.
- Validacao publica: `news-data.js?fresh=3bcf8a47` retornou 200 e confirmou `Bastidores da sucessao`, `Temperaturas amenas`, `Ajude Isadora` e `Tanque de guerra`; API `/api/news/archive?limit=10&fresh=3bcf8a47` retornou 200 com itens novos de 27/06.
- Pacote Instagram principal: `.codex-temp/daily-protocol-20260627/`; 9 MP4s validos 1080x1920 H.264/AAC e 3 erros de renderizacao por `maximum recursion depth exceeded`.
- Pacote Instagram extra: `.codex-temp/daily-protocol-20260627-extra/`; 3 MP4s validos 1080x1920 H.264/AAC e 1 erro de renderizacao.
- Instagram `@catalogo_czs_` operado via BlueStacks/ADB `127.0.0.1:5555`; perfil final confirmado em 838 posts, saindo de 827 antes da rodada. Resultado confirmado: +11 posts na grade.
- Scripts retornaram 12 envios `submitted=true` no total, mas apenas +11 entraram no contador apos espera/refresh; registrar um envio como aceito pelo app sem confirmacao de contador, nao contar como grade confirmada.
- Provas: `.codex-temp/daily-protocol-20260627/publish-proof/publish-results-fast.json`, `.codex-temp/daily-protocol-20260627/publish-proof/profile-final-refresh-2min.png`, `.codex-temp/daily-protocol-20260627-extra/publish-proof/publish-results-fast.json`, `.codex-temp/daily-protocol-20260627-extra/publish-proof/profile-final-refresh.png`.
- Pautas publicadas/aceitas no lote principal: Isadora/encefalite, Detran/acidente em Cruzeiro do Sul, comerciante ameaçado, tornozeleira/perturbação, acidente com motorista de app, café na Aleac em Cruzeiro do Sul, Zequinha/sessão do café, cafeicultura no Acre, jovem armado morto em ocorrência de roubo.
- Pautas extras publicadas: ônibus da Transacreana em Tarauacá, mês do Meio Ambiente em Cruzeiro do Sul, lei de placas em imóveis alugados pela Prefeitura.

## Rodada noturna CZS - site Render + Instagram videos polemicos 2026-06-26

- Usuario autorizou executar tudo: captar, atualizar Instagram e jornal online no Render.
- Captacao executada com `node scripts/capture-latest-news.js`: `ok=true`, 376 itens captados, 239 de hoje, 360 ativos e 480 no arquivo.
- Fonte PCAC falhou por timeout/abort nessa captura; demais fontes principais seguiram e o pacote ficou valido.
- Arquivos de noticia atualizados: `data/runtime-news.json`, `data/news-archive.json`, `news-data.js`, `data/latest-news-capture-report.json`.
- Commit publicado: `c8458cb1` (`chore: update CZS evening capture and reels filter`), enviado para `main`.
- Render `catalogo-cruzeiro-web` deploy `dep-d8vhev67r5hc73as52m0` ficou `live` com o commit `c8458cb1`.
- Validacao publica: `https://catalogo-cruzeiro-web.onrender.com/news-data.js?fresh=c8458cb1` retornou 200 e confirmou chamadas `Cafe ganha destaque`, `Ajude Isadora`, `Tanque de guerra` e `Em Cruzeiro do Sul`.
- API publica `/api/news/archive?limit=10&fresh=c8458cb1` retornou 200 com 10 itens; topo validado com Cafe/Aleac em Cruzeiro do Sul e pautas institucionais do Acre.
- Instagram `@catalogo_czs_` operado pelo BlueStacks/ADB `127.0.0.1:5555`; contador confirmado de 821 para 827 posts.
- Publicados 6 Reels MP4 com videos reais do pacote `C:\Users\junio\Desktop\videos-polemicos-acre-2026-06-26\com-logo-czs`: carro em chamas na escola militar, roubo em loja de celulares, flagra/traição viral, briga em casa de shows, audio da loja quebrada e confusao em loja no Bosque.
- Provas Instagram: `.codex-temp/polemical-videos-instagram-20260626/proof/publish-results.json`, `profile-final-refresh.xml` e `profile-final-refresh.png`.
- Atualizacao de filtro/treinamento registrada em `docs/CZS_REAL_VIDEO_REELS_AGENT_PROMPT.md` e `docs/social/czs-reels-video-polemico-training-2026-06-26.md`: priorizar video real MP4, fonte limpa quando possivel, overlay CZS quando houver logo de terceiros, legenda completa com site/patrocinador/redes/fonte.

## Site CZS - captação e deploy 2026-06-26

- Usuario autorizou `pode subir tudo`; como a data atual ja era 2026-06-26, foi feita nova captacao antes do deploy para nao publicar pacote antigo de 25/06.
- Captacao executada em 2026-06-26: `ok=true`, 383 itens captados, 197 de hoje, 360 ativos e 480 no arquivo.
- Midia de hoje: 154 itens com imagem e 3 com `videoUrl` real.
- Arquivos publicados no site: `data/runtime-news.json`, `data/news-archive.json`, `news-data.js`, `data/latest-news-capture-report.json`.
- Commit de site: `6d95779b` (`chore: update CZS news capture 2026-06-26`), pushado para `main`.
- Render `catalogo-cruzeiro-web` deploy `dep-d8v7ggd7vvec73erk4b0` ficou `live`.
- Validacao online: `news-data.js` publico confirmou chamadas de Ana Flavia/acidente em Cruzeiro do Sul, MPF/abastecimento, Mailza, Expoacre Jurua e adolescente morto apos motorista desrespeitar parada.
- API publica `/api/news/archive?limit=30&fresh=20260626-live` retornou itens de 26/06.
- Nao houve postagem Instagram/Facebook/WhatsApp nesta etapa; foi apenas site/noticias.

## WhatsApp Catálogo CZS - notícias matinais 2026-06-24 concluídas em 2026-06-25

- Usuário pediu para terminar após reabrir o Chrome.
- Destino validado pelo plugin: campo `Digite uma mensagem para o grupo Catálogo CZS`.
- Notícias enviadas com card/imagem + legenda completa: índices 1, 2, 3, 4, 5, 6, 9, 11 e 12 do pacote `.codex-temp/daily-protocol-20260624-morning/`.
- Para estabilizar o plugin, os cards foram convertidos para JPGs leves em `.codex-temp/daily-protocol-20260624-morning/whatsapp-catalogo-jpg/`.
- Provas salvas em `.codex-temp/daily-protocol-20260624-morning/whatsapp-catalogo-proof/`, incluindo `catalogo-final-after-completion.png`.
- Observação: a busca do WhatsApp mostrou a notícia 4 repetida nas tentativas anteriores; a retomada completou os itens faltantes sem enviar notícia para grupos de venda.

## Rodada matinal CZS site + Instagram - 2026-06-24

- Usuario pediu noticias matinais, site e depois autorizou explicitamente Instagram.
- Captacao executada em 2026-06-24: 382 itens captados, 141 de hoje, 360 ativos e 480 no arquivo.
- Site atualizado no commit `76a0595` (`chore: update morning news capture 2026-06-24`), pushado para `main`; Render `catalogo-cruzeiro-web` ficou `live`.
- Validacao online confirmou itens de 24/06 e `news-data.js` publico com chamadas de Mailza, Cruzeiro do Sul/Jurua, rapadura/alfinim e outras pautas regionais.
- Pacote Instagram: `.codex-temp/daily-protocol-20260624-morning/`.
- A captacao de 24/06 trouxe 1 `videoUrl` real e 121 noticias com imagem; pacote final teve 9 Reels validos 1080x1920 H.264/AAC.
- Instagram `@catalogo_czs_` publicado via BlueStacks/ADB `127.0.0.1:5555`; contador comprovado de 757 para 766 posts.
- Reels publicados: rapadura/alfinim/mel de cana; meningite em Cruzeiro do Sul; seletiva do Festival da Farinha; cadela no Hospital do Jurua; colisao em Rio Branco; transferencia urgente de paciente em Cruzeiro do Sul; denuncia de espera em hospital de Mancio Lima; fiscalizacao da Expoacre Jurua pelo MPAC; condenacao por estupro de crianca no Acre.
- Provas: `.codex-temp/daily-protocol-20260624-morning/publish-proof/publish-results.json` e `.codex-temp/daily-protocol-20260624-morning/publish-proof/instagram-profile-final-confirmed.png`.
- Observacao: o comando de publicacao estourou timeout do terminal depois do lote, mas o arquivo de resultados e o XML final do perfil confirmaram contador 766.

## Rodada proposta analítica financiamento CZS - 2026-06-24

- Usuario pediu reforço do documento: apoio total de `R$ 10.000,00` para 90 dias, dividido por demandas, com insights de views/virais do Instagram, quadro do que foi feito ou nao, graficos, organograma logico do jornal e fotos/prints/demo.
- Entrega final em PDF analítico: `output/propostas/proposta-financiamento-catalogo-czs-deputado-analitica-2026-06-24.pdf`; copia para envio/impressao em `C:\Users\junio\Downloads\proposta-financiamento-catalogo-czs-deputado-analitica-2026-06-24.pdf`.
- Versao HTML editavel/visual: `output/propostas/proposta-financiamento-catalogo-czs-deputado-analitica-2026-06-24.html`; copia em `C:\Users\junio\Downloads\proposta-financiamento-catalogo-czs-deputado-analitica-2026-06-24.html`.
- Revisao final para entrega ao Deputado Ze Adriano: nova versao nomeada `output/propostas/proposta-financiamento-catalogo-czs-deputado-ze-adriano-2026-06-24.pdf` e copia em `C:\Users\junio\Downloads\proposta-financiamento-catalogo-czs-deputado-ze-adriano-2026-06-24.pdf`; a versao analitica antiga foi sobrescrita com o mesmo conteudo para evitar impressao errada.
- Conteudo novo: orçamento de 90 dias por demanda, graficos de orçamento/producao/crescimento Instagram, leitura de `709,9 mil` visualizacoes no painel profissional visivel em print, status feito/parcial/pendente, plano de 90 dias, organograma logico e pagina de provas visuais.
- Correção final das provas visuais: pagina 8 passou a usar somente print publico do site em desktop, print publico do site em mobile e prints do Instagram com painel de visualizacoes/lote publicado; sem print de erro ou bloqueio.
- Correcoes finais do usuario aplicadas: destinatario direto ao Deputado Ze Adriano; removido `wa.me`; contato impresso `(68) 99209-6037`; metrica textual ajustada para `712 mil` visualizacoes em `14 dias`; recursos descritos como programacao e poder computacional.
- Correção de orçamento em 2026-06-24 10:10: `R$ 3.000,00` e adicional aos `R$ 10.000,00`, nao retirado deles. Versao valida pede `R$ 10.000,00` para nucleo operacional de alta performance/programacao/poder computacional + `R$ 3.000,00` adicionais para logistica de crescimento rapido, total `R$ 13.000,00`.
- Linguagem corrigida para nao sugerir amadorismo: remover/evitar `improviso`, `padronizar`, `padronizacao` e `prototipo`; usar `niveis mais altos`, `alta performance`, `qualidade`, `desempenho`, `precisao` e `perfeicao na execucao`.
- Documento agora inclui relatorio tecnico de PC compativel, espaco para patrocinios existentes ainda nao usados, explicacao de crescimento conduzido com controle estrategico para elevar qualidade/desempenho/perfeicao, e contrapartida de apoio institucional a materias, graficos e difusao publica do Deputado Ze Adriano e aliados institucionais adjacentes.
- Validacao feita: PDF com 9 paginas, header `%PDF-`, termos-chave extraiveis, `R$ 13.000,00`, `R$ 10.000,00`, `R$ 3.000,00 adicionais`, `logistica de crescimento rapido`, `712 mil` e `14 dias` presentes; `wa.me`, `improviso`, `padronizar`, `padronizacao`, `prototipo` e `R$ 45.000,00` ausentes; render PNG revisado nas paginas de capa, orçamento, insights, organograma, prints e fechamento.
- Nota importante: views nativas completas/pessoas unicas ainda dependem de exportacao oficial do Instagram/Meta; o documento diferencia evidencias locais de projecoes/cenarios.

## Rodada documento financiamento CZS para deputado - 2026-06-23

- Usuario pediu um documento para entregar a deputado, consolidando Instagram, crescimento, propagandas, mecanismos, agentes, fluxo e alcance extrapolado com numeros compostos para financiamento dos servicos.
- Entrega final em PDF: `output/propostas/proposta-financiamento-catalogo-czs-deputado-2026-06-23.pdf`; copia tambem em `C:\Users\junio\Downloads\proposta-financiamento-catalogo-czs-deputado-2026-06-23.pdf`.
- Versao HTML imprimivel/editavel: `output/propostas/proposta-financiamento-catalogo-czs-deputado-2026-06-23.html`; copia tambem em `C:\Users\junio\Downloads\proposta-financiamento-catalogo-czs-deputado-2026-06-23.html`.
- Ajuste em 2026-06-24: usuario corrigiu que o financiamento total e `R$ 10.000,00`; PDF/HTML foram atualizados e copiados novamente para Downloads.
- Conteudo do documento: proposta institucional do Catálogo CZS, pedido recomendado de `R$ 10.000,00` total para 90 dias, operacao social/site, agentes, propaganda, fluxo, evidencias locais e cenarios de exposicao composta.
- Validacao feita: PDF com 6 paginas, header `%PDF-`, termos-chave extraiveis, render PNG das 6 paginas revisado; checagem confirmou `R$ 10.000,00` presente e `R$ 45.000,00` ausente.
- Nota importante: os numeros de alcance sao cenarios/projecoes de exposicoes compostas, nao metricas auditadas de pessoas unicas.

## Rodada CZS protocolo diario - 2026-06-23

- Usuario mandou executar o protocolo de todo dia.
- Arquivo `docs/CODEX_SOCIAL_SITE_ROUTINES.md` nao existe neste checkout; rotina seguiu `czs-social-protocol`, `propaganda-automation-protocol.md`, `czs-social-fast-paths.md` e `docs/CZS_PRODUCT_MASTER_RULES.md`.
- Captacao executada em 2026-06-23: `ok=true`, 379 itens captados, 287 de hoje, 360 ativos e 480 no arquivo.
- Site atualizado e publicado: commit `b24495f6` enviado para `main`; Render `catalogo-cruzeiro-web` deploy `dep-d8te7hkm0tmc73clil90` ficou `live`.
- Validacao online: `/api/news/archive?limit=10&fresh=20260623-daily-final` retornou itens de 2026-06-23, incluindo Prefeitura de CZS, Camara Criminal em Cruzeiro do Sul, Festival da Farinha e Mailza/Zequinha.
- Pacote social local: `.codex-temp/daily-protocol-20260623/`; 16 MP4s validos 1080x1920 H.264/AAC, mas sem `videoUrl` real na captacao do dia, portanto sao cards narrados com musica baixa.
- Instagram `@catalogo_czs_`: contador visual foi de 742 para 748 posts; 6 Reels enviados e comprovados por contador/perfil.
- Reels publicados: Festival da Farinha, servidores da Saude em CZS, Tanizio/MDB/Mailza/Vagner, meningite em CZS, PNAE Porto Walter, PF/Edir Macedo.
- Provas: `.codex-temp/daily-protocol-20260623/instagram-profile-start.png`, `instagram-profile-final.png`, `publish-proof/publish-results.json`.
- WhatsApp/Facebook nao foram declarados como feitos nesta rodada porque a ferramenta de navegador/perfil correto nao ficou disponivel neste contexto; nao inventar prova.
- Complemento apos pedido de mais volume: Instagram subiu de 748 para 757 posts; +9 Reels comprovados por contador.
- Complemento publicado: presidio/interior AC, Zequinha/TJ em CZS, Meio Ambiente em CZS, vacina Pneumo 20, familia de homem esquartejado, trafico em Sena Madureira, condenacao judicial em CZS, mortandade de bovinos em Tarauaca e tiroteio em Botafogo.
- Prova final do complemento: `.codex-temp/daily-protocol-20260623/instagram-profile-final-after-more.png`.
- Item 3 do manifest foi segurado por duplicar a pauta sensivel do item 2; nao postar sem decisao explicita.

## Rodada CZS Captação + Preview Instagram - 2026-06-18

- Captação CZS executada: 352 itens captados, 280 de hoje, 360 ativos, 480 no arquivo; lote geral `ok=true`.
- Pacote/provas: `.codex-temp/czs-captacao-instagram-preview-20260618/`.
- Reel preview pronto em `reel-preview/reel-preview-natural-logo-certa.mp4` com 1080x1920, áudio AAC, voz natural pt-BR e logo correta do arquivo enviado pelo usuário.
- Feed normal preview pronto em `feed-preview/feed-preview-4x5.png` com 1080x1350.
- Pautas escolhidas: Reel sobre troca de tiros entre guarnições da PM em Cruzeiro do Sul; feed sobre recapeamento da AC-405 entre Cruzeiro do Sul e Mâncio Lima.
- Não houve postagem Instagram, push, deploy ou exclusão. Próximo passo: usuário aprovar ou pedir ajuste visual antes de publicar.

## Rodada CZS Jornal + Instagram - 2026-06-17 logo certa

- Logo correta indicada pelo usuario: `C:\Users\junio\Downloads\ChatGPT Image 3 de jun. de 2026, 14_14_50.png`.
- Pacote/provas: `.codex-temp/czs-jornal-instagram-20260617-logo-certa/`.
- Captacao CZS local concluida: 363 itens captados, 261 de hoje, 360 ativos e 480 no arquivo; `pcac` abortou, mas o lote geral ficou `ok=true`.
- Instagram `@catalogo_czs_`: Reel correto de doacao de sangue/Hemoacre publicado; prova final em `publish-proof/profile-final.png`; contador visual 684 posts.
- Erro a corrigir somente com aprovacao explicita: um duplicado do Reel `Advogado questiona gastos da OAB Acre...` foi publicado por selecao errada da miniatura na primeira tentativa.
- ADB funcional nesta rodada: `127.0.0.1:5555`; `emulator-5554` nao deve ser assumido sem checar `adb devices`.
- Site/jornal ficou atualizado localmente, mas sem commit/push/deploy nesta etapa por causa de mudancas paralelas no workspace.

## Ponte Telegram Codex - 2026-06-17

- Bot confirmado: `@Codexjuniorcruzeirobot`.
- Ponte criada em `scripts/telegram-codex-bridge.js` e iniciada em segundo plano com `npm run telegram:codex`.
- Config local: `.env.telegram.local` (ignorado pelo Git); exemplo seguro em `.env.telegram.local.example`.
- Logs: `.codex-temp/telegram-codex-bridge/bridge.out.log` e `.codex-temp/telegram-codex-bridge/bridge.err.log`.
- Estado seguro atual: `TELEGRAM_ALLOWED_CHAT_IDS` vazio; o bot só responde `/id` até o chat_id do usuário ser colocado na allowlist.
- Próximo passo: usuário mandar `/id` no Telegram para o bot; depois preencher `TELEGRAM_ALLOWED_CHAT_IDS=<chat_id>` e reiniciar a ponte.

## Ofício Prefeitura - Projeto Integrado Expoacre Juruá 2026

- Versão corrigida endereçada ao prefeito Zequinha Lima concluída para solicitar exclusivamente o orçamento complementar de `R$ 15.000,00`.
- Usar somente `C:\Users\junio\Downloads\PACOTE_CORRIGIDO_ORCAMENTO_COMPLEMENTAR_15000\05_CADERNO_PROTOCOLAR_CORRIGIDO_COMPLEMENTAR_15000.pdf`.
- Não usar os pacotes anteriores: eles incorporavam documentos do orçamento principal.
- O PDF protocolar corrigido tem 8 páginas e não menciona `R$ 28.440,00`; estrutura, ambientes, equipamentos e operação principal estão expressamente excluídos.
- Antes de protocolar: preencher número, representante/assinatura e contato.

## Facebook Catálogo CZS criado e publicado

- O usuário autorizou explicitamente a sessão `Antonio e Rnascimento Jr.` para esta operação.
- Foi criada uma Página separada, preservando o perfil e o conteúdo pessoal.
- Página: `Catálogo CZS - Cruzeiro do Sul`.
- URL: `https://www.facebook.com/profile.php?id=61590705575363`.
- Categoria, bio, cidade, site e Instagram foram configurados.
- A apresentação institucional foi publicada e fixada.
- Quatro notícias foram publicadas com cards do site: Rio Liberdade, ruas de Cruzeiro do Sul, água em aldeias do Juruá/Purus e recursos para saúde pública.
- Pendente: upload de logo e capa, bloqueado pela permissão de acesso a URLs de arquivo da extensão Codex no Chrome.

## Active Goal

- Facebook Catálogo CZS publicado; concluir logo e capa após liberar a permissão de upload.

## Summary

Captação nova executada com 363 itens, 198 de hoje, 360 ativos e 480 no arquivo local. Site commit ca3fc8a9 enviado para main e Render catalogo-cruzeiro-web ficou live; API online validada com título corrigido e item novo de Cruzeiro do Sul. Instagram @catalogo_czs_ recebeu 6 Reels novos após gate editorial, contador 637 -> 643 e prova visual em .codex-temp/czs-reels-news-20260614-night/proof/instagram-final-refresh-after-wait.png.

## Next

- No Chrome, abrir os detalhes da extensão Codex e ativar `Permitir acesso a URLs de arquivo`.
- Aplicar `assets/facebook-profile-logo-catalogo-czs.png` e `assets/facebook-cover-safe-catalogo-czs.png`.
- Para nova rotina
- evitar repetir IDs do pacote .codex-temp/czs-reels-news-20260614-night; usar Reels preferencialmente e manter gate: noticia sem foto/card/video valido não posta no Catalogo CZS.

## Nota operacional - Headroom 2026-06-15

- Headroom `0.25.0` instalado e disponível como `headroom`.
- Codex carrega o MCP `headroom` em novas sessões; comando opt-in: `codex-headroom`.
- Hermes carrega o MCP `headroom` e possui provider opt-in `headroom-ollama`; comando: `hermes-headroom`.
- Proxy local para Ollama: `http://127.0.0.1:8788/v1`; iniciar/verificar com `headroom-ollama`.
- Não usar diretamente `headroom wrap codex` neste Windows até corrigirem os bugs de codificação/restauração de config.

## Rodada Instagram e site - 2026-06-15

- Instagram `@catalogo_czs_`: 20 posts de feed e 20 Reels publicados; provas em `.codex-temp/czs-instagram-routine-20260615/`.
- Story Norte Fibra publicado e confirmado; prova em `.codex-temp/czs-instagram-routine-20260615/norte-story/story-corrected-after-share.png`.
- Convite de colaboração enviado para `@acre.diario` em Reel noticioso e mensagens da rodada enviadas no direct.
- Site atualizado com captura de 381 itens, 269 de hoje, 360 ativos e 480 no arquivo.
- Commit `d0c8bb22` enviado para `main`; deploy Render `dep-d8o78cu8bjmc73bp0rs0` ficou live.

## Rodada Desapego CZS - 2026-06-16

- Pacote local criado em `.codex-temp/desapego-moveis-ventiladores-20260616/release/`.
- Correção aplicada: móveis/ventilador não entram no site/home do CZS.
- Ventilador antigo reaproveitado com copy segura: `para conserto ou retirada de peças`, sem promessa de funcionamento.
- Fotos reais dos móveis não foram localizadas; anúncio de móveis fica como chamada/fila de venda até confirmar fotos/valores.
- Instagram bloqueado para esta rodada por regra de classificados/objetos.
- Site CZS fica para notícias, vídeos, utilidade pública, serviços e convites editoriais; venda de objeto fica em WhatsApp grupos de venda e Facebook/Marketplace após validação.

## Rodada Reels CZS - 2026-06-17

- Rota corrigida: Instagram deve ser operado pelo BlueStacks/ADB (`emulator-5554`) quando o pedido for postar no app.
- Pacote em `.codex-temp/czs-decent-social-20260616/`.
- 3 Reels reais foram enviados no `@catalogo_czs_` pelo app Android, usando vídeos captados e legendas do pacote.
- Terceiro Reel selecionado pela miniatura de vídeo criada em 17/06/2026 6:28; após envio, o aviso `Compartilhando no Reels...` desapareceu sem erro visível.
- Site já estava atualizado online em `https://catalogo-cruzeiro-web.onrender.com` pelo commit `951034bc`.
- Limite atual do BlueStacks: apenas Instagram está instalado; Facebook/WhatsApp não aparecem como pacotes Android no emulador.

## Instagram CZS - lote 50 noticias 2026-06-19

- Rodada concluida no `@catalogo_czs_`: pacote `.codex-temp/czs-50-noticias-instagram-20260618/`.
- Foram publicados 50 posts/reels de noticias com a logo correta, narração PT-BR, música baixa, legenda, hashtags, convite para site/grupo WhatsApp e chamada Norte Ultra Fibra.
- Contagem comprovada: 685 -> 735 posts.
- Prova: `.codex-temp/czs-50-noticias-instagram-20260618/publish-proof/profile-final-after-50.png`.
- ADB funcional nesta rodada: `127.0.0.1:5555`.

## Proposta de financiamento CZS - Deputado Ze Adriano 2026-06-24

- Documento final para impressao entregue em `C:\Users\junio\Downloads\proposta-financiamento-catalogo-czs-deputado-ze-adriano-2026-06-24.pdf`.
- Copia HTML editavel em `C:\Users\junio\Downloads\proposta-financiamento-catalogo-czs-deputado-ze-adriano-2026-06-24.html`.
- Copias no repo em `output/propostas/proposta-financiamento-catalogo-czs-deputado-ze-adriano-2026-06-24.pdf` e `.html`; versao analitica sobrescrita com o mesmo conteudo final.
- Orçamento final: `R$ 13.000,00`, sendo `R$ 10.000,00` para nucleo operacional, programacao e poder computacional, mais `R$ 3.000,00 adicionais` para logistica de crescimento rapido.
- Documento usa `712 mil visualizacoes em 14 dias`, inclui organograma logico do jornal, plano de monetizacao por banners/flyers/ads, registros visuais do site desktop/mobile e Instagram.
- Versao final revisada inclui pagina propria de assinaturas com `Junior Clovis Sampaio` como programador/criador e campo para `Deputado Ze Adriano ou responsavel pelo recebimento`.
- Validacao final: PDF com 11 paginas; termos removidos: `Contato impresso`, `Canal`, `Periodo`, `wa.me`, `improviso`, `padronizar`, `prototipo`, `Pedido direto`, `Documento final`, `views`, `print de erro`, `Contrapartida institucional prevista`.
- Render visual final: `.codex-temp/proposta-ze-adriano-render-final-monetizacao/contact-sheet.png`.

## Proposta financiamento CZS - piloto ampliado 2026-06-25

- Nova versao ampliada entregue no repo: `output/propostas/proposta-financiamento-catalogo-czs-deputado-ze-adriano-piloto-leitura-ampliado-2026-06-25.pdf`.
- HTML navegavel correspondente: `output/propostas/proposta-financiamento-catalogo-czs-deputado-ze-adriano-piloto-leitura-ampliado-2026-06-25.html`.
- Conteudo atualizado conforme ordem do usuario: tracao atual tratada como quase `1,6 milhao` de visualizacoes informadas, varios virais, alcance composto por Instagram/site/WhatsApp/Facebook/banners/flyers/ads/parceiros, tecnologias usadas, prints limpos do jornal web desktop/mobile e materias virais.
- Orcamento corrigido: `R$ 10.000,00` exclusivamente para computador e poder computacional; `R$ 3.000,00 adicionais` para impulsao, logistica de crescimento e materias autorais.
- PDF final gerado via ReportLab por bloqueio do Chrome/Crashpad no sandbox; validacao textual com `pypdf`: 14 paginas, termos obrigatorios presentes e termos proibidos ausentes.
- Previa visual dos prints usados: `.codex-temp/proposta-ampliada-render/assets-contact-sheet.jpg`.

## Proposta financiamento CZS - v2 corrigida 2026-06-25

- Versao correta apos critica do usuario: `output/propostas/proposta-financiamento-catalogo-czs-deputado-ze-adriano-v2-2026-06-25.pdf`.
- HTML limpo sem base64/codigo de imagem: `output/propostas/proposta-financiamento-catalogo-czs-deputado-ze-adriano-v2-2026-06-25.html`.
- Pasta de imagens referenciadas pelo HTML: `output/propostas/proposta-ze-adriano-v2-assets/`.
- Melhorias: texto mais contextual, graficos proprios de orcamento/alcance/funil, prints limpos do jornal desktop/mobile, cards reais do pacote de noticias e remocao de prints ruins.
- Validacao: PDF com 11 paginas; HTML sem `data:image`/`base64`; termos obrigatorios presentes e proibidos ausentes.
- Correcao posterior: o PDF foi regenerado apos bug do ReportLab que imprimia `Paragraph(...)` no lugar de fotos/legendas. A funcao de tabela agora preserva imagens/Paragraphs como Flowables; validacao confirmou ausencia de `Paragraph(`, `ParaFrag`, `Image(` e `caseSensitive` no texto extraido.
- Atualizacao visual final: adicionada capa profissional em `output/propostas/proposta-ze-adriano-v2-assets/capa-profissional.png`, pagina de identidade/marcas, mais fotos mobile e Instagram, layout mais institucional. PDF final v2 agora tem 14 paginas e validacao sem codigo/base64/termos proibidos.

## Proposta financiamento CZS - v3 atualizada 2026-06-26

- Versao atual apos nova metrica informada pelo usuario: `output/propostas/proposta-financiamento-catalogo-czs-deputado-ze-adriano-v3-2026-06-26.pdf`.
- HTML correspondente: `output/propostas/proposta-financiamento-catalogo-czs-deputado-ze-adriano-v3-2026-06-26.html`.
- Pasta de assets: `output/propostas/proposta-ze-adriano-v3-assets/`.
- Metricas atualizadas no documento: `11,6 milhoes de visualizacoes em 17 dias`, perfil perto de `4 mil seguidores`, rotina de Reels na casa de `1 mil visualizacoes por publicacao`.
- Validacao: PDF 14 paginas; sem `Paragraph(`, `ParaFrag`, `Image(`, `caseSensitive`; HTML sem `data:image`/`base64`; termos proibidos ausentes.

## Proposta CZS - deputado federal v4 2026-06-26

- Versao atual para apresentar a deputado federal: `output/propostas/proposta-catalogo-czs-deputado-federal-v4-2026-06-26.pdf`.
- HTML navegavel correspondente: `output/propostas/proposta-catalogo-czs-deputado-federal-v4-2026-06-26.html`.
- Pasta de assets/imagens: `output/propostas/proposta-deputado-federal-v4-assets/`.
- Documento reposicionado para adocao/financiamento parlamentar: numeros fortes, previsoes de crescimento, exemplos de postagens do deputado, linguagem visual, graficos em barra/pizza, diagrama do layout do jornal, prints desktop/mobile/Instagram e plano de 90 dias.
- Orcamento separado conforme ordem do usuario: `R$ 10.000,00` para computador/poder computacional; `R$ 3.000,00 adicionais` para impulsao, logistica e producao autoral de materias solicitadas pelo parlamentar, equipe ou aliados adjacentes.
- Validacao final: PDF 8 paginas; sem `Paragraph(`, `ParaFrag`, `Image(`, `caseSensitive`; HTML sem `data:image`/`base64`; termos proibidos ausentes (`wa.me`, `improviso`, `padronizar`, `prototipo`, numeros antigos).
- Render visual final: `.codex-temp/proposta-deputado-federal-v4-pages.jpg`.
- Correcao posterior: documento regenerado com 11 paginas para evitar titulo orfao/quebra feia como secao sozinha no fim de pagina; adicionados `CondPageBreak` e quadros de preenchimento util.
- Secao de prints foi ajustada para `Prints de maior tracao e exemplos prontos`, usando assets `viral-cadela.png`, `viral-meningite.png`, `viral-rapadura.png` e cards editoriais. Validacao manteve ausencia de codigo vazado e termos proibidos.
- Correcao posterior 2: removida linguagem de "deveria adotar"/"adocao"/"justa e boa"; documento passou a usar termos tecnicos como `parceria estrategica`, `financiamento tecnico`, `cooperacao tecnica`, `contrapartida institucional`, `prestacao de contas verificavel`.
- Prints com banco/bloco branco foram retirados da secao de evidencias. A pagina 9 agora usa somente grade Instagram, Reels e cards com conteudo grafico carregado.
- Correcao posterior 3: imagens repetidas foram redistribuidas por secao. Secao 4 usa grafico de postagem + funil; secao 6 usa prints do jornal; secao 7 usa Instagram/Reels; secao 8 usa matriz visual + demos mobile; secao 9 usa grade de volume, banner institucional e cards editoriais. Validacao final manteve PDF 11 paginas sem termos proibidos/codigo vazado.
- Correcao posterior 4: capa deixou de repetir prints do miolo e virou arquitetura de entrega/comprovacao. Secao 6 virou painel proprio `jornal-funcoes-board.png`; secao 8 virou painel `linguagem-coop-board.png`; secao 9 separada em blocos para evitar celulas vazias. Miolo sem repeticao direta de arquivos IMG e sem prints semi-carregados.
- Correcao posterior 5: metrica corrigida conforme usuario: Reels ficam na faixa de `10 mil a 300 mil` visualizacoes; Stories/engajamento ficam na casa de `1 mil`. Removidas frases antigas `1 mil visualizacoes por Reel` e `Reels na casa de 1 mil`.

## Site CZS - captura 2026-06-26

- Site atualizado com captura do dia 2026-06-26: 383 itens capturados, 197 de hoje, 360 ativos e 480 no arquivo.
- Commit publicado em `main`: `6d95779b19182f7691c5a54160e17eea47346f91`.
- Render deploy `dep-d8v7ggd7vvec73erk4b0` ficou live.
- Validacao publica confirmou no `news-data.js` e API: morte de Ana Flavia, MPF/abastecimento, Mailza, Expoacre Jurua e acidente em Cruzeiro do Sul.

## Instagram CZS - rodada matinal 2026-06-26

- Pacote de noticias/reels criado em `.codex-temp/daily-protocol-20260626/`.
- Logo oficial usada: `assets/brand/catalogo-czs-logo-official-crops-20260603/catalogo-czs-horizontal-real-alpha-20260603.png`.
- Publicados 7 Reels no `@catalogo_czs_` via BlueStacks/ADB `127.0.0.1:5555`: indices 1, 3, 6, 8, 9, 11 e 12 do manifesto.
- Contagem comprovada no perfil: 789 posts antes da rodada, 796 posts depois da rodada.
- Provas principais: `.codex-temp/daily-protocol-20260626/review-contact-sheet.jpg`, `.codex-temp/daily-protocol-20260626/publish-proof/publish-results.json`, `.codex-temp/daily-protocol-20260626/publish-proof/publish-results-fast.json` e `.codex-temp/daily-protocol-20260626/publish-proof/final-profile-after-fast.png`.
- Observacao operacional: a primeira automacao travou na leitura XML/contador depois do item 8; a rota rapida `post_reels_fast.py` concluiu os itens 9, 11 e 12 sem depender de XML.

## Videos polemicos CZS - filtro e pacote 2026-06-26

- Pasta de videos baixados: `C:\Users\junio\Desktop\videos-polemicos-acre-2026-06-26`.
- Pasta de versoes com logo/tipagem CZS: `C:\Users\junio\Desktop\videos-polemicos-acre-2026-06-26\com-logo-czs`.
- Relatorio completo: `C:\Users\junio\Desktop\videos-polemicos-acre-2026-06-26\RELATORIO-VIDEOS-POLEMICOS-CZS-2026-06-26.md`.
- Foram validados 6 MP4 CZS em 1080x1920, H.264/AAC, com audio preservado: empresaria/loja, audio loja quebrada, flagra viral, briga em casa de shows, carro incendiado e roubo loja celulares.
- Filtro/agente atualizado em `docs/CZS_REAL_VIDEO_REELS_AGENT_PROMPT.md`: buscar origem limpa; se nao houver, aplicar logo/tipagem CZS e fonte; gerar MP4 WhatsApp/Reels; validar com `ffprobe`; registrar origem/status.
- Treino curto criado em `docs/social/czs-reels-video-polemico-training-2026-06-26.md`.
