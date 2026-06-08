# Codex Memory - Estado Vivo

Atualizado: 2026-06-08

## Rodada Atual - 20260608-pubpaid-turn-avatar-audio-cleanup

- PubPaid 2.0 recebeu ajuste pontual no HUD dos jogos: o botao visual de som foi removido de `pubpaid.html`; as mensagens de entrada agora orientam ajustar pelo volume do aparelho.
- Textos `Movimento feito...` foram retirados da Damas/Xadrez; no Xadrez compacto o chip de turno agora mostra avatar/foto do jogador da vez, e na Damas o cabecalho ganhou badge de turno com foto/inicial do jogador ativo.
- Arquivos tocados: `pubpaid.html`, `pubpaid-phaser/app.js`, `pubpaid-phaser/scenes/BootScene.js`, `pubpaid-phaser/ui/domGameInterface.js`, `pubpaid-phaser.css`.
- Validacao local: `node --check` em `app.js`, `domGameInterface.js` e `BootScene.js`; `npm run guard:pubpaid`; `git diff --check` nos arquivos tocados; varredura `rg` sem `Movimento feito`, `Som ligado`, `Ligar som` ou `Som 32-bit`.
- Validacao visual Playwright em 844x390: Xadrez com chip de turno + avatar visivel; Damas pos-moeda com badge `CLOVIS` e foto aplicada; sem botao de som e sem texto de movimento. Evidencias em `.codex-temp/pubpaid-turn-avatar-visual/` e smoke do cliente de jogo em `.codex-temp/pubpaid-turn-avatar-web-game-client/`. Os 401 vistos no console vieram do usuario fake do modo review, nao do render do jogo.

## Rodada Atual - 20260608-cheffe-building-premium-v9

- `cheffe-building.html` passou a ser a previa local do predio Cheffe Call: vitrine publica, terminal, apoio simbolico e modo admin preservados.
- Usuario rejeitou a proposta anterior como feia; CSS foi refeito para conversar com o CZS principal, com branco/azul/amarelo, logo oficial e andares com imagens reais dos escritorios/cheffe call.
- Arquivos em foco: `cheffe-building.html`, `cheffe-building.css`, `cheffe-building.js`, `docs/cheffe-call-building-proposal.md`.
- Link local de avaliacao: `http://localhost:3001/cheffe-building.html?fresh=20260608-v9c`.
- Validacao local feita: `node --check cheffe-building.js`, `git diff --check -- cheffe-building.html cheffe-building.css`, HTTP 200 local. Capturas em `.codex-temp/cheffe-building-v9b/` e `.codex-temp/cheffe-building-v9c/`.
- Antes de deploy, confirmar no navegador real do usuario; Chrome headless mostrou escala mobile estranha, entao nao tratar a captura mobile como prova final.

## Rodada Atual - 20260608-whatsapp-twilio-sandbox-bot

- Prototipo local criado para conectar WhatsApp Sandbox da Twilio a IA do projeto sem mexer no `server.js` principal.
- Arquivo principal: `scripts/whatsapp-twilio-bot.js`; comando: `npm run whatsapp:twilio`; webhook padrao: `http://localhost:3099/whatsapp`.
- Guia de configuracao: `docs/whatsapp-twilio-bot.md`.
- O bot usa `OPENAI_API_KEY` quando existir; se nao houver, tenta Ollama local com `TWILIO_WHATSAPP_OLLAMA_MODEL` ou `qwen2.5:3b`.
- Validacao local feita em porta temporaria 3199: `/health` OK e POST form-urlencoded estilo Twilio retornou TwiML 200 com resposta via Ollama.
- `ngrok` nao estava instalado; `cloudflared` foi instalado via `winget` e abriu tunel rapido validado com POST externo.
- Estado vivo do tunel fica em `.codex-temp/whatsapp-twilio-bot/runtime.json`; URL temporaria atual: `https://reasons-cut-mesh-subscription.trycloudflare.com/whatsapp`.
- Proximo passo real: configurar no Twilio Sandbox `When a message comes in` para a URL temporaria `/whatsapp` e entrar no sandbox pelo codigo `join`.

## Rodada Atual - 20260608-obsidian-ai-local-stack

- Usuario vai baixar Obsidian e pediu conectar o segundo cerebro com LLMs/ferramentas de IA para economizar contexto/API.
- Vault preparado em `.codex-memory/brain` com `.obsidian/` configurado; abrir essa pasta como vault no Obsidian.
- Plugins baixados no vault: `obsidian-local-rest-api`, `smart-connections`, `ollama` e `copilot`; community plugins list ja aponta para esses IDs.
- Ollama local validado: `scripts/obsidian-ollama-note.ps1` leu `.codex-memory/brain/resources/graphify-economia.md` com `qwen2.5:3b` e respondeu corretamente.
- `nomic-embed-text:latest` instalado para embeddings locais; modelos disponiveis confirmados incluem `qwen2.5:3b`, `qwen2.5-coder:3b`, `gemma4:12b`, `qwen3:4b`, `gemma3:4b`, `gemma3:1b` e `llama3.2:3b`.
- Scripts criados: `scripts/setup-obsidian-ai.ps1` reinstala/atualiza o vault e plugins; `scripts/obsidian-ollama-note.ps1` consulta notas via Ollama sem API paga.
- Automacao `resumo-economia-graphify` foi removida apos cumprimento do objetivo.

## Rodada Atual - 20260607-graphify-segundo-cerebro

- Graphify adotado como apoio economico, nao como rotina pesada: padrao local e AST-only, sem LLM, via `scripts/graphify-lite.ps1 <arquivo-ou-pasta>`.
- Validacao em `cheffe-building.js`: `.codex-temp/graphify-lite-validation/graphify-out/GRAPH_REPORT.md` gerou 11 nos, 17 arestas e 3 comunidades; pasta temporaria de input foi limpa.
- Segundo cerebro persistente estilo Obsidian criado em `.codex-memory/brain/`, com nota principal `.codex-memory/brain/resources/graphify-economia.md`.
- Instrucoes atualizadas para Codex/AGENTS, Cursor, Copilot e Hermes: nao rodar `/graphify .`, `graphify extract .`, `graphify update .`, `--mode deep`, `--watch` ou extracao semantica ampla sem pedido explicito.
- Automacao `resumo-economia-graphify` criada para 2026-06-08 de manha, pedindo resumo curto da economia real/estimada.

## Rodada Atual - 20260607-whatsapp-facebook-clovis-social

- Perfil obrigatorio para social confirmado e usado: Clovis Sampaio / Chrome Default / `juniorclovissampaio@gmail.com`. Nao abrir outros perfis para WhatsApp/Facebook.
- Browser/Chrome extension ficou operacional via extensao Codex `hehggadaopoacecdllhhajmbjkdcmajg` e host nativo `com.openai.codexextension`.
- WhatsApp enviado em texto/legenda completa: `vendas 24 horas online.R. Alves`, `VENDAS E ALUGUEL! CZS`, `03 POSTAR QUE VENDE LOGO CZS` e `GRUPO DE DESAPEGO` receberam 21 legendas CZS cada; `Catálogo CZS` recebeu 34 itens, 24 noticias + servicos/convites.
- `VENDE-SE TUDO EM CZS` nao apareceu na busca do WhatsApp nesta rodada.
- Facebook: post geral de perfil publicado com CZS + Inova + contatos/site/Instagram; compartilhado em `VENDA TUDO CRUZEIRO DO SUL`. Continuar depois pelo permalink do post para outros grupos.
- Limite tecnico: upload/colagem de imagem no WhatsApp nao ficou disponivel no Browser runtime (`setInputFiles` ausente; clipboard de imagem nao abriu preview). Rodada saiu sem artes, apenas legendas completas.

## Rodada Atual - 20260606-facebook-client-acquisition-routine

- Rotina dedicada ao Facebook iniciada para captacao de clientes do Catálogo CZS/CZS: criativos premium, perfil primeiro, depois compartilhamento em grupos validados do Vale do Jurua/Cruzeiro do Sul.
- Pacote visual/copy navegavel criado em `.codex-temp/facebook-client-acquisition-20260605/index.html`, com criativos em `.codex-temp/facebook-client-acquisition-20260605/creatives/` e legendas `.txt`.
- Post 1 confirmado no perfil: `https://www.facebook.com/photo/?fbid=982961928049864&set=a.123931713952894`; compartilhado e verificado no grupo `Bazar do Desapego` pelo permalink `https://www.facebook.com/groups/2024957284396145/?multi_permalinks=5370423663182807`.
- Post 2 confirmado no perfil: `https://www.facebook.com/photo/?fbid=983076738038383&set=a.123931713952894`, com criativo `publis-vitrine-facebook-feed.jpg` e legenda comercial de publis/servicos.
- Tentativa de compartilhar o post 2 em `VENDA TUDO CRUZEIRO DO SUL` foi enviada pelo compositor, mas a verificacao em `my_pending_content` e `my_posted_content` nao encontrou texto/ID/permalink; registrar como tentativa sem link confirmado, nao como publicado.
- Parte de convites concluida: post de convite confirmado no perfil com Instagram, grupo do WhatsApp, site e contato comercial em `https://www.facebook.com/photo/?fbid=983368308009226&set=a.123931713952894`.
- Convite compartilhado e verificado em `Publicados` no grupo `JURUÁ NEGÓCIOS E VENDAS TUDO`: `https://www.facebook.com/groups/471993862967796/?multi_permalinks=3578383208995497`.
- Excecao autorizada pelo usuario em 2026-06-06: no Facebook, pode quebrar a separacao anterior e enviar convite/comercial tambem para grupos de venda e grupos de noticia/midia, mantendo bloqueio para Messenger/conversas individuais.
- Apos a excecao, convite tambem foi compartilhado e verificado em `Publicados` no grupo `MÍDIA DIGITAL`: `https://www.facebook.com/groups/1937056146594911/?multi_permalinks=4008842449416260`.
- Marketplace foi checado em `https://www.facebook.com/marketplace/create/`; a UI apresentou apenas `Item para venda`, `Veículo` e `Imóvel`, sem categoria de servico/convite adequada. Nao publicar servico como item fisico sem instrucao/preco/categoria aceitavel.
- Lote pedido de 30+ grupos concluido em 2026-06-06: convite enviado/efetivado em 31 destinos do Facebook, incluindo grupos de Cruzeiro do Sul, CZS, Juruá, Mâncio Lima, Feijó, Rodrigues Alves, Porto Walter e Marechal Thaumaturgo. Contagem operacional: 2 verificados antes, 24 `submitted` nesta rodada e 5 `submitted_timeout_unverified` do bloco que estourou tempo apos submissao; 9 destinos falharam por UI/compositor/busca.
- Aprendizado operacional: postar imagem JPG no perfil via compositor, anexar imagem primeiro, colar legenda, clicar `Avancar`, depois clicar o `Postar` real do dialogo; em seguida usar menu `Compartilhar` -> `Grupo`. Evitar Messenger/chats individuais e Marketplace para servicos sem preco/categoria adequada.

## Rodada Atual - 20260606-v8-raiane-motion-compact-v54

- Cache-bust atualizado para `20260606-v8-raiane-motion-compact-v54` em `index.html` e `assets/v8-final/v8-merge-ready.js`.
- Chatbot RAIane ficou mais enxuto: FAQ publico reduzido de 11 para 6 escolhas (`Anunciar`, `Enviar pauta`, `Arquivo`, `Serviços`, `PubPaid`, `Humano`) e atalhos rapidos reduzidos para 3.
- Respostas fixas do chatbot foram encurtadas para orientacao direta e sem audio; `ASSISTANT_HELPER_VOICE_ENABLED` segue desligado.
- CSS final adicionou palco com movimento real: avatar desloca/oscila por pose, sombra viaja e balao flutua, preservando o minimizado como janela de rosto.
- Validacao local em `http://localhost:3001/?skipIntro=1&qa=raiane-v54&fresh=20260606-v54`: desktop com `faqCount=6`, `actionCount=3`, `avatarAnimation=ayllaGuideStep`, `cardWidth=300px`, sem overflow; mobile 390px com `cardWidth=292px`, FAQ em 2 colunas e sem overflow.
- Evidencia local: `.codex-temp/raiane-v54-mobile.png`.
- Complemento v56: cache-bust atualizado para `20260606-v8-layout-whatsapp-v56`; a pagina agora limita o miolo a 1320px e centraliza em janela comum, corrigindo o desalinhamento visto fora da tela cheia.
- O fluxo `Humano` da RAIane passou a mostrar link visivel com numero: `WhatsApp CZS: (68) 9602-6649` e `Chamar no WhatsApp: (68) 9602-6649`, ambos apontando para `wa.me/556896026649`.
- Validacao local v56 em janela 1432px: `.page` com `x=48`, `maxWidth=1320px`, sem overflow; chatbot com `faqCount=6`, links WhatsApp visiveis e animacao ativa.
- Complemento v58: autoridade antiga `--v8-wide-wrap` reduzia/expandia a home de forma conflitante; consolidado para 1320px com `.page`/`.tech-sky > .page` centralizados e padding lateral zerado no shell principal.
- Hero responsiva validada localmente em 1440, 1180, 900 e 390px com CSS `20260606-v8-hero-centered-v58`, sem overflow horizontal; em 900px a `.v8-live-hero` passa a uma coluna para evitar espremimento.
- Correção posterior v59 restaurou o canvas editorial amplo para 1920px após o limite de 1320px deixar o portal pequeno em monitores largos.
- Rodada v60 ampliou o teto do portal em 20%, de 1920px para 2304px, mantendo o limite da janela e a centralização.
- A camada pública de Escritórios/Agentes ficou temporariamente offline: oito vitrines visuais com backgrounds e personagens preservados, todas marcadas `Em breve`, renderizadas como `article` sem `href` ou comando público.
- Variações adicionadas ao Cheffe Call: Auditório, Reunião e Palco Sul. IDs diretos: `escritorio-raiane`, `escritorio-nerd`, `cheffe-call-auditorio`, `cheffe-call-reuniao`, `cheffe-call-palco-sul`, `escritorio-pubpaid`, `escritorio-comunidade`, `escritorio-visual`.

## Rodada Atual - 20260605-instagram-feed-cycle-79-100-final

- Ciclo pendente do feed Instagram `@catalogo_czs_` fechado: itens 81-100 publicados; itens 79-80 ja estavam publicados antes desta retomada.
- Contador confirmado subindo de 325 para 345 posts no perfil.
- Cards regenerados/corrigidos para area segura: logo pequena dentro do hero, sem placa branca, evitando topo/cantos que o Instagram corta ou cobre.
- Perfil limpo para exibir apenas `www.catalogo-cruzeiro-web.onrender.com` como link principal.
- Fluxo final: JPG 4:5 no Feed, ajuste de proporcao no compositor, audio `Breaking News` quando aceito, legenda com resumo e `Link original`, entrada por ADBKeyboard/base64 UTF-8.
- Script de apoio criado em `.codex-temp/instagram-feed-run-20260604/delivery/publish-feed-safe.ps1`; rodar em blocos curtos e conferir contador.
- Observacao operacional: UIAutomator pode falhar com `null root`; nesses casos conferir screenshot do perfil antes de repetir, pois os itens 95 e 98 publicaram mesmo com falha de leitura XML.

## Rodada Atual - 20260605-v8-three-news-actions-v34

- Correcao solicitada: cards de materia agora exibem somente tres acoes publicas: `Compartilhar`, `Ler` e `Informar erro`.
- Removido o botao `Salvar`, a persistencia local `SAVED_STORIES_KEY`, o handler `.saveBtn` e a regra CSS `.saveBtn.is-saved`.
- Removida a injecao automatica do mini botao `Revisao` em `.news-card`; revisao editorial continua restrita aos fluxos apropriados do leitor/Cheffe.
- Cache-bust atualizado para `20260605-v8-public-corrective-pass-v34`.
- Validacao local em `http://127.0.0.1:3001/?skipIntro=1`: Chromium contou 476 cards, `saveButtons=0`, `reviewMiniButtons=0`, sem texto Salvar/Salvo, `wrongCount=[]` e `wrongSet=[]`.
- Deploy: commit `09fdead4` enviado para `origin/main`; Render `catalogo-cruzeiro-web` ficou `live`; online serviu v34 e a checagem DOM online repetiu 476 cards com exatamente as tres acoes.

## Rodada Atual - 20260605-gemma4-local-ai-support

- `gemma4:12b` foi confirmado/atualizado no Ollama (`ollama pull` OK; `ollama show` indica Gemma4 11.9B, contexto 262144, tools/vision/audio).
- `.env.local` agora aponta o CZS local para `CZS_OLLAMA_MODEL=gemma4:12b` e `CZS_OLLAMA_TIMEOUT_MS=90000`; `.env.example` e `server.js` acompanham o teto de 90s.
- `server.js` reduziu o contexto enviado pela RAIane ao Ollama para evitar timeout com Gemma4; smokes temporarios mostraram RAIane, Escritórios e Cheffe Call com `provider=ollama`, `status=online`, `model=gemma4:12b`.
- Hermes recebeu `gemma4:12b` nos configs `C:\Users\junio\AppData\Local\hermes\config.yaml` e `C:\Users\junio\.hermes\config.yaml` com backups `*.backup-gemma4-20260605-121238.yaml`; o Hermes principal continua `openai-codex/gpt-5.5` e Gemma entra como worker/local route.
- `scripts/hermes-continuity-router.js` agora testa `gemma4-12b`; relatório local marcou Gemma4 OK em ~20.5s, atrás de Llama/Qwen em velocidade mas saudável como apoio pesado.
- RayX passou a preferir `gemma4:12b` quando disponível e chama Ollama com `think:false`/limite de resposta; smoke `rayx mission` retornou resposta local Ollama com Gemma4.
- Codex App foi configurado pelo `ollama launch codex-app --model gemma4:12b --config -y`; para restaurar o perfil normal, usar `ollama launch codex-app --restore`.
- OpenCode e Qwen não responderam bem: OpenCode não reconheceu provider Ollama direto e via `ollama launch opencode` estourou timeout; Qwen via endpoint OpenAI-compatible estourou 240s. Codex CLI foi atualizado para 0.137.0, mas com Gemma4 local saiu sem resposta visível no smoke.

## Rodada Atual - 20260605-v8-helper-voice-watermark-v33

- Correcao pontual pos-deploy: cache-bust atualizado para `20260605-v8-public-corrective-pass-v33` em `index.html`.
- Audio do chatbot/helper RAIane desligado no front com `ASSISTANT_HELPER_VOICE_ENABLED = false`; chamadas de voz agora cancelam/retornam sem acionar `speechSynthesis.speak`.
- Intro manteve video/audio de boas-vindas; apenas recebeu selo circular branco/dourado solido no canto inferior direito para cobrir a marca "Dola AI" sem remover a logo do CZS nem recortar o video.
- Validacao local em `http://127.0.0.1:3001/?forceIntro=1`: video pronto 480x480, `muted=false`, `volume=1`, `audibleProof=true`, loader encerrando, logo visivel e sem erros de console.
- Deploy: commit `7e262a8a` enviado para `origin/main`; Render `catalogo-cruzeiro-web` ficou `live`; online respondeu HTML/JS/CSS v33, helper voice off e audit online confirmou intro com audio audivel e sem erros de console.
- URL online de prova: `https://catalogo-cruzeiro-web.onrender.com/?forceIntro=1`.

## Rodada Atual - 20260605-v8-final-speed-hydration-v32

- Fechamento local V8 apos aprovacao do fluxo principal: cache-bust atualizado para `20260605-v8-public-corrective-pass-v32`.
- Hidratação ficou mais leve: refresh de cache só limpa em troca de versão, preload inicial reduzido, superfícies abaixo da dobra entram por fila ociosa e imagens V8 ganharam `decoding="async"`/`fetchpriority` para reduzir disputa com a intro.
- Cards de licitação passaram a renderizar lista útil com processo, órgão, data e objeto extraído do texto narrado/caption quando a notícia é de pregão, CP ou aviso de licitação.
- Popup comercial direto validado em `http://127.0.0.1:3001/?skipIntro=1&forcePopup=1`: RAIane aparece inteira sobre a janela, CTA comercial e cards de serviços seguem funcionais.
- Intro validada localmente em Chromium em `http://127.0.0.1:3001/?forceIntro=1`: botão `Clique para iniciar`, vídeo 480x480, `muted=false`, `volume=1`, `audibleProof=true`, áudio decodificado e loader encerrando com logo visível.
- Evidências locais salvas em `output/v31-final-audit/`: `home-skip-intro.png`, `popup-raiane.png`, `intro-ready.png`, `intro-playing.png`, `after-intro.png`.
- Validações: `node --check assets/v8-final/v8-merge-ready.js`, `node --check script.js`, `git diff --check` nos arquivos tocados, `npm run review:team`, `npm run perf:budget`, `npm run codex:health`.
- Deploy: commit `b560bd30` enviado para `origin/main`; Render `catalogo-cruzeiro-web` ficou `live` e o online respondeu com HTML v32, JS v32 e MP4 da intro HTTP 200. Auditoria online clicou a intro com `audibleProof=true` e sem erros de console.
- Observação real de performance: `perf:budget` segue OK em modo não estrito, mas `index.html` continua acima do teto antigo; refatorar HTML inicial para arquivo menor fica como etapa futura, sem bloquear o deploy desta rodada.
- Próxima etapa de IA online: Render só acessará a IA do PC se houver túnel/host seguro para o Ollama/local runner; `127.0.0.1` no Render continua sendo o container do Render.

## Rodada Atual - 20260605-v8-intro-click-video-original-v28

- Intro V8 ajustada conforme feedback final do usuario: a logo permanece visivel, a barra chega a 100% primeiro, so depois aparece a janela do video em proporcao original, sem mascara/zoom/corte.
- O aviso virou botao real "Clique para iniciar"; o video nao tenta tocar automaticamente antes do clique.
- O MP4 usado e `assets/intro/czs-loader-video-welcome-voice-20260605.mp4`, com video 480x480 e audio AAC embutido do OGG enviado pelo usuario.
- Validacao local em `http://127.0.0.1:3001/?forceIntro=1`: antes do clique `progress=100`, `stage=video`, `paused=true`, `muted=false`, `volume=1`, logo visivel e `object-fit=contain`.
- Depois do clique: `paused=false`, `currentTime>1.7`, `audioTrackCount=1`, `webkitAudioDecodedByteCount>36000`, `audibleProof=true`; no final `loaderHidden=true`, `htmlClass=czs-intro-release` e site visivel.
- Evidencias temporarias: `C:\Users\junio\AppData\Local\Temp\czs-intro-v28-proof-final\01-before-click.png`, `02-playing.png`, `03-after-intro.png`.

## Rodada Atual - 20260604-ollama-local-first-ai1

- RAIane, Escritórios e Cheffe Call voltaram para IA local/Ollama como caminho principal.
- `callCatalogAi` agora tenta Ollama primeiro; OpenAI só entra se `CZS_AI_PRIMARY=openai` ou se `CZS_OPENAI_FALLBACK_ENABLED=true`.
- `server.js` deixou de herdar `OLLAMA_MODEL` genérico; o CZS usa `CZS_OLLAMA_MODEL` ou padrão `qwen2.5:3b`.
- `.env.local` configurado para este PC: `CZS_AI_PRIMARY=ollama`, `CZS_OPENAI_FALLBACK_ENABLED=false`, `OLLAMA_BASE_URL=http://127.0.0.1:11434`, `CZS_OLLAMA_MODEL=qwen2.5:3b`.
- `.env.example` documenta o modo local-first.
- Validação: Ollama API local respondeu com 7 modelos; smoke dos endpoints `/api/rayl/chat`, `/api/office-ai/chat` e `/api/cheffe-call/ai` retornou `provider=ollama`, `status=online`, `model=qwen2.5:3b`.
- Regra real para online: Render só acessa a IA do PC se `OLLAMA_BASE_URL` apontar para um túnel/hostname acessível; `127.0.0.1` no Render é o container, não o PC.

## Rodada Atual - 20260604-openai-direct-ai1

- RAIane, Escritórios e Cheffe Call foram ligados ao backend OpenAI direto em `server.js`.
- O servidor agora tenta OpenAI primeiro via Responses API e cai para Ollama local quando a nuvem falha.
- Variáveis novas documentadas em `.env.example`: `OPENAI_API_KEY`, `CZS_OPENAI_BASE_URL`, `CZS_OPENAI_MODEL`, `CZS_OPENAI_TIMEOUT_MS`, além dos fallbacks Ollama.
- Blindagem aplicada: o CZS ignora `OPENAI_MODEL` e `OPENAI_BASE_URL` genéricos para não herdar rotas locais como `http://localhost:11434/v1`; usa apenas `CZS_OPENAI_MODEL` e `CZS_OPENAI_BASE_URL`.
- Validação local: `node --check server.js` e `git diff --check -- server.js .env.example` OK; smoke dos 3 endpoints bateu no endpoint oficial OpenAI.
- Pendência real: a chave OpenAI autenticou, mas retornou `quota exceeded`; precisa saldo/billing/limite ativo no painel OpenAI para a IA responder online.

## Rodada Atual - 20260604-v8-intro-pt-guard-v1

- Rodada emergencial da intro local/V8 concluida apos relato de resposta sem nexo/em ingles no site.
- Servidor agora filtra respostas de IA publica com `sanitizeLocalAiAnswer`/`isUnsafeLocalAiAnswer`: remove `<think>`, rejeita padroes em ingles/raciocinio interno e cai para fallback seguro em portugues.
- Front V8 recebeu `cleanPublicAiText`, cache-bust `20260604-v8-intro-pt-guard-v1` e copys publicas da RAIane/escritorios/Cheffe travadas em portugues.
- URL local saudavel para revisar a intro: `http://127.0.0.1:8790/?forceIntro=1`; a porta `3000` nao respondeu HTTP nesta rodada.
- Validacao: `node --check server.js`, `node --check assets/v8-final/v8-merge-ready.js`, `git diff --check`, `npm run guard:pubpaid`, `npm run review:team`, `npm run codex:health`, `npm run editorial:health`, `npm run perf:budget` e Edge/Playwright em desktop/mobile.
- Evidencias: `.codex-temp/czs-v8-intro-qa-20260604/report.json`, `desktop-intro.png`, `desktop-after-intro.png`, `desktop-rayl-open.png`, `mobile-first-fold.png` e `api-ai-pt-guard.json`.
- Pendencias gerais fora da intro: `index.html` acima do budget, 72 P0 editoriais exigindo aprovacao/fonte/visual antes de destaque e abas fixas comerciais/rodape disputando espaco no mobile.

## Rodada Atual - 20260604-instagram-feeds-stories

- Rodada emergencial Instagram concluída para `@catalogo_czs_` via Instagram Android/BlueStacks, após captura atualizada com 297 itens e 106 notícias/serviços de hoje.
- Publicados 13 stories e 6 feeds no total desta sequência; primeira leva fechou em 219 posts e a continuação confirmou o perfil em 222 posts com story ativo.
- Os feeds 02 e 03 foram recriados em versão limpa antes de postar porque os cards gerados primeiro duplicavam o título.
- Na continuação, itens fracos/sensíveis foram cortados antes da publicação, e o fallback visual que duplicava título foi corrigido no pacote `.codex-temp/zap-round-20260604-continue/`.
- Chrome/CDP não foi usado para publicação porque o perfil web não estava logado.
- Evidências, manifests, HTML preview e logs: `.codex-temp/zap-round-20260604/` e `.codex-temp/zap-round-20260604-continue/`; prova final consolidada em `.codex-temp/zap-round-20260604/ig-profile-final-after-continue.png`.

## Rodada Atual - 20260604-v8-public-agents-footer-teleport

- Correção pós-feedback do usuário aplicada no V8 final: voz sintetizada da RAIane removida do chatbot e logo principal restaurada para `assets/logo-czs.svg`.
- CTA vermelho "Venha apostar" reposicionado acima do Info, com botões laterais maiores.
- "Escritórios de agentes" deixou de expor sistema interno/IA local/fila administrativa no front público; agora é apenas uma vitrine/rota para agentes autônomos com sprites e links públicos.
- Fluxo público reorganizado: apresentação principal, módulos públicos/secundários, gateway de agentes, feed contínuo e só então rodapé.
- Botão flutuante agora sinaliza "Rodapé / Mapa da página", carrega o restante do feed contínuo e salta direto para o footer; no rodapé vira "Topo / Home".
- Validação: `node --check assets/v8-final/v8-merge-ready.js`, `git diff --check`, `npm run review:team` OK com 0 issues e CDP Edge confirmando footer visível após o salto.
- Evidências: `C:\Users\junio\AppData\Local\Temp\v8-final-agents-public-clip-final3.png` e `C:\Users\junio\AppData\Local\Temp\v8-final-footer-jump.png`.

## Rodada Atual - 20260604-v8-rayl-feedback-fix-v4

- Correção pós-feedback do usuário: a RAIane voltou a aparecer na intro; o recorte agora é feito no cartão do loader sem remover a sprite e sem mostrar a logo antiga do CZS no loader.
- O pop-up comercial preserva a RAIane sentada inteira acima do card; a correção removeu o efeito anterior em que só apareciam pernas/corte de avatar.
- Escritórios ficaram mais acháveis: continuam dentro da Cheffe Call, com botão "Ver escritórios", card próprio no mapa do jornal e intenção própria na RAIane.
- Backend local ajustado: respostas Ollama ficaram mais curtas e o timeout default subiu para 30s; em smoke na porta temporária 3026, RAIane/escritórios/Cheffe responderam `ai.status=online`.
- Validação: Browser desktop/mobile sem console errors, sem overflow horizontal no mobile, `node --check assets/v8-final/v8-merge-ready.js`, `node --check server.js`, `git diff --check` nos arquivos tocados e `npm run review:team` OK com 0 issues.
- Pendência real antes de Render: Ollama em `http://127.0.0.1:11434` só responde no ambiente onde o servidor roda. No Render online isso aponta para o container do Render, não para o PC do usuário, salvo se houver túnel/serviço seguro configurado.

## Rodada Atual - 20260604-v8-ollama-offices-review-ui-v3

- V8 recebeu a rodada final local antes do retorno do usuário: intro sem logo antiga, corte melhor da RAIane no loader/popup, modo compacto alternando para "Modo aberto", CTA "Ler" simplificado e RAIane sem resumo no cabeçalho.
- Mobile corrigido no hero/lead/rail, com checks de DOM sem overflow horizontal; publicidade ganhou espaçamento e botão sem encavalar.
- Galeria turística ficou visível após vídeos, com 16 itens, mapa e organização visual de Cruzeiro do Sul/Vale do Juruá.
- Vídeos agora usam player quando o item é `.mp4` e tentam capturar/cachear um frame real para poster; quando o browser/CORS bloqueia a captura, permanece fallback visual seguro.
- Todo artigo/card recebe ação "Revisão"; o clique envia para Cheffe Call via `/api/editorial-corrections`, registra como revisão editorial e deixa o botão verde/brilhando sem abrir o leitor por acidente.
- Escritórios foram remontados como workspace de fluxo, com cards por área, fila Cheffe e formulário de IA local; RAIane, escritórios e Cheffe Call usam Ollama local em endpoints separados.
- Ollama default ficou `qwen2.5:3b` porque `qwen3-hermes:4b` respondeu vazio/thinking no smoke; override continua possível por `CZS_OLLAMA_MODEL`.
- Validação: `node --check server.js`, `node --check assets/v8-final/v8-merge-ready.js`, endpoints RAIane/escritórios/Cheffe, Edge CDP mobile/popup e `npm run review:team` OK.
- Evidências: `.codex-temp/v8-qa-20260604/cdp-mobile-final.png` e `.codex-temp/v8-qa-20260604/cdp-popup-avatar-final.png`.
- Pendência real antes de Render: merge/smoke no online, campanhas comerciais reais em `data/ad-campaigns.json` se forem subir já, e considerar timeout/modelo do Ollama se muitas IAs forem chamadas em paralelo.

## Rodada Atual - 20260603-v8-real-functional-v2

- V8 passou de preview decorativo para integrações mínimas reais nas áreas críticas confirmadas pelo usuário.
- MP4 agora é detectado como vídeo e renderiza `<video controls>` no hero, leitor e hub de vídeos; `.mp4` não cai mais em `<img>`.
- Arquivo V8 busca `/api/news/archive?limit=1000`, mostra status de endpoint/fallback e usa o payload online quando o servidor responde.
- Cheffe/Comunidade deixaram de ser só localStorage: correções/fotos/fontes vão para `/api/editorial-corrections`; relatos comunitários usam `/api/community/reports`.
- RAIane agora tenta `/api/rayl/chat` e só cai no FAQ local quando o backend não responde; o endpoint registra log em `DATA_DIR/rayl-chat-log.json`.
- Anúncios/comercial ganharam backend simples persistente: `/api/ads/campaigns`, `/api/ads/events` e `/api/commercial/leads`, com arquivos JSON em `DATA_DIR`.
- Cache-bust atualizado para `20260604-v8-real-functional-v2` em `index.html` e nos dois protótipos V8.
- Validação: `node --check assets/v8-final/v8-merge-ready.js`, `node --check server.js`, smoke HTTP com `DATA_DIR` temporário, Edge headless e `npm run review:team` OK.
- Evidência: `.codex-temp/v8-visual-smoke/home-v8-1440.png`.
- Pendência antes de Render: decidir campanhas reais em `data/ad-campaigns.json`, se RAIane deve chamar IA externa além do roteador determinístico e repetir smoke no online após merge.

## Rodada Atual - 20260603-qwen-update1

- Qwen atualizado em escopo local/Hermes sem mudar a autoridade principal: `openai-codex/gpt-5.5` segue como frente final e Qwen continua worker.
- CLI `@qwen-code/qwen-code` verificado/atualizado via npm global em `C:\claude`, permanecendo na versao mais recente disponivel `0.17.1`.
- Modelos Ollama renovados: `qwen2.5-coder:3b` e `qwen2.5:3b`; novo `qwen3:4b` baixado para uso local leve.
- Criado derivado local `qwen3-hermes:4b` com `num_ctx 65536` via `.codex-temp/qwen3-hermes.Modelfile`, porque o runtime default do Ollama carregava `qwen3:4b` com 4096 de contexto e o Hermes exige janela maior.
- Configs `C:\Users\junio\.hermes\config.yaml` e `C:\Users\junio\AppData\Local\hermes\config.yaml` passaram a declarar `qwen3:4b`, `qwen3-hermes:4b` e rota explicita `local-qwen3-explicit`; backups `config.backup-qwen-update-20260603-194110.yaml` criados antes da mudanca.
- RayX passa a preferir `qwen3-hermes:4b` quando escolher um LLM local nao-coder; o roteador de continuidade inclui `qwen3-hermes:4b` como worker local.

## Rodada Atual - 20260603-rayl-chatbot-faq1

- Chatbot da RAIane implementado no prototipo V8 alvo `prototype-redesign-v8-portal-inteligente.backup-before-final-corrective-prompt-20260603.html`.
- Assistente agora tem FAQ local, campo de pergunta, respostas por intencao e troca de pose conforme contexto: anunciar, noticia/pauta, servicos, PubPaid, duvida incerta e atendimento humano.
- WhatsApp nao e fallback automatico para pergunta sem resposta; o CTA `Falar no WhatsApp` aparece apenas quando o visitante pede contato humano/atendente/dono/Zap.
- Link humano configurado para `https://wa.me/556896026649` com texto pre-preenchido.
- Foram extraidas 31 poses novas a partir das imagens enviadas e salvas em `assets/aylla/chatbot-poses/`; manifest em `assets/aylla/chatbot-poses.json`.
- Cache-bust do alvo atualizado para `20260603-app-loader-v10-rayl-chatbot`.
- Validacao: `node --check assets/v8-final/v8-merge-ready.js`, `git diff --check` nos arquivos alvo e Playwright mobile. Evidencia: `.codex-temp/v8-qa/rayl-chatbot-human-whatsapp-mobile.png`.

## Rodada Atual - 20260603-czs-v8-final-visual-review

- Rodada v4 de acabamento executada no prototipo alvo: `prototype-redesign-v8-portal-inteligente.backup-before-final-corrective-prompt-20260603.html`, com cache-bust `20260603-app-loader-v4`.
- Intro virou abertura continua de app: ceu azul institucional, estrelas/particulas, colisao de luz, progresso minimo real, cache renovado por `V8_BOOT_VERSION`, logo PNG transparente sem recorte de letras e RAIane viva alternando poses no painel de boas-vindas.
- Leitor de artigo reorganizado: titulo primeiro, depois foto + cards laterais de contexto, e abaixo o texto captado da materia sem resumo procedural no corpo. Areas de divulgacao nativa foram planejadas dentro e depois do artigo.
- Paleta final desta fatia segue azul profundo + amarelo institucional + branco; vermelho fica reservado para urgencia editorial.
- Evidencias visuais salvas em `.codex-temp/v8-qa/v4b-intro-rayl-logo.png`, `.codex-temp/v8-qa/v4b-reader-layout-ads.png` e `.codex-temp/v8-qa/v4b-reader-body-ads.png`.
- Validacao v4: `node --check assets/v8-final/v8-merge-ready.js`, `git diff --check` nos arquivos alvo e `npm run review:team`. O review ainda mostra 74 achados em arquivos/prototipos legados, mas nao no prototipo alvo nem em `assets/v8-final`.
- Popup comercial V8 atualizado para RAIane: mascote sentada acima da caixa, balao com frases alternadas, cards de criacao de sites/apps/divulgacao/automacao com imagens bitmap reais em `assets/v8-commercial/`; validado em desktop/mobile sem console errors e sem overflow horizontal.
- Protótipo V8 alvo finalizado para revisão visual local: `prototype-redesign-v8-portal-inteligente.backup-before-final-corrective-prompt-20260603.html`.
- Logo oficial aplicada com escala de marca e animações de entrada/sinal/flip em `assets/v8-final/v8-merge-ready.css`, usando `assets/brand/catalogo-czs-logo-official-crops-20260603/02-versao-horizontal-alpha.png`.
- Copies redundantes e textos automáticos removidos dos dados principais (`data/runtime-news.json`, `data/news-archive.json`, `news-data.js` e JSON embutido no protótipo); fallback procedural/placeholder foi bloqueado em favor de fotos reais.
- Leitor V8 validado com matéria abrindo no layout novo, imagem real, fonte de corpo maior e efeito de passagem de página.
- Rodapé/área final recebeu galeria de Cruzeiro do Sul, mapa Google Maps e exemplos de formatos de anúncio.
- Aylla ficou compacta e integrada: no mobile vira ícone quadrado para não cobrir a manchete.
- Validação: `node --check assets/v8-final/v8-merge-ready.js`, `npm run review:team`, Browser/IAB desktop/artigo/recursos/mobile sem console errors e sem overflow. Relatório de revisão não lista mais o protótipo alvo; os 74 achados restantes são legados fora desta página.
- URL local para revisão: `http://127.0.0.1:8790/prototype-redesign-v8-portal-inteligente.backup-before-final-corrective-prompt-20260603.html`.

## Rodada Atual - 20260602-hermes-gpt-mind-hard-stop

- Erro encontrado: quando `openai-codex/gpt-5.5` estava sem credencial, o Hermes fazia fallback automatico para `custom:local-ollama/minimax-m3:cloud`, fazendo MiniMax assumir a conversa em vez de pedir autenticacao.
- Correcao aplicada: `fallback_providers: []` e `model_router.enabled: false` no config ativo `C:\Users\junio\AppData\Local\hermes\config.yaml` e no espelho `C:\Users\junio\.hermes\config.yaml`.
- Todas as credenciais antigas de `openai-codex` foram removidas dos auth stores `C:\Users\junio\AppData\Local\hermes\auth.json` e `C:\Users\junio\.hermes\auth.json`; tambem foi removido `suppressed_sources.openai-codex` para a proxima autenticacao por `hermes auth add openai-codex` entrar limpa.
- Regra operacional confirmada pelo usuario: GPT planeja e decide antes de tudo; outros modelos ajudam por tras como workers de rapidez/economia, mas nao substituem a mente/modelo principal sem permissao explicita.
- Prompt de recuperacao criado em `.codex-temp/hermes-gpt-mind-auth-prompt.md` e copiado para `C:\Users\junio\AppData\Local\hermes\docs\HERMES_GPT_MIND_RECOVERY_PROMPT.md`.
- Validacao: `hermes fallback list` retorna `No fallback providers configured`; `hermes auth status openai-codex` retorna logged out; smoke GPT sem credencial falha corretamente com `No Codex credentials stored. Run hermes auth to authenticate.` em vez de abrir MiniMax.

## Rodada Atual - 20260602-hermes-chatgpt-minimax-priority2

- Hermes alinhado para trabalhar com `openai-codex/gpt-5.5` como porta de entrada e autoridade final, com pedido explicito de `me autentique` quando o GPT falhar por auth.
- Config ativo `C:\Users\junio\AppData\Local\hermes\config.yaml`: primary `openai-codex/gpt-5.5`; fallback em ordem `minimax-m3:cloud`, `minimaxai/minimax-m2.7`, `gemini-2.5-flash-lite`, `llama3.2:3b`.
- Config espelho `C:\Users\junio\.hermes\config.yaml`: default e delegation voltaram para `openai-codex/gpt-5.5`; MiniMax M3 e MiniMax 2.7 foram colocados antes de Gemma/Qwen/Llama.
- `scripts/hermes-continuity-router.js` agora usa suporte quente padrao 2, testa MiniMax 2.7 via NVIDIA (`minimaxai/minimax-m2.7`), deixa Gemma/Gemini/Llama/Nemotron como fallback e emite alerta `me autentique` quando o GPT exigir reauth.
- Backups criados: `C:\Users\junio\AppData\Local\hermes\config.backup-chatgpt-minimax-priority-20260602-163937.yaml` e `C:\Users\junio\.hermes\config.backup-chatgpt-minimax-priority-20260602-163937.yaml`.
- Validacao: `hermes fallback list` mostrou primary GPT e fallback MiniMax M3 -> MiniMax 2.7 -> Gemini -> Llama; `hermes auth status openai-codex` logged in; GPT smoke `OK-HERMES-GPT-READY`; MiniMax M3 smoke `OK-HERMES-M3`; MiniMax 2.7 smoke `OK-HERMES-M27`; `node scripts/hermes-continuity-router.js --support 2 --include-cloud=false --timeout 70000` retornou `authority=chatgpt-codex-primary`, `warmSupport=minimax-m3-cloud,minimax-m27-fast`.

## Rodada Atual - 20260602-hermes-opendesign-desk1

- Configurado `OpenDesign Desk` como mesa de pedidos de design operada pelo Hermes, sem instalar runtime externo.
- Criado `scripts/hermes-opendesign-bridge.js` com comandos `status`, `brief`, `resources` e `request`.
- Comandos npm adicionados: `hermes:opendesign:status`, `hermes:opendesign:brief`, `hermes:opendesign:resources` e `hermes:opendesign:request`.
- Regra operacional: Codex/openai-codex segue diretor final; Hermes coordena; workers pesquisam, rascunham e revisam; Qwen permanece code-only.
- Catalogo GitHub inicial: Open CoDesign, OpenPencil, ZSeven-W OpenPencil, Open Design Framework, OpenGenerativeUI, Shadcn Space, Tailark Blocks, Flowbite, TypeUI, Onlook e LayoutPrompter.
- Pedido inicial registrado em `data/opendesign-orders.json`; prompt operacional em `.codex-temp/hermes-opendesign/latest-request.md`; status em `.codex-temp/hermes-opendesign/latest-status.md`.
- Validacao: `node --check scripts/hermes-opendesign-bridge.js`, `npm run hermes:opendesign:status`, `brief`, `resources`, `request` e `git diff --check` nos arquivos da frente.

## Rodada Atual - 20260602-hermes-continuity-router1

- Criado `scripts/hermes-continuity-router.js` para testar troca de modelo/linguagem no Hermes e escolher suportes vivos por latencia.
- Comandos adicionados: `npm run hermes:continuity`, `npm run hermes:continuity:fast` e `npm run hermes:continuity:watch`.
- Regra implementada: `openai-codex/gpt-5.5` segue autoridade quando saudavel; se falhar com sintoma de auth, o script avisa para reautenticar com `hermes auth add openai-codex`.
- MiniMax e testado junto com Codex e demais workers; quando o teste direto do Ollama nao entrega resposta final confiavel, o router tenta MiniMax pela rota Hermes.
- Validacao completa: Codex OK; MiniMax OK via Hermes; Llama/Gemma/Gemini foram os 3 suportes mais rapidos no ciclo completo; Qwen ficou code-only; NVIDIA respondeu mas mais lento.
- Relatorio vivo: `.codex-temp/hermes-continuity/latest.md` e `C:\Users\junio\AppData\Local\hermes\state\hermes_continuity_router_latest.json`.

## Rodada Atual - 20260601-czs-social-premium-correction-safe

- Frente social premium corrigida com foco em seguranca de destino: o destaque `Noticias` foi removido do Instagram; `Cotas` e `PubPaid` permanecem.
- Os novos destaques institucionais (`Servicos`, `Anuncie`, `Ferramentas`, `Criador`) estao prontos em arte, mas a criacao automatica ficou bloqueada: o seletor mostrava noticias antigas/Cotas/quadro verde, e o repost de `Servicos` abriu preview preto no compositor.
- Captura de noticias atualizada: 283 itens, 185 de hoje, 360 ativos e 480 no arquivo. `pcac` abortou por timeout; demais fontes principais responderam.
- Audio/caption: `noticia.js` e `scripts/capture-latest-news.js` agora mantem narracao `pt-BR` e bloqueiam fallback para portugues de Portugal.
- Validacao: `node --check`, `py -m py_compile`, `node scripts/capture-latest-news.js` e `npm run review:team` OK. Os 3 achados restantes sao de `cruzeiro-do-sul-barzinho/index.html`, fora da frente social.
- Relatorio da rodada: `.codex-temp/social-total-correction-20260601/SOCIAL_PREMIUM_TOTAL_CORRECTION_STATUS.md`.

## Rodada Atual - 20260602-hermes-chatgpt-minimax-cdp-recovery

- Hermes diagnosticado apos falha em ciclos de agentes/imagem: MiniMax nuvem nao estava disponivel porque `MiniMax` API key e `MiniMax OAuth` seguem sem configuracao/login no `hermes status`.
- ChatGPT/Codex parecia logado, mas o pool `openai-codex` tinha entradas `dead 401`, uma `exhausted 429` e duplicatas `oauth-11`/`oauth-12`, causando falhas intermitentes em subagentes.
- Backup criado antes da higiene: `C:\Users\junio\AppData\Local\hermes\auth.backup-20260602-005548.json`.
- Removidas apenas as entradas ruins do pool; restaram 5 credenciais limpas (`openai-codex-oauth-2` a `openai-codex-oauth-6`) e `last_auth_error` foi limpo.
- Chrome CDP estava desligado em `127.0.0.1:9222`; foi relancado com `--remote-debugging-port=9222`, `--remote-allow-origins=*` e perfil `C:\Users\junio\AppData\Local\hermes\chrome-cdp-profile`.
- Validacao final: `hermes -z "Responda exatamente: OK-HERMES-CODEX" --provider openai-codex -m gpt-5.5` retornou `OK-HERMES-CODEX`; browser tool com `Example Domain` retornou `Example Domain`.
- Pendencia: para MiniMax nuvem, configurar `MiniMax`/`MiniMax-CN` API key ou executar `hermes auth add minimax-oauth`; ate isso, o Hermes nao consegue usar MiniMax como worker cloud.

## Rodada Atual - 20260601-hermes-minimax-gemma-local1

- Hermes/Ollama atualizado em escopo local: Ollama 0.24.0 confirmou `minimax-m3:cloud` no catalogo, e `gemma3:1b`/`gemma3:4b` foram baixados para uso local.
- Perfil ativo do Hermes nesta sessao: `C:\Users\junio\.hermes\config.yaml` via `C:\Users\junio\AppData\Local\hermes\hermes-agent\.venv\Scripts\hermes.exe`; o `hermes` nao estava no PATH da sessao.
- Regra final do usuario: ChatGPT/Codex `openai-codex/gpt-5.5` e a mente principal; recebe tudo, decide, delega e sintetiza. MiniMax/Gemma/Qwen/Llama sao workers, nao autoridade final.
- Config do Hermes preserva `openai-codex/gpt-5.5` como primary e adiciona fallback: `minimax-m3:cloud`, `gemma3:4b`, `gemma3:1b`, `qwen2.5:3b`, `llama3.2:3b`, todos via `custom:local-ollama`.
- Foi adicionado `model.ollama_num_ctx: 65536` e declarados os modelos locais/cloud no provider `local-ollama`; backup criado em `C:\Users\junio\.hermes\config.yaml.bak-minimax-gemma-20260601T151632Z`.
- Validacao: `hermes fallback list` mostrou primary/fallback corretos; smokes Hermes retornaram `OK-HERMES-GEMMA-1B`, `OK-HERMES-GEMMA-4B` e `OK-HERMES-MINIMAX-M3`.
- Teste complexo validado em `C:\Users\junio\AppData\Local\hermes\state\hermes_complex_swarm_latest.json`: workers `minimax-m3:cloud`, `gemma3:4b`, `gemma3:1b`, `qwen2.5-coder:3b` e `llama3.2:3b` responderam com `run_id`, e Codex fez a decisao final. Codex aprovou MiniMax/Llama/Gemma4 como apoio, restringiu Qwen a codigo revisado e reprovou Gemma1 para validar dominio/credibilidade.
- Rotina persistida em `C:\Users\junio\AppData\Local\hermes\docs\HERMES_CODEX_SWARM_PROTOCOL.md` e `C:\Users\junio\.hermes\memories\USER.md`; gateway Hermes iniciado e `moa`/`context_engine` habilitados no CLI.
- Video `https://youtu.be/97IO4He9PPc` identificado como 8 atualizacoes principais + bonus Kanban: Session Recall, background tasks, Grok OAuth/X, PowerShell nativo, Codex CLI, computer use, video generation, `/goals`, e Kanban triage/decompose/swarm.
- Atualizacoes aplicadas em 2026-06-01: `hermes update` deixou `Hermes Agent v0.15.1 (2026.5.29)` como up to date; `npm audit fix` no `hermes-agent` zerou vulnerabilidades Node; `video`, `video_gen`, `x_search`, `moa` e `context_engine` ficaram habilitados no CLI; gateway foi iniciado via scheduled task. Pendencias restantes dependem de credenciais/API keys: xAI/Grok (`XAI_API_KEY` ou OAuth), video providers (FAL/Runway/PixVerse), web search keys, Gemini/MiniMax OAuth e opcional `GITHUB_TOKEN`.
- Finalizacao adicional: chaves existentes no `.env` antigo de `C:\Users\junio\AppData\Local\hermes` foram migradas para `C:\Users\junio\.hermes\.env` com backup `C:\Users\junio\.hermes\.env.bak-key-migrate-20260601T165046Z`. `GEMINI_API_KEY` foi reconhecida e smoke retornou `OK-GEMINI-KEY`; `image_gen` e `video_gen` ficaram disponiveis no `doctor`; Chrome CDP foi iniciado em `127.0.0.1:9222` e o browser smoke retornou `Example Domain`. Restam sem credencial local: `XAI_API_KEY`/xAI OAuth, `OPENROUTER_API_KEY` para MoA completo, e chaves EXA/Tavily/Firecrawl/Parallel para web avancado.
- Web avancado concluido com chaves fornecidas pelo usuario: `FIRECRAWL_API_KEY`, `EXA_API_KEY` e `TAVILY_API_KEY` adicionadas em `C:\Users\junio\.hermes\.env`; `web.search_backend: exa` e `web.extract_backend: firecrawl`; smokes diretos Exa/Tavily/Firecrawl retornaram 200 e Hermes web retornou `Example Domain`.
- Ponte Hermes/Codex para escritorios locais concluida em 2026-06-01: `scripts/hermes-office-bridge.js` cria fluxos `status`, `brief`, `dispatch`, `run` e `render`; comandos npm `hermes:office:*`; wrapper Hermes `C:\Users\junio\AppData\Local\hermes\hermes-agent\.venv\Scripts\hermes-project-codex-hq.cmd`; docs em `C:\Users\junio\AppData\Local\hermes\docs\HERMES_PROJECT_CODEX_HQ.md`.
- Validacao da ponte: `npm run hermes:office:brief` mostra Codex principal, 181 agentes, Exa/Firecrawl, e Render bloqueado por CLI/chave; `npm run hermes:office:run` executou `scripts/real-agents-runtime.js` e gerou `.codex-temp/real-agents/latest-run.*`; Hermes via tool `terminal` executou `hermes-project-codex-hq.cmd brief` e retornou `Web: busca=exa; extracao=firecrawl; backend=firecrawl`.
- Correcao terminal Hermes/Windows: `HERMES_GIT_BASH_PATH=C:\Program Files\Git\bin\bash.exe` foi adicionado ao `.env` porque o terminal do Hermes estava encontrando o `bash.exe` do WSL e falhava sem distro instalada.
- Render CLI instalado localmente sem admin em `C:\Users\junio\AppData\Local\hermes\bin\render.exe`, versao `render v2.19.0`, baixada do release oficial `render-oss/cli` e validada contra `SHA256SUMS`; o bridge agora injeta `C:\Users\junio\AppData\Local\hermes\bin` no PATH. Render remoto ainda depende de `RENDER_API_KEY` ou login Render.
- `RENDER_API_KEY` fornecida pelo usuario foi adicionada a `C:\Users\junio\.hermes\.env`; API REST Render validada com status 200 e servicos `catalogo-cruzeiro-web`/`catalogo-cruzeiro` listados. Criado `scripts/render-api-bridge.js`, npm `hermes:render:*`, wrapper `hermes-render-api.cmd`; Hermes executou `hermes-render-api.cmd status --service catalogo-cruzeiro-web` e retornou ultimo deploy `live`.
- `OPENROUTER_API_KEY` fornecida pelo usuario foi adicionada e sincronizada entre `C:\Users\junio\.hermes\.env` e `C:\Users\junio\AppData\Local\hermes\.env`; OpenRouter `/api/v1/key` retornou 200, `hermes doctor` marcou `OpenRouter API`, `moa` e `web` como disponiveis. `npm audit fix` no `hermes-agent` zerou vulnerabilidades. MoA foi ajustado para modelos gratuitos disponiveis (`google/gemma-4-31b-it:free` como agregador) e smoke Hermes retornou `OK-MOA-OPENROUTER`.

## Rodada Atual - 20260529-pubpaid-legal2

- Criado e refeito pacote juridico-operacional atualizado em `docs/pubpaid/legal/2026-05-29/` com fontes oficiais e PDFs, agora com leitura pro-produto.
- Documentos gerados: relatorio de analise juridica operacional, documento operacional de conformidade, documento de funcionamento do produto e matriz go/no-go.
- Conclusao registrada: PubPaid e viavel como plataforma de jogos de habilidade, comunidade, ranking, treino, PvP gratuito, torneios gratuitos, assinatura, publicidade, patrocinio e cosmeticos nao resgataveis.
- Camada financeira sensivel fica como fase futura: dinheiro de partida, premio, taxa/rake/comissao, saque, torneio pago e publicidade de ganho exigem parecer juridico, fiscal/contabil, LGPD, pagamento/antifraude, seguranca e go/no-go assinado.
- Fontes oficiais usadas: Planalto, SPA/MF, BCB Pix, LGPD, CDC, Lei 5.768/1971 e Decreto-Lei 3.688/1941.

## Rodada Atual - 20260527-chessfast1

- Xadrez PubPaid corrigido em escopo pontual: abertura acelerada, creditos/moeda mais rapidos, IA Demo reduzida para resposta em 0,9s e transicoes 3D menos lentas.
- Botao de mesa do Xadrez voltou a aparecer: regra final que escondia `.ppg-chess-camera` foi removida.
- Copy trocada de `Mesa fixa/Girar rival` para `Mesa normal/Mesa livre`; no smoke local o botao mudou corretamente e a mesa livre deu feedback visual (`turnYaw 0deg -> 42deg`).
- Build/cache-bust local: `20260527-chessfast1`.
- Validacao local: `node --check` em `pubpaid-phaser/ui/domGameInterface.js`, `pubpaid-phaser/app.js` e `server.js`; `npm run guard:pubpaid`; `git diff --check`; `/api/pubpaid/build`; Playwright em Xadrez mobile landscape com 64 casas/32 pecas. Evidencia: `.codex-temp/chessfast1-board-after-free.png`.

## Rodada Atual - 20260527-hermes-nvidia-stability1

- Hermes foi corrigido para manter `openai-codex/gpt-5.5` como rota principal de chat/contexto e usar NVIDIA apenas como fallback validado, nao como modelo principal.
- Varrida NVIDIA registrada em `.codex-temp/hermes-nvidia-stability-20260527.json`: melhores candidatos foram `nvidia/llama-3.3-nemotron-super-49b-v1.5` (6/6, media 1,23s), `meta/llama-3.2-3b-instruct` (6/6, media 1,85s) e `nvidia/llama-3.3-nemotron-super-49b-v1` (6/6, media 1,88s).
- `qwen/qwen3-coder-480b-a35b-instruct` tambem respondeu 6/6 na varrida, mas segue fora do chat normal pela regra do usuario: Qwen/Coder e apenas para instrucao explicita de codigo/background.
- `C:\Users\junio\AppData\Local\hermes\config.yaml` agora usa fallback: NVIDIA v1.5 -> NVIDIA llama 3.2 3b -> NVIDIA v1 -> Gemini -> Ollama local `llama3.2:3b`.
- Backup da configuracao antes da troca: `C:\Users\junio\AppData\Local\hermes\backups\codex-nvidia-stable-fallback-20260527_162121-config.yaml`.

## Rodada Atual - 20260527-editorial-politica1

- Diretriz CZS atualizada: linha editorial regional/conservadora, cetica com propaganda estatal e manchete militante, priorizando impacto real no Vale do Jurua.
- `scripts/capture-latest-news.js` agora bloqueia chamadas politicas sensacionalistas/opinativas com insulto, deboche, humilhacao, apelido ou propaganda de programa federal sem utilidade publica local.
- Preservada utilidade publica local mesmo quando envolver programa de governo: calendario, cadastro, prazo, atendimento, beneficiarios e servico verificavel continuam permitidos.
- Noticias regeneradas com a trava: exemplos como "picareta", "Pinoquio", "Tapa na cara", "jogo duplo", "ato falho", "de queixo caido", "ativo toxico" e propaganda Bolsa Familia/IDH sairam de `runtime-news`, `news-archive` e `news-data.js`.
- Validacao parcial: `node --check scripts/capture-latest-news.js`, captura RSS OK e `node scripts/performance-budget-check.js` OK. Falta rodar `npm run review:team`, commit/push e validacao online.

## Rodada Atual - 20260527-home-sliced-loading1

- Home CZS otimizada com carregamento fatiado real: `home-critical.css` novo, `home-main-loader.js` no lugar de `script.js` direto, preload de noticias reduzido para `limit=18&lite=1&firstFold=1`, CSS/JS premium e modulos auxiliares atras de rolagem/clique/secao perto da viewport ou fallback tardio.
- Mantida intro cinematografica com minimo aproximado de 3s; depois da intro, a primeira tela hidrata com dados leves via `early-home-surfaces.js`.
- Validacao local: desktop no Browser e mobile via Playwright fallback confirmaram que aos 5.6s e 12.6s nao entram `script.js`, `premium-home-redesign.css`, arquivo/admin/Cheffe ou rotas antigas; rolagem aciona o modo completo por `reader-intent`.
- `npm run review:team` passou com PubPaid guard OK; restaram 3 achados preexistentes em `cruzeiro-do-sul-barzinho/index.html`, fora da home.

## Rodada Atual - 20260527-pubpaid3-local-slice1

- PubPaid 3.0 / Cruzeiro do Sul Barzinho retomado como projeto separado em `cruzeiro-do-sul-barzinho/`, sem substituir o PubPaid canônico (`/pubpaid.html`, `pubpaid-phaser/`, `pubpaid-phaser.css`, `pubpaid-runtime.js`, `games/vale-pool/`).
- Fatia local criada: intro, lobby com 10 slots, seleção de 10 personagens, chat/emotes, Sinuca com 3 modos, Damas base e Xadrez visual/base, além de `window.renderGameToText()` para QA.
- Documentos criados: `docs/GAME_BIBLE.md` e `docs/CHATGPT_IMAGE_PROMPTS.md` com trava de arte final via ChatGPT Imagem quando controlável.
- Validação: `npm run check` dentro de `cruzeiro-do-sul-barzinho` OK e `npm run guard:pubpaid` no repo canônico OK. Browser/CDP não estava disponível nesta sessão; validação visual headless ficou pendente.

## Rodada Atual - 20260527-pubpaid-publish1

- Subida PubPaid retomada após janela fechada: pacote legal `docs/pubpaid/legal/` mais correção visual `chesshudfix1` do Xadrez/Damas preparados para commit/push.
- Validação de retomada: `node --check pubpaid-phaser/ui/domGameInterface.js`, `git diff --check`, JSON local OK e `npm run review:team` com PubPaid guard OK e `totalIssues: 0`.
- Arquivos de runtime em foco: `pubpaid-phaser/ui/domGameInterface.js`, `pubpaid-phaser.css`, `pubpaid.html` e `progress.md`; mudanças grandes de dados/editorial ficaram fora do escopo desta subida.

## Rodada Atual - 20260526-pubpaid-legal1

- PubPaid recebeu pacote legal assinável em `docs/pubpaid/legal/`: manifesto, documento operacional/termo de responsabilidade, matriz de questões legais e go/no-go, mais README de uso.
- O pacote foi escrito como minuta operacional pronta para assinatura interna, mas com trava expressa: dinheiro real, prêmio, taxa/rake, torneio pago, saque automatizado ou publicidade de ganho ficam bloqueados até parecer jurídico, contábil, fiscal, LGPD e pagamento.
- Fontes oficiais consultadas: Planalto, Ministério da Fazenda/SPA para apostas de quota fixa e Banco Central para Pix.
- Estado operacional refletido no documento: Damas e Xadrez podem seguir em teste/demonstração, Sinuca permanece fora do online até correção e nova validação.

## Rodada Atual - 20260522-fix245

- Resolvidos apenas os itens pedidos 2, 3, 4 e 5: performance antiga, ordens abertas, volume de noticias e validacao online pos-deploy.
- Performance: `styles.css` compactado mecanicamente, saindo de `716692` bytes para cerca de `614 KB`; `npm run perf:budget` passou com `PERF_BUDGET_STRICT=1` e nenhum arquivo `over`.
- Noticias: `scripts/capture-latest-news.js` agora usa janela ativa padrao de 360 e arquivo padrao de 480 itens; `data/runtime-news.json`, `data/news-archive.json` e `news-data.js` foram podados de 1000 para 480 itens, com `news-data.js` em cerca de 1,56 MB.
- Memoria: 26 ordens antigas abertas foram marcadas como `closed-memory-cleanup`, restando apenas a ordem atual durante a rodada; reabrir alguma delas somente se o usuario pedir retomada explicita.
- Validacao local: `node --check`, JSON OK, `PERF_BUDGET_STRICT=1 npm run perf:budget`, `npm run agents:cycle` com `newsItems: 480`, `npm run review:team` com `totalIssues: 0`, `npm run editorial:health` OK e smoke local em `:3094` com home 200, `/api/news?limit=10&lite=1` sem `body`, `/api/pubpaid/build=20260522-boardfit1` e `/pubpaid.html` 200.
- Online apos deploy: Render primeiro retornou 502 durante troca de build, depois estabilizou com `news-data.js=1607717` bytes, `styles.css=614579` bytes, home 200, `/api/news?limit=10&lite=1` com 10 itens sem `body`, `/api/pubpaid/build=20260522-boardfit1` e `/pubpaid.html` 200.

## Rodada Atual - 20260522-sync1

- Ordem atual registrada: subir/sincronizar todas as mudancas e entregar relatorio de funcionalidade/heart.
- Validacao local antes de subir: `node --check` nos JS tocados, `git diff --check`, `npm run guard:pubpaid`, `npm run agents:cycle`, `npm run review:team` com `totalIssues: 0`, `npm run editorial:health` OK, `npm run perf:budget` OK nao estrito e `npm run codex:health` OK.
- Smoke HTTP local em `:3092`: home HTTP 200, `/api/news?limit=10&lite=1` com 10 itens e `/api/pubpaid/build=20260522-boardfit1`.
- Heart atual: memoria local viva, ultima ordem reconhecida pelo `codex:health`, worktree pronto para commit/push; pendencia funcional apenas a recomendacao recorrente de validar PvP real com duas contas reais/autenticadas antes de dinheiro de usuario.

## Rodada Atual - 20260522-editorial10b

- CZS/editorial refinado rumo a 10/10 sem tocar no runtime PubPaid: removidos templates antigos de resumo/lede (`A fonte consultada traz a base...`, `redacao automatica`, `ponto principal...`) de `data/runtime-news.json` e `news-data.js`.
- Captura, servidor e ciclo dos agentes agora evitam recriar esse texto generico; fallback fica no fato confirmado, impacto pratico e acompanhamento.
- Adicionado gate editorial automatico: `editorialGate`, `editorialApproval`, `editorialSpotlightReady`, `editorialSurfaceTier`, `editorialLocalTier` e `sourceCount`; materias sensiveis, avisos burocraticos e remoto secundario seguem no acervo, mas nao competem pela primeira dobra.
- Ranking da home/API passou a priorizar Juruá/Cruzeiro do Sul primeiro, Acre depois, serviço nacional util depois e remoto secundario no fundo.
- Validacao local: `node --check` em `server.js`, `script.js`, `scripts/agents-autonomy-cycle.js` e `scripts/capture-latest-news.js`; `npm run agents:cycle`; `npm run review:team` com PubPaid guard OK e `totalIssues: 0`; `npm run editorial:health` OK; `npm run perf:budget` OK nao estrito com divida antiga em `styles.css`; smoke local em `:3081` confirmou home 200, `/api/news?limit=10&lite=1`, build PubPaid `20260522-boardfit1` e top 10 com `tier=3`, `ready=true`, `surface=news`.

## Rodada Atual - 20260522-pvpqa1

- PubPaid PvP validado sem alterar runtime: build online Render `20260522-boardfit1` confirmado em `/api/pubpaid/build` e `/pubpaid.html` HTTP 200 contendo o mesmo build.
- Travas locais: `node --check` em `server.js`, `pubpaid-phaser/app.js`, `pubpaid-phaser/ui/domGameInterface.js`, `pubpaid-phaser/services/pvpService.js`, `pubpaid-phaser/services/accountService.js` e `games/vale-pool/game.js`; `npm run guard:pubpaid`; `npm run review:team` com `totalIssues: 0`.
- Contrato PvP em `DATA_DIR` isolado: duas sessoes autenticadas sinteticas passaram por auth obrigatoria, saldo, escrow, pareamento, `Estou pronto` dos dois lados, setup/tacada da Sinuca, lance de Damas, lance de Xadrez e settlement financeiro.
- Browser local carregou PubPaid sem console errors na tela inicial; login Google real em navegador e partida completa com duas contas reais ainda ficam como recomendacao antes de operar dinheiro de usuario em producao.

## Rodada Atual - 20260522-editorial10a

- CZS/editorial refinado sem misturar com PubPaid: home passou a pre-carregar `/api/news?limit=60&lite=1`, enquanto materias por slug continuam com corpo completo.
- API `/api/news` ganhou modo `lite=1`, removendo `body`, `highlights` e `development` do payload inicial da home e mantendo campos de capa, fonte, imagem, prioridade e slug.
- Medicao local: fetch antigo `limit=80` completo = 233112 bytes; novo `limit=60&lite=1` = 121138 bytes; economia de 48,0% no primeiro carregamento de noticias.
- Fallback editorial do servidor e dos agentes trocado para o padrao `fato confirmado -> impacto pratico -> o que seguir`, sem copy antiga de `redacao automatica`, `base desta noticia` ou `ponto principal da atualizacao captada automaticamente`.
- `scripts/agents-autonomy-cycle.js` agora normaliza tambem `activeWindowItems`, evitando que a janela ativa de noticias mantenha texto editorial antigo quando `items` ja esta limpo.
- Validacao local: `node --check` em `server.js` e `scripts/agents-autonomy-cycle.js`; `npm run agents:cycle`; `npm run review:team` com PubPaid guard OK e `totalIssues: 0`; `npm run perf:budget` OK em modo nao estrito, com divida antiga ainda marcada em `styles.css`; HTTP local em `:3064` confirmou home 200, preload lite, payload sem `body` e materia por slug com novo corpo editorial.

## Rodada Final - 20260522-final-sweep1

- Frentes separadas: Projeto Codex/CZS e PubPaid continuam no mesmo repo, mas devem ser tratados como sistemas diferentes; nao puxar regras de jogo para home/editorial nem puxar CZS para runtime PubPaid sem pedido explicito.
- Backup de rollback criado antes da limpeza: `.codex-backups/final-sweep-20260522-132315`.
- Ajuste final aplicado: Xadrez PubPaid voltou ao fluxo correto `video -> creditos -> moeda -> tabuleiro`, alinhado com Damas e evitando moeda antes da intro.
- Limpeza segura executada: removidos `output/`, `debug.log`, `scripts/__pycache__/`, `backend/node_modules/pngjs/coverage` e `data/pubpaid-tournaments.json` local de runtime; `.gitignore` passou a ignorar `debug.log` e `output/web-game/`.
- O audit de limpeza restante aponta apenas `backend/node_modules/qs/dist`; foi preservado por ser parte de dependencia instalada.
- Validacao local: `node --check` em arquivos tocados, `git diff --check`, `npm run cleanup:audit`, `npm run review:team` com PubPaid guard OK e `totalIssues: 0`, HTTP local em `:3062`, Browser desktop/mobile sem console errors.
- Browser QA: home desktop/mobile carregou conteudo sem overlay; PubPaid Xadrez mobile landscape mostrou creditos, depois liberou tabuleiro com 64 casas/32 pecas, sem overflow horizontal.
- Online confirmado apos push: Render respondeu `/api/pubpaid/build=20260522-boardfit1`, `/pubpaid.html` contem `20260522-boardfit1`, home HTTP 200 contem `20260522-homegate3`, e `/api/news?limit=1` respondeu OK.

## Rodada Atual - 20260522-homegate3

- Home CZS: carrossel de manchetes manteve 15 fotos e ganhou setas visiveis mais arrasto/puxar no trilho para ver as fotos que ficam fora da area inicial.
- Hero: CTA `Ler matéria` segue apontando para a noticia real em destaque.
- Cache-bust local: `20260522-homegate3`.
- Validacao: `node --check` em `script.js` e `scripts/review-team-audit.js`; `git diff --check`; `npm run review:team` com PubPaid guard OK e `totalIssues: 0`; Playwright desktop 1366x768 e mobile 390x844 confirmou carregamento sem overlay, 15 fotos, setas funcionando, arrasto funcionando e console limpo.

## Rodada Atual - 20260522-lobbywaiter1

- Build local atual: `20260522-boardfit1`.
- Xadrez/Damas PubPaid: estabilizado o controle de tabuleiro para nao alternar visualmente entre camera e jogo; clique/arrasto no miolo nao gira mais a mesa, camera fica nas bordas, botao do meio e pinch.
- Xadrez: pecas reduzidas e travadas dentro das casas, com geometria 3D mais baixa, sem animacao de pouso alterando transform/altura entre lances e sem alternar para versao chapada em viewport mobile.
- Validacao: `node --check` em `pubpaid-phaser/ui/domGameInterface.js`, `pubpaid-phaser/app.js` e `server.js`; `npm run guard:pubpaid`; `git diff --check`; HTTP local em `:3036`; browser in-app confirmou 64 casas/32 pecas no Xadrez, frame `default`, casas/pecas `pointer`, borda `grab`; Damas confirmou 64 casas/24 pecas e mesmo isolamento de controle; Playwright mobile landscape 844x390 confirmou Xadrez e Damas fora de cinematic, pecas com cursor `pointer`, frame `default` e bordas de camera reduzidas.

- Xadrez PubPaid: intro corrigida para nao disparar moeda antes do video terminar; removido salto de `onloadedmetadata` para o fim do video e `onended` agora so avanca se a fase ainda for `video`.
- Fluxo validado como Damas: video -> creditos -> moeda -> tabuleiro liberado; fallback do Xadrez segura tempo suficiente para o video de 5s e evita chamada dupla.
- Validacao local: `node --check` em `pubpaid-phaser/ui/domGameInterface.js`, `pubpaid-phaser/app.js` e `server.js`; `npm run guard:pubpaid`; `git diff --check`; `web_game_playwright_client`; Playwright mobile landscape e desktop no servidor `:3047` com 64 casas, 32 pecas, moeda apos creditos e tabuleiro liberado.
- Evidencias: `.codex-temp/chessintrofix/mobile-final-01-video.png`, `.codex-temp/chessintrofix/desktop-final-coin.png` e `.codex-temp/chessintrofix/desktop-final-board.png`.

## Rodada Atual - 20260522-pooltouchaim1

- Sinuca/Vale Pool mobile recebeu correcao de controle: arrastar/segurar no canvas agora apenas ajusta a mira e nao dispara o click sintetico que iniciava a força.
- Toque curto/parado continua avancando para a etapa de força; toque seguinte taca.
- Canvas do prototipo recebeu `touch-action: none` para o navegador nao roubar o gesto no celular.
- Build/cache-bust local: `20260522-pooltouchaim1`.
- Validacao: `node --check` em `games/vale-pool/game.js`, `pubpaid-phaser/app.js` e `server.js`; `npm run guard:pubpaid`; `web_game_playwright_client`; Playwright touch controlado em 844x390 confirmou arrasto permanecendo em `mira` e toque curto indo para `forca`; servidor local em `:3038` respondeu `/api/pubpaid/build=20260522-pooltouchaim1`.
- Revalidacao apos cache-bust paralelo: servidor local em `:3039` respondeu `/api/pubpaid/build=20260522-lobbywaiter1` e o mesmo teste touch confirmou `mira` apos arrasto e `forca` apos toque curto, sem erros de console.
- Evidencia: `.codex-temp/vale-pool-pooltouchaim1/demo-touch-controlled.png`.

## Rodada Atual - 20260522-tournamentpay1

- Torneio de Damas PubPaid: cadastro corrigido para abrir uma janela de pagamento separada com nome, WhatsApp, nome do depositante e valor fixo de R$ 50,00.
- Fluxo mantido: jogador toca em `Ja paguei`, aguarda aprovacao manual do admin, e a chave da vaga so e devolvida para a conta Google depois da aprovacao.
- Admin PubPaid agora mostra o nome do depositante nas reservas pendentes do torneio.
- Build/cache-bust local: `20260522-tournamentpay1`.
- Validacao: `node --check` em `server.js`, `pubpaid-phaser/ui/domGameInterface.js` e `pubpaid-phaser/services/tournamentService.js`; `npm run guard:pubpaid`; `git diff --check`; smoke HTTP local em `:3056` confirmou `/api/pubpaid/build=20260522-tournamentpay1`, campo do depositante, valor R$ 50,00 e chave escondida antes da aprovacao.

## Rodada Atual - 20260522-boardtouch1

- PubPaid Damas/Xadrez: removida a camera-orb com setas, zoom e icone de camera que ficava sobrepondo o tabuleiro.
- Mantido apenas o botao `Mesa fixa/Girar rival`, posicionado como pill discreto no canto do tabuleiro.
- Mobile/touch continua por gesto na mesa; desktop recebe apenas dica discreta para borda/roda, sem painel de controles no meio do jogo.
- Build/cache-bust local: `20260522-boardtouch1`.
- Validacao: `node --check` em `pubpaid-phaser/ui/domGameInterface.js`, `pubpaid-phaser/app.js` e `server.js`; `npm run guard:pubpaid`; `git diff --check`; HTTP local em `:3034` confirmou `/api/pubpaid/build=20260522-boardtouch1`, `pubpaid.html` sem botoes de seta/zoom/camera e auditoria com CTA/UI/idioma publico 0.

## Rodada Atual - 20260522-articleturn1

- Popup da home: copy refeita para anunciar PubPaid e Enquete Acre 2026 como duas escolhas claras, com icones, descricao e botoes dedicados.
- Materia: carregamento de entrada ficou explicito e a abertura/volta ganharam animacao de virada de folha.
- Retorno da materia: alem do botao flutuante, a pagina agora tem botao de voltar dentro do artigo, visivel tambem no desktop, sempre usando `index.html?skipIntro=1`.
- Cache-bust local: `20260522-articleturn1`.
- Validacao: `node --check` em `noticia.js` e `script.js`; `git diff --check`; HTTP local em `:3033` respondeu home, materia e `/api/news?limit=3`; auditoria local com idioma publico 0 e achados restantes medios/pre-existentes de loading/controles.

## Rodada Atual - 20260522-catalogreactivate1

- Catalogo CZS reativado no fluxo publico de `catalogo-servicos.html` com popup de entrada chamando para `PubPaid` e para a Enquete Acre 2026.
- Enquete Acre 2026 reaberta como rodada manual `2026-W21-czs1`, ativa ate `2026-06-06T04:59:59.999Z`; o backend ignora configuracao persistente mais antiga do Render quando ela for anterior a `2026-05-22T05:00:00.000Z`.
- Criado `npm run cleanup:audit` para viabilizar limpeza extrema com areas protegidas (`data/`, `.codex-memory/`, `.codex-backups/`, `assets/pubpaid/`, `games/vale-pool/`, `pubpaid-phaser/` e `render-data/`) antes de qualquer remocao destrutiva.
- Validacao local: `node --check` em `server.js`, `catalogo-servicos.js` e `scripts/cleanup-extreme-audit.js`; `npm run guard:pubpaid`; `npm run cleanup:audit`; servidor local em `:3017` respondeu `catalogo-servicos.html`, `pesquisa-acre-2026.html`, `/api/pesquisa-acre-2026/summary`, `/api/pesquisa-acre-2026/me` e `/api/pubpaid/build`; Playwright-core validou popup desktop/mobile sem erros de console.

## Rodada Atual - 20260522-homecatch1

- Home: popup PubPaid + Enquete Acre 2026 agora aparece na home apos a intro, com trava diaria por `localStorage`.
- Primeira dobra: intro espera hero e primeiras secoes receberem noticias via `/api/news` ou fallback seguro; `renderEditorialUtilityFlow` tambem roda com os dados dinamicos.
- Hero: CTA principal virou `Ler matéria` e aponta para a materia da foto/noticia exibida.
- Materia: adicionado botao flutuante `Voltar para a home` usando `index.html?skipIntro=1`, para evitar repetir a intro no retorno mobile.
- Fontes/captacao: adicionadas `Jurua em Tempo`, `Voz do Norte`, `Acre in Foco` e `Folha do Acre`; `The Verge` foi desativado por risco de texto publico em ingles.
- Captacao 2026-05-22: `node scripts/capture-latest-news.js` captou 269 itens, 95 de hoje, com fontes novas OK.
- Validacao: `node --check` em `backend/source-config.js`, `script.js`, `noticia.js` e `server.js`; `node scripts/guard-pubpaid-no-canvas.js`; `node scripts/review-team-audit.js` zerou vazamento de ingles publico, restando apenas achados medios antigos/false-positive de loading em PubPaid/game demo; HTTP local em `:3022` respondeu home, noticia, `/api/news?limit=5` e `/api/pubpaid/build`; navegador confirmou popup visivel, CTA `Ler matéria`, Instagram e hero/noticias reais sem console errors.

## Rodada Atual - 20260522-gameux2

- Damas/Xadrez: camera mobile saiu dos controles-orbe e passou a priorizar gesto nativo, com pinch para zoom e arrasto pelas bordas da mesa; controles touch globais ficam ocultos nessas mesas.
- Desktop: bordas/frame da mesa de Damas e Xadrez aceitam arrasto com mouse para girar/panar, alem de roda para zoom.
- Damas: intro de abertura encurtada em 2 segundos no tempo padrao e no modo `intro=1`, mantendo transicao para creditos/moeda.
- Audio: temas de Sinuca, Damas e Xadrez viraram 32-bit brasileiros originais, inspirados em samba-rock/pagode, forro/axe e bossa/funk leve sem copiar melodias protegidas.
- Build/cache-bust local: `20260522-gameux2`.
- Validacao: `node --check` em `pubpaid-phaser/ui/domGameInterface.js`, `pubpaid-phaser/audio/chipTechSoundtrack.js`, `pubpaid-phaser/app.js` e `server.js`; `npm run guard:pubpaid`; `/api/pubpaid/build=20260522-gameux2`; smoke mobile Damas e Xadrez com 64 casas, sem controles intrusivos e sem erros de console; smoke desktop Xadrez com arrasto na borda direita mudando `--ppg-chess-user-yaw` para `-11.68deg`.

## Rodada Atual - 20260522-poolreturn1

- Sinuca aprovada mantida sem redesenho e PubPaid recebeu retorno claro para o lobby: no treino aparece `Voltar ao lobby`, no PvP continua `Desistir`, e o fim da demo abre o painel de resultado com `Voltar às mesas`.
- `review=pool`, `review=sinuca` e `review=vale-pool` agora inicializam o fluxo de treino da sinuca para revisão direta.
- Build/cache-bust publicado como `20260522-poolreturn1`.
- Validação: `node --check` em `pubpaid-phaser/ui/domGameInterface.js`, `pubpaid-phaser/app.js` e `server.js`; `npm run guard:pubpaid`; `git diff --cached --check`; servidor local respondeu `/api/pubpaid/build=20260522-poolreturn1`; online Render respondeu `/api/pubpaid/build=20260522-poolreturn1`.
- Observação: ficaram mudanças locais não relacionadas em dados/notícias/automação e em um trecho solto de torneio de Damas no `server.js`; elas não entraram no commit de cache-bust da sinuca.

## Rodada Atual - 20260522-gameux1

- PubPaid Damas/Xadrez recebeu loader de abertura que espera assets/cache/fontes/imagens antes de soltar a intro.
- Damas e Xadrez entram com mesa fixa por padrao (`turnYaw=0deg`) e botao para alternar `Mesa fixa/Girar rival`.
- Camera agora aceita arrasto na borda da mesa, zoom por roda no desktop e controles de toque compactos no mobile, com copy diferente para cada contexto.
- Xadrez recebeu botao `Sair/Desistir` dentro da arena fullscreen e HUD lateral reduzido para nao sobrepor o tabuleiro.
- Torneio de Damas mantem fluxo real: reserva com Google/WhatsApp, Pix/referencia, aprovacao manual no admin e check-in apenas para vaga aprovada.
- Validacao local: `node --check` em arquivos tocados, `npm run guard:pubpaid`, `/api/pubpaid/build=20260522-gameux1`, Playwright desktop/mobile para Damas e Xadrez sem erros de console.

## Protocolo Comercial - Propagandas

- Para automacoes de WhatsApp/Facebook/Instagram, usar o protocolo local `.codex-memory/propaganda-automation-protocol.md`.
- Regra curta: WhatsApp primeiro por categoria; grupos de venda recebem gift cards/servicos digitais/T.I; grupos Uber/transporte recebem somente motorista particular; Facebook Marketplace vem depois com anuncios separados; Instagram fica sempre por ultimo e so quando o usuario mandar abrir.
- Usar sempre plugin/controle direto quando a tarefa envolver apps abertos; nunca postar por clique cego em conversa individual.

## Rodada Atual - 20260520-polishcam1

- Damas e Xadrez PubPaid receberam acabamento visual sem mudar o fluxo aprovado: Damas manteve a arena 3D, mas as pedras agora sao redondas e com contraste forte contra o tabuleiro.
- Xadrez manteve fullscreen e mesa 3D, trocou a antiga maozinha por seta, recebeu setas na porta de entrada e nos hotspots do salao, pecas mais altas e contraste melhor entre brancas e pretas.
- Controles de camera de Damas e Xadrez viraram uma bolinha direcional com icone de camera no centro, botoes de giro, subir/descer e zoom, preservando arrasto/toque na mesa.
- Ajuste posterior `20260520-polishcam2`: reduziu o tamanho/altura das pecas do Xadrez depois da captura mostrar que ficaram grandes demais.
- Build local: `20260520-polishcam1`.
- Validacao local: `node --check` em `pubpaid-phaser/ui/domGameInterface.js`, `pubpaid-phaser/app.js`, `pubpaid-phaser/scenes/StreetScene.js`, `pubpaid-phaser/scenes/InteriorScene.js` e `server.js`; `npm run guard:pubpaid`; `git diff --check`; smoke Xadrez mobile e desktop; smoke Damas desktop e mobile.
- Evidencias locais: `.codex-temp/chess3d-mobile.png`, `.codex-temp/chess3d-desktop.png`, `.codex-temp/checkerscam-desktop.png` e `.codex-temp/checkerscam-mobile.png`.

## Rodada Atual - 20260520-poolmobileintro1

- Sinuca/Vale Pool manteve a arte aprovada e recebeu entrada curta com taco batendo na bola branca, explosao de pixels e revelacao da mesa.
- Mobile/touch agora joga em duas etapas: o primeiro toque depois de mirar abre a força, e o segundo toque solta a tacada.
- Mantidas as correcoes de `poolhand1`: fim correto do modo Livre quando sobram apenas a branca e `bola na mão` com posicionamento da branca antes da tacada.
- Build local: `20260520-poolmobileintro1`.
- Validacao: `node --check` em `games/vale-pool/game.js`, `pubpaid-phaser/ui/domGameInterface.js`, `pubpaid-phaser/services/pvpService.js`, `pubpaid-phaser/app.js` e `server.js`; `npm run guard:pubpaid`; `git diff --check`; `/api/pubpaid/build` na porta 3001 respondeu `20260520-poolmobileintro1`; Playwright mobile landscape confirmou `MIRANDO` + etapa `forca` no primeiro toque e `TACANDO` no segundo.
- Evidencias: `.codex-temp/vale-pool-poolmobileintro1/intro.png`, `.codex-temp/vale-pool-poolmobileintro1/mobile-power-stage.png` e `.codex-temp/vale-pool-poolmobileintro1/mobile-shot-released.png`.

## Rodada Atual - 20260520-chessstyle1

- Xadrez PubPaid recebeu o mesmo ritmo visual aprovado na Damas: arena mais cinematica, mesa com luzes, texto centralizado no fluxo existente e leitura mais clara da vez do adversario.
- Na Demo, o jogador fica com as brancas; a maquina joga de pretas, pensa por 3 segundos, destaca origem/alvo do lance e so depois executa o movimento, liberando a vez do jogador novamente.
- Mantido o fluxo padrao PubPaid: Demo como treino local sem ficha/carteira e PvP pelo matchmaking/ready real.
- Build local: `20260520-chessstyle1`.
- Validacao: `node --check` em `pubpaid-phaser/ui/domGameInterface.js`, `pubpaid-phaser/app.js` e `server.js`; `npm run guard:pubpaid`; `git diff --check`; servidor local na porta 3002 respondeu `/api/pubpaid/build=20260520-chessstyle1`; Playwright mobile landscape confirmou 64 casas, 32 pecas, IA pensando com preview, `moveCount` parado no meio da pausa e lance aplicado depois.
- Online: Render respondeu `/api/pubpaid/build=20260520-chessstyle1` e o smoke mobile landscape tambem passou no Render.
- Evidencias: `.codex-temp/chessstyle-mobile.png` e `.codex-temp/chessstyle-mobile-render.png`.
- Observacao: a ordem posterior sobre postar noticias em grupo de vendas foi cancelada pelo usuario e deve ser ignorada.

## Rodada Atual - 20260520-chess3d1

- Correcao de direcao: o usuario rejeitou a primeira versao do Xadrez por parecer uma janela pequena; o objetivo correto era replicar o modelo visual 3D aprovado na Damas.
- Xadrez Demo agora usa mesa grande em perspectiva, frame 3D, pecas volumosas, luzes de arena, rotação automatica para a vez adversaria, botões de camera e suporte a zoom/arrasto.
- Mantido o comportamento que ja estava aprovado: IA da Demo pensa por 3 segundos, destaca origem/alvo, executa o lance e libera a vez do jogador.
- Build local: `20260520-chess3d1`.
- Validacao local: `node --check`, `npm run guard:pubpaid`, `git diff --check`, smoke Playwright mobile landscape com frame 3D/camera/IA e smoke desktop com mesa grande.
- Online: Render respondeu `/api/pubpaid/build=20260520-chess3d1` e o smoke mobile landscape online tambem passou com frame 3D, 5 controles de camera, rotacao aplicada, 64 casas, 32 pecas e IA com pausa de 3 segundos.
- Evidencias: `.codex-temp/chess3d-mobile.png`, `.codex-temp/chess3d-desktop.png` e `.codex-temp/chess3d-render-mobile.png`.

## Rodada Atual - 20260520-chessfull1

- Nova regra do usuario: Xadrez deve ser sempre tela cheia, sem aparecer como quadro dentro de pagina.
- O modo chess agora fixa a arena em `100dvw x 100dvh`, esconde header/placar/acoes externas e deixa o painel lateral como overlay; em mobile landscape a mesa 3D toma o viewport inteiro.
- Build local: `20260520-chessfull1`.
- Validacao local: `node --check`, `npm run guard:pubpaid`, `git diff --check`, smoke Playwright mobile landscape e smoke desktop.
- Evidencias locais: `.codex-temp/chess3d-mobile.png` e `.codex-temp/chess3d-desktop.png`.

## Rodada Atual - 20260520-checkersai1

- Damas Demo ficou mais legivel na vez da IA: a maquina entra em estado `Máquina pensando...`, segura a jogada por 3 segundos, destaca a peça de origem e a casa alvo, e só depois executa o movimento.
- Entrada PubPaid recebeu loader antes da intro: ao tocar para entrar, a tela mostra carregamento de 0 a 100% e só então abre a intro, reduzindo risco de tela preta entre splash e Phaser.
- Build local: `20260520-checkersai1`.
- Validação: `node --check` em `pubpaid-phaser/app.js`, `pubpaid-phaser/ui/domGameInterface.js`, `pubpaid-phaser/scenes/BootScene.js` e `server.js`; `npm run guard:pubpaid`; `git diff --check`; Playwright mobile landscape confirmou loader `100%`, IA com status de 3 segundos, preview visual e `moveCount` parado no meio/avançando após a pausa.
- Evidência: `.codex-temp/checkersai-mobile.png`.

## Rodada Atual - 20260520-poolhand1

- Sinuca/Vale Pool recebeu correção de fim de mesa no modo Livre: quando acabam as bolas de ataque e fica só a branca, o jogo entra em `FIM` e mostra vencedor/empate.
- Falta de bola branca agora aplica `bola na mão`: o adversário ganha a vez e pode posicionar a branca antes de tacar.
- Na Demo, quando a IA ganha bola na mão ela posiciona automaticamente; quando o jogador ganha, o primeiro clique na mesa posiciona a branca e o clique seguinte joga.
- No PvP, o servidor grava `ballInHandSeat`; o cliente envia `cueX/cueY` para a próxima tacada e bloqueia o tiro até o jogador posicionar a branca.
- Build local: `20260520-poolhand1`.
- Validação: `node --check` em `games/vale-pool/game.js`, `pubpaid-phaser/ui/domGameInterface.js`, `pubpaid-phaser/services/pvpService.js`, `pubpaid-phaser/app.js` e `server.js`; `npm run guard:pubpaid`; `/api/pubpaid/build` respondeu `20260520-poolhand1` na porta 3001; Playwright direcionado confirmou `bolaNaMao: player -> ""` após posicionar e modo Livre vazio encerrando em `FIM`.
- Evidências: `.codex-temp/vale-pool-poolhand1/ball-in-hand-placed.png` e `.codex-temp/vale-pool-poolhand1/free-mode-finished.png`.

## Rodada Atual - 20260520-checkerscam1

- Damas PubPaid recebeu a direção do CSV `C:\Users\junio\Downloads\table-1779287972054.csv`.
- Mantido o fluxo padrão: card único de Damas, `Demo` como treino local sem ficha/carteira e `PvP` pelo matchmaking/ready real.
- Arena de Damas ganhou intro cinematica em DOM/CSS, moeda de abertura, controles de câmera, zoom por wheel, rotação/pan pela moldura, virada suave da câmera para o adversário quando a vez muda, luzes/colunas e SFX extra para moeda/coroação.
- Correção posterior: textos centralizados e a moeda agora bloqueia só durante a abertura; ao terminar, ela some, re-renderiza o tabuleiro e libera a partida. O fim de jogo continua no fluxo normal de resultado.
- Build local: `20260520-checkerscam1`.
- Validação: `node --check` em `pubpaid-phaser/ui/domGameInterface.js`, `pubpaid-phaser/app.js` e `server.js`; `npm run guard:pubpaid`; `git diff --check`; servidor local na porta 3002 respondeu `/api/pubpaid/build=20260520-checkerscam1`; Playwright smoke passou em desktop 1280x720 e mobile landscape 844x390 com `cells=64`, `enabledCells=64`, `coinHidden=true` e painel dentro do viewport.
- Observação: revisar visual manualmente em `http://127.0.0.1:3002/pubpaid.html?v=20260520-checkerscam1&review=damas` e validar PvP real em duas sessões autenticadas antes de fechar fluxo financeiro.

## Rodada Atual - 20260520-poolturn1

- Sinuca/Vale Pool manteve a arte aprovada e recebeu correção de execução no Par/Impar.
- Quando a bola branca cai, Demo e PvP passam a vez para IA/rival de forma explícita, sem prender a vez no jogador 1.
- Par/Impar agora comunica melhor os grupos: antes da primeira bola aparece `DEFINE GRUPO`; depois os cartões/HUD mostram `VOCE/RIVAL/IA: PAR` ou `IMPAR`.
- Após as escolhas da moeda, Demo e PvP exibem uma animação de `MODO ESCOLHIDO` antes do tutorial da modalidade.
- Build local: `20260520-poolturn1`.
- Validação: `node --check` em `games/vale-pool/game.js`, `pubpaid-phaser/ui/domGameInterface.js`, `server.js` e `pubpaid-phaser/app.js`; `npm run guard:pubpaid`; `/api/pubpaid/build` respondeu `20260520-poolturn1` na porta 3001; Playwright capturou animação e tutorial Par/Impar sem erro.
- Evidências: `.codex-temp/vale-pool-poolturn1/mode-reveal.png` e `.codex-temp/vale-pool-poolturn1/tutorial.png`.

## Rodada Atual - 20260520-poolrules1

- Sinuca/Vale Pool manteve a arte aprovada e recebeu clareza jogavel das regras dentro da HUD.
- Cartoes laterais do jogador/Robo IA/PvP agora mostram a regra ativa do modo: Livre, Brasileira ou Par/Impar.
- Botao `REGRAS` nos cartoes abre manual pop-up com alvo permitido, pontuacao, faltas e condicao de vitoria; fechar retorna direto para a partida.
- Livre mostra regra viva `qualquer bola 1-9`; Brasileira mostra a menor bola viva como `bola da vez`; Par/Impar mostra `1a bola define PAR/IMPAR`, depois grupo PAR/IMPAR e bolas restantes do grupo.
- Servidor PvP ja define grupo PAR/IMPAR pela primeira bola encaçapada valida e agora devolve mensagem explicita de grupo definido.
- Build local: `20260520-poolrules1`.

## Rodada Atual - 20260519-standalone-pool11

- Sinuca/Vale Pool deixou de ser tratada como teste e foi promovida como build ativo do PubPaid.
- Caçapas abertas visualmente para o lado do pano, removendo o fechamento superior que dificultava a leitura da boca.
- Captura real ampliada no prototipo e no PvP do servidor; a detecção agora considera o trajeto entre frames para a bola cair em vez de bater na boca e voltar.
- Build local: `20260519-standalone-pool11`.

## Rodada Atual - 20260519-standalone-pool10

- Sinuca/Vale Pool recebeu moeda animada e fluxo complementar: vencedor da moeda escolhe apenas `ser primeiro` ou `modalidade`; perdedor escolhe a parte restante.
- Depois das escolhas, Demo/IA e PvP mostram tutorial curto da modalidade antes da mesa.
- Demo/IA só começa depois de `COMEÇAR PARTIDA`; PvP só libera tacada depois que os dois jogadores confirmam o tutorial.
- Conhecimento repassado para a equipe de jogos em `.codex-agents/game-director-system/projects/vale-pool.md` e para a skill `game-director-general/references/pool-modalities.md`.
- Build local: `20260519-standalone-pool10`.

## Rodada Atual - 20260519-standalone-pool8

- Sinuca/Vale Pool recebeu modalidades jogaveis: Livre, Brasileira e Par/Impar.
- Fluxo inicial consolidado para Demo/IA e PvP: joga moeda; vencedor escolhe comecar ou escolher modalidade; quem escolhe modalidade joga por segundo.
- Livre usa branca + bolas 1-9 e placar `BOLAS`.
- Brasileira usa branca + sete coloridas oficiais (1 vermelha, 2 amarela, 3 verde, 4 marrom, 5 azul, 6 rosa, 7 preta), bola da vez menor em mesa e placar `PONTOS`; bola 9 nao entra neste modo.
- Par/Impar usa branca + bolas 2-15, primeiro encaçape define grupo PAR/IMPAR e a 15 fecha/castiga.
- PvP ganhou endpoint `/api/pubpaid/pvp/pool/setup`, estado de escolha inicial no servidor, rack por modalidade e bloqueio de tacada antes de finalizar a moeda/modalidade.
- Conhecimento consolidado na skill `game-director-general`: `C:\Users\junio\.codex\skills\game-director-general\references\pool-modalities.md`.
- Build local: `20260519-standalone-pool8`.
- Validacao: `node --check` em `games/vale-pool/game.js`, `pubpaid-phaser/ui/domGameInterface.js`, `pubpaid-phaser/services/pvpService.js` e `server.js`; `npm run guard:pubpaid`; servidor local respondeu `/api/pubpaid/build=20260519-standalone-pool8`; capturas no in-app browser confirmaram moeda, escolha inicial, menu de modalidades e modo Brasileira com 7 bolas.
- Evidencias: `.codex-temp/vale-pool-pool8-moeda.png`, `.codex-temp/vale-pool-pool8-moeda-tentativa2.png`, `.codex-temp/vale-pool-pool8-modalidades.png`, `.codex-temp/vale-pool-pool8-brasileira.png`.

## Rodada Atual - 20260519-standalone-pool5

- Sinuca PubPaid substituida pelo prototipo aprovado `Vale Pool Round2`, agora promovido para `games/vale-pool/` e embutido no PubPaid por iframe controlado.
- Fluxo Demo preservado: entra no prototipo sem ficha, sem escrow e sem carteira. Fluxo PvP preservado: servidor continua dono do estado, com fotos/nomes Google dos dois jogadores em paineis laterais fora do jogo.
- O jogo tem 1 bola branca e 9 bolas de jogo em rack compacto, todas do mesmo tamanho, e lista `BOLAS FORA` no HUD.
- Musica relaxante 16-bit estilo Super Nintendo adicionada ao prototipo; por politica do navegador ela inicia apos interacao do jogador.
- Correção funcional: Demo recebeu eventos de mouse/teclado no iframe, jogador vs Robo IA, fotos/avatares externos, mira por mouse/teclado, ponto de batida na bola branca por HUD/teclas 1-5, historico de jogadas e fisica de efeito relativa a tacada.
- Corte de HUD: bloco superior esquerdo agora mostra `VEZ` em vez de pontuacao; placar do single player fica nos cartoes laterais Jogador/Robo IA, atualizados por `vale-pool:demo-state`.
- Controle de efeito: ponto vermelho clicavel livremente dentro da bola branca do HUD; ao voltar para `CENTRO` ele recentraliza, e o vetor do ponto de impacto altera a fisica da tacada.
- Correção rápida: pontuação abstrata removida da leitura principal; cartões laterais agora mostram explicitamente `BOLAS` encaçapadas e a regra declarada e Bola 9.
- Fisica de caçapa corrigida no prototipo: a boca captura antes do repique no trilho e teste dirigido confirmou a branca caindo/respawnando.
- Responsividade ampliada: iframe/jogo usam mais largura em desktop e mantem proporcao 16:9 para mobile horizontal.
- Força reforçada: velocidade base e pico da tacada aumentados para a barra ter impacto perceptivel.
- Build local: `20260519-standalone-pool5`.
- Validacao: `node --check` em `games/vale-pool/game.js`, `pubpaid-phaser/ui/domGameInterface.js` e `server.js`; `npm run guard:pubpaid`; teste funcional Playwright no PubPaid com `pointerEvents=auto`, efeito `DIR`, mira mudando, tacada do jogador, resposta da IA, cartoes laterais atualizados e retorno para `MIRANDO`; teste dirigido de caçapa com branca caindo/respawnando; cliente `develop-web-game` com screenshot e estado direto do prototipo.
- Evidencias: `.codex-temp/pubpaid-vale-pool-effect-control.png`, `.codex-temp/pubpaid-vale-pool-demo-functional.png`, `.codex-temp/pubpaid-vale-pool-pocket-test.png`, `.codex-temp/web-game-vale-pool/shot-1.png`, `.codex-temp/vale-pool-public-demo.png`, `.codex-temp/pubpaid-vale-pool-demo.png` e `.codex-temp/pubpaid-vale-pool-pvp.png`.

## Rodada Atual - 20260519-poolreal1

- Sinuca PubPaid refeita pela referencia de mesa real enviada pelo usuario: caçapas agora aparecem como bocas integradas na madeira/borracha, nao como circulos soltos no feltro.
- A faixa `Sinuca demo`/treino livre foi removida de cima da mesa em todos os tamanhos; informacao fica no painel inferior.
- Painel inferior ganhou lista `bolas encaçapadas`, preenchida pelas bolas que caem durante a partida.
- Build local: `20260519-poolreal1`.
- Validacao: `/api/pubpaid/build=20260519-poolreal1`, `node --check`, `npm run guard:pubpaid`, `node .codex-temp/pubpaid-mobileopt-check.mjs` com `failed=[]`, `demoPoolHeroVisible=false`, `demoPoolPocketedVisible=true` e `music=off`.
- Evidencias: `.codex-temp/pubpaid-mobileopt-pool-844x390.png` e `.codex-temp/pubpaid-poolreal1-pocketed-list.png`.

## Rodada Atual - 20260519-poolfix2

- Sinuca PubPaid ajustada pelo PNG de revisao: caçapas fisicas e DOM ficaram embutidas na mesa, mesa centralizada em mobile landscape e topbar global escondida durante Sinuca para nao haver informacao em cima da mesa.
- Build local: `20260519-poolfix2`.
- Validacao: servidor reiniciado na porta 3000, `/api/pubpaid/build` respondeu `20260519-poolfix2`; `node --check` em `PoolGameScene.js`, `domGameInterface.js`, `app.js` e `.codex-temp/pubpaid-mobileopt-check.mjs`; `npm run guard:pubpaid`; `node .codex-temp/pubpaid-mobileopt-check.mjs` passou com `failed=[]`, `music=off`, retrato bloqueado e paisagem responsiva.
- Evidencias: `.codex-temp/pubpaid-mobileopt-pool-844x390.png` e `.codex-temp/pubpaid-mobileopt-report.json`.

## Regra De Existencia

So existe um projeto de jogo PubPaid no Codex: o PubPaid 2.0 canonico, servido por `/pubpaid.html`.

O nome publico pode continuar PubPaid, mas tecnicamente nao ha PubPaid 1.0 ativo, demo separada, rota antiga de trabalho ou laboratorio anexado ao runtime.

## Canon PubPaid

- URL canonica: `/pubpaid.html`
- Compatibilidade antiga: `/pubpaid-v2.html` redireciona para `/pubpaid.html`
- Runtime: `pubpaid-phaser/`
- Shell: `pubpaid.html`
- Estilo: `pubpaid-phaser.css`
- Backend: `server.js`
- Carteira: `pubpaid-runtime.js` e `data/pubpaid-store.json`
- PvP: `data/pubpaid-pvp.json`
- Admin: `pubpaid-admin.html`

## O Que Virou Lixo

- `pubpaid-v2.js`, `pubpaid-v2.css` e `pubpaid-phaser.html` foram removidos.
- Prompts, relatorios, screenshots antigas, jogo externo de roleta e artefatos de validacao antigos foram removidos do Git.
- `CODEX_MEMORY.md`, `.codex-memory/current-state.md`, `.codex-memory/handoff.md`, `.codex-memory/orders.json`, `.codex-memory/assets.json` e `progress.md` foram reduzidos para o estado vivo atual.

## Regras De Trabalho

- Modo economico por padrao: leitura minima, respostas curtas e validacao proporcional.
- Nao abrir memorias extensas, docs grandes, auditorias ou varreduras amplas sem necessidade clara do pedido.
- Gastar contexto pesado apenas em PubPaid, homepage/CZS, deploy, revisao grande ou mudanca com risco real.
- Tratar jogo como jogo e site como site: estao no mesmo repo, mas sao frentes diferentes.
- Nao aplicar agentes, regras editoriais, revisao de cards/homepage ou contexto do site ao jogo, exceto se o usuario pedir explicitamente.
- Nao usar demo money nem IA local como prova de PvP.
- Demo local e permitido apenas como treino/teste visual separado, sem ficha, sem escrow, sem carteira e sem alterar saldo.
- Nao considerar teste API isolado como prova de jogo real.
- Validar PvP em duas sessoes autenticadas diferentes sempre que mexer no fluxo.
- Nao usar laboratorio, criador de imagem, prompt antigo ou screenshot antiga como fonte de verdade.
- Antes de validar PubPaid: `npm run guard:pubpaid`.

## Sistema Diretor De Jogos

- Skill global: `game-director-general`
- Prompt mestre: `.codex-agents/game-director-system/master-prompt.md`
- Fluxo: `.codex-agents/game-director-system/flow.md`
- Estudo inicial: `.codex-agents/game-director-system/study-report-2026-05-18.md`
- Manifestos: `.codex-agents/agents/game-*.md`
- Hierarquia: usuario acima; Codex/Hermes como ferramentas finais; Diretor Geral coordena; Conselho Tecnico Nerd alimenta; Diretor do Jogo lidera operacao; subagentes executam/revisam.
- Subagentes diretos: arte/design de games, interfaces/HUD, teste/seguranca gamer e linha final.
- Escritorio Nerd pode alimentar conhecimento tecnico, mas nao mistura direcao de jornal/CZS com direcao de jogos.
- Erros e acertos em jogos devem virar loop de aprendizado/reaprendizado antes de repetir implementacao.

## Direcao De Arte PubPaid

- Anchor oficial de arte: `assets/game-director-demo/realistic-host-spritesheet.png`. O caminho antigo em `.codex-temp/pixellab-tests/realistic-host-walk-demo/assets/realistic-host-spritesheet.png` ficou apenas como origem historica e pode nao existir em retomadas novas.
- Tudo novo deve parecer da mesma familia desse personagem: pixel art com leitura de sprite, mas volume, roupa, luz, proporcao e presenca super realistas.
- Nao aceitar arte chibi simples, cubo, cartoon infantil, pixel art flat demais ou pintura HD borrada.
- Criterio pratico: pixel art realista com contorno, sombra, roupa detalhada, corpo humano crivel e estrutura pronta para spritesheet/animacao.
- Personagens e NPCs devem ser adultos, expressivos, em escala e detalhamento coerentes com o anchor, com pose natural.
- Rua, cenario e props devem seguir pixel art realista com luz, textura, profundidade, volume e material legivel.
- HUD deve parecer premium e especifico do PubPaid, sem cara generica.
- Animacoes devem usar poucos frames, mas com peso realista e pes bem ancorados.

## Proximo Foco

1. Usuario revisar o PubPaid `20260519-mobileland1`; regra final mobile atual: celular deve jogar em horizontal, retrato bloqueia com gate.
2. Se o usuario quiser mais realismo no Xadrez, proximo corte natural e relogio de xadrez, promocao com escolha de peca e mais refinamento visual das pecas.
3. Manter PubPaid focado em Sinuca, Damas e Xadrez; os outros jogos continuam apenas no backup `backups/pubpaid-disabled-games-20260519-1235`.
4. Validar PvP em duas sessoes autenticadas diferentes sempre que mexer no fluxo real de carteira/fila.

## Ultima Rodada Validada

- Build local: `20260519-mobileland1`.
- Otimizacao PubPaid mobile: BootScene deixou de pre-carregar frames de intro nao usados e imagens grandes de jogos/salas fora do corte atual; o app evita limpar caches/service workers quando a build local ja coincide; URLs de assets da rua/damas foram alinhadas para evitar download duplicado.
- Regra de orientacao final: em celular/touch, retrato volta a bloquear com `Mude para horizontal`; o jogo so segue em paisagem. A Sinuca nao deve ser jogada em retrato.
- Build local: `20260521-premiumgames2`.
- Damas/Xadrez PubPaid: xadrez ganhou moeda/coin toss visual tambem no treino, com quem comeca e cor das pecas; Damas/Xadrez mostram `Movimento feito...` por 1,5s antes da virada/IA; botoes `Mesas` voltam ao lobby e timers de IA/intro sao limpos ao sair.
- Cache/entrada PubPaid: removido `Clear-Site-Data` do header PubPaid, build atualizado para `20260521-premiumgames2`, assets do BootScene agora usam `window.pubpaidBuildVersion`, e o app aquece cache local seguro (`pubpaid_safe_runtime_cache`) de CSS/JS/assets nao sensiveis enquanto continua checando `/api/pubpaid/build` com `no-store`.
- UI premium: camera ficou discreta por drag/touch/mouse, sem bolinha grande; Xadrez recebeu avatares, intro com moeda, fundo mais rico e tabuleiro reduzido para nao cobrir sidecar; Damas foi reduzida no desktop, manteve pedras redondas/contraste e esconde o gate de orientacao quando a mesa ja esta ativa.
- Indicadores PubPaid: porta/garcom/NPCs seguem como brilho premium sem setas ou caixas duras; brilho do garcom fica visivel mesmo sem chegar perto.
- Validacao local: servidor `PORT=3002`, `/api/pubpaid/build` respondeu `20260521-premiumgames2`; `node --check` em `domGameInterface.js`, `app.js`, `BootScene.js`, `StreetScene.js`, `InteriorScene.js` e `server.js`; `npm run guard:pubpaid`; `git diff --check`; Playwright desktop/mobile landscape para Damas e Xadrez sem erros de console, 64 casas, loading 100%, cache local preenchido, `Mesas` visivel e retorno ao lobby confirmado.
- Evidencias: `.codex-temp/premiumgames2-checkers-desktop.png`, `.codex-temp/premiumgames2-checkers-mobile-landscape.png`, `.codex-temp/premiumgames2-chess-desktop.png`, `.codex-temp/premiumgames2-chess-mobile-landscape.png`, `.codex-temp/premiumgames2-chess-desktop-intro.png`.

- Responsividade em paisagem mantida para Lobby, Xadrez, Damas e Sinuca; o botao de audio fica oculto durante mesas para nao cobrir HUD/placar.
- Validacao local: servidor reiniciado na porta 3000, `/api/pubpaid/build` respondeu `20260519-mobileland1`; `node --check` em `app.js`, `BootScene.js`, `domGameInterface.js` e script de validacao; `npm run guard:pubpaid`; Playwright confirmou bloqueio em retrato 375x667, lobby em 667x375, Xadrez em 667x375, Damas em 640x360 e Sinuca em 844x390, todos com `music=off` e sem overflow.
- Evidencias: `.codex-temp/pubpaid-mobileopt-portrait-gate-375x667.png`, `.codex-temp/pubpaid-mobileopt-pool-844x390.png`, `.codex-temp/pubpaid-mobileopt-report.json` e `.codex-temp/web-game-mobileland/state-1.json`.

- Build local: `20260519-chesspro1`.
- Xadrez PubPaid profissionalizado com `chess.js` no Demo e no PvP: lances legais, SAN, xeque/mate/empate, roque, en passant, promocao, lista de lances legais e lances obrigatorios quando ha xeque ou lance unico.
- UI do Xadrez ganhou maozinha animada, destaque de origem/destino legal, rei em xeque, ultimo lance, historico lateral e cues sonoros de movimento/captura/xeque/mate. Audio permanece desligado por padrao.
- Validacao local: servidor reiniciado na porta 3000, `/api/pubpaid/build` respondeu `20260519-chesspro1`; `node --check` em `server.js`, `domGameInterface.js` e `chipTechSoundtrack.js`; `npm run guard:pubpaid`; Playwright confirmou 32 pecas, 10 origens legais no inicio, historico `e4`, cenario de xeque `Qh5+` com lance obrigatorio `g7-g6`, `LIGAR SOM` e `music=off`.
- Evidencias: `.codex-temp/pubpaid-chesspro1-after-e4.png` e `.codex-temp/pubpaid-chesspro1-forced-check.png`.

- Build local: `20260518-gamescomplete3`.
- Ajuste pontual de controles PubPaid: a Sinuca agora mostra `Use Espaço para jogar`; no celular mostra `Celular: toque em Jogar`; o botão touch da Sinuca ficou `Jogar`; os botões mobile globais ficaram `Caixa` e `Jogar`.
- Validação local: servidor reiniciado na porta 3000, `/api/pubpaid/build` respondeu `20260518-gamescomplete3`; `node --check`; `npm run guard:pubpaid`; Playwright confirmou os textos/botoes e gerou `.codex-temp/pubpaid-gamescomplete3-pool-controls.png` sem erros de console.

- Build local: `20260518-gamescomplete2`.
- Parte de jogos PubPaid fechada localmente: todos os 7 jogos do lobby têm `Treino` e `Real`.
- Treinos locais novos adicionados para `Xadrez`, `21`, `Pôquer`, `Truco` e `Dados`; os treinos não usam ficha, não travam saldo e não mexem na carteira. Sinuca e Damas preservam seus treinos existentes.
- Textos visíveis revisados para português: removidos termos públicos como `Lobby`, `Demo`, `Draw Poker`, `Desktop/Mobile`, `PvP real`, `backend` e `escrow` dos arquivos do jogo conferidos.
- Validação local: servidor reiniciado na porta 3000, `/api/pubpaid/build` respondeu `20260518-gamescomplete2`; `node --check`; `npm run guard:pubpaid`; `git diff --check`; Playwright confirmou 7 botões `Treino`, treino de Pôquer abrindo sem erros de console e sem vazamento dos termos buscados.

- Build local: `20260518-cardtables1`.
- Jogos de cartas PubPaid: primeira reforma visual/fluxo aplicada em `21`, `Poker` e `Truco`. O lobby ganhou o card `21`; as mesas agora usam DOM tematico com feltro, cartas com naipe/cantos/pip, verso para cartas ocultas, area do rival, area central e mao do jogador.
- Poker: fluxo visual de segurar/trocar cartas com mão do rival virada e botao `Trocar cartas soltas`.
- Truco: fluxo visual com placar, mao atual, cartas na mesa e cartas ja jogadas.
- 21: fluxo visual com total da mao, cartas do rival parcialmente ocultas e acoes `Comprar carta` / `Parar`.
- Os subagentes chamados para auditoria/UX bateram limite de uso; a implementacao continuou localmente.
- Validacao local: servidor reiniciado na porta 3000, `/api/pubpaid/build` respondeu `20260518-cardtables1`; `node --check` em `domGameInterface.js`, `pvpService.js` e `server.js`; `npm run guard:pubpaid`; `git diff --check`; Playwright gerou `.codex-temp/pubpaid-cardtables1-preview.png` sem erros de console.

- Build local: `20260518-withdrawrules1`.
- Carteira PubPaid: removido o cartão inclinado `PubPaid Pay`; no lugar ficou um aviso simples e discreto sobre saques.
- Saque PubPaid: agora exige chave Pix e nome da conta Pix, limita o pedido ao saldo livre, envia o pedido para conferencia do admin, informa prazo de ate 2 horas e deixa claro que o Pix so cai depois da conferencia do nome da conta Pix.
- Indicadores do jogo: rua/porta de entrada e garçom receberam bolinhas pequenas e discretas de interação, sem voltar com nomes/circulos grandes no chão.
- Validacao local: servidor reiniciado na porta 3000, `/api/pubpaid/build` respondeu `20260518-withdrawrules1`; `node --check` em `server.js`, `pubpaid-runtime.js`, `accountService.js`, `walletInterface.js`, `StreetScene.js`, `InteriorScene.js`, `app.js`, `BootScene.js` e `domGameInterface.js`; `npm run guard:pubpaid`; `git diff --check`; Playwright da carteira confirmou bloqueio de saque acima do saldo livre sem erros de console.

- Build local: `20260518-cleanselect1`.
- Limpeza visual pontual: removidos nomes, circulos, bolas/aneis de hotspot e indicador do garçom no chão do salão; a seleção de avatar também perdeu o piso/label `AVATAR 1/2` e a barra de marcação no chão.
- As áreas clicáveis continuam funcionando, mas sem desenho por cima do piso.
- Validação local: servidor reiniciado na porta 3000, `/api/pubpaid/build` respondeu `20260518-cleanselect1`; `node --check` em `CharacterSelectScene`, `InteriorScene`, `app`, `BootScene`, `domGameInterface`, `walletInterface` e `server`; `npm run guard:pubpaid`; Playwright abriu o salão limpo sem erros de console.

- Build local: `20260518-blackfix1`.
- Corrigida a tela/bloco preto que aparecia logo depois de apertar `Entrar`: a causa era uma mascara antiga da `IntroScene` para esconder texto removido, cobrindo o topo/esquerda da intro.
- A mascara foi removida e a versao de cache/build foi atualizada para `20260518-blackfix1`.
- Validacao local: servidor reiniciado na porta 3000, `/api/pubpaid/build` respondeu `20260518-blackfix1`; `node --check` em `IntroScene`, `app`, `BootScene`, `domGameInterface`, `walletInterface` e `server`; `npm run guard:pubpaid`; Playwright confirmou `Entrar -> intro limpa -> character-select` sem erros de console.

- Build local: `20260518-entryflow1`.
- UI de entrada limpa: removido o bloco visual de objetivo/prompt em desktop e mobile, removido o texto `Tocar para intro`, o botao principal agora mostra `Entrar`, o overlay `ENTER GAME` da intro foi removido e a zona de entrada da rua foi movida para a porta real sob o letreiro PubPaid sem circulo/marcador no chao.
- Fluxo de entrada: o botao `Entrar` agora reinicia a intro mesmo quando ela ja rodou antes; ao terminar, a intro dispara a entrada no jogo automaticamente sem exigir outro clique.
- Sinuca Demo e PvP: caçapas ficaram mais tolerantes, a deteccao acontece antes da parede rebater a bola e tambem considera o caminho entre frames para tacadas rapidas nao atravessarem a boca.
- Validacao local: `node --check` em app, BootScene, IntroScene, StreetScene, PoolGameScene, domGameInterface, walletInterface e server; `npm run guard:pubpaid`; HTML local sem `Tocar para intro`/`objetivo`; screenshot local sem overlay `ENTER GAME`; Playwright confirmou botao `Entrar`, fluxo `Entrar -> intro -> character-select/street`, porta sem marcadores visuais e as 6 caçapas encaçapando tacada rapida.

- Build local: `20260518-withdrawpix1`.
- Saque PubPaid agora exige chave Pix alem do valor: o formulario coleta a chave, o cliente bloqueia pedido sem Pix, o backend rejeita falta de Pix com `400`, grava `pixKey` no saque/campo `destination`/campo `payment` e devolve a chave no historico da carteira e na dashboard admin.
- Validacao local: `node --check` em `server.js`, `pubpaid-runtime.js`, `accountService.js` e `walletInterface.js`; `npm run guard:pubpaid`; `git diff --check`; teste API isolado em servidor temporario confirmou `400` sem Pix, `201` com Pix, chave no historico e saldo travado corretamente.

- Build local: `20260518-poolspace3`.
- Sinuca Demo e Sinuca PvP real agora usam o mesmo controle: no desktop, `Espaco` trava a mira, `Espaco` inicia a barra de forca e `Espaco` solta o taco; no mobile, controles laterais fazem as mesmas etapas por toque.
- Mesa da Sinuca foi centralizada e recebeu instrucao lateral `como jogar`; o mobile nao depende do botao inferior para tacar.
- Validacao local: `node --check` em `domGameInterface.js` e `PoolGameScene.js`, `npm run guard:pubpaid`, Playwright da Demo em desktop/mobile e PvP real com duas sessoes autenticadas. O PvP registrou `moveCount=1`, W.O. e settlement `108 x 90` a partir de `100 x 100`.

- Build local: `20260518-poolmodes1`.
- Sinuca virou uma unica mesa no lobby com dois caminhos internos: `Demo` e `PvP real`.
- `Demo` da Sinuca usa a cena fisica local, sem ficha, sem escrow e sem tocar na carteira; `PvP real` usa arena DOM dedicada, fila real, ready duplo e tacada calculada no backend.
- Validacao local com backend real isolado e duas sessoes autenticadas: Sinuca passou `waiting -> readying -> active`, aceitou tacada `/api/pubpaid/pvp/pool/shot`, finalizou por W.O. e liquidou carteiras em `108 x 90` a partir de `100 x 100`.
- Damas Demo mobile nao estava quebrando o motor: a falsa trava vinha de captura obrigatoria em cadeia sem feedback suficiente. Agora a peça forcada e auto-selecionada, a jogada legal fica destacada e a tela mostra `Continue a captura`.
- Playwright mobile landscape reproduziu 35 lances de Damas Demo depois da correcao sem travar; no ponto da captura em cadeia havia `forcedPiece`, 1 alvo valido e status explicito de continuidade.

- Build online: `20260518-checkersmodes2`.
- Damas agora e um unico card no lobby com dois caminhos internos: `Demo` e `PvP real`.
- `Demo` cria treino local contra maquina sem backend PvP, sem ficha, sem escrow, sem carteira e sem alterar saldo.
- `PvP real` limpa qualquer estado da demo antes de entrar na fila real; smoke online confirmou `checkersGame=none`, `pvpStatus=waiting`, `pvpGameId=checkers` e `join` chamado uma unica vez para Damas.
- Validado local e online com Google/carteira mockados: lobby tem 1 card de Damas, 1 botao Demo, 1 botao PvP real, 0 cards antigos separados, 64 casas no tabuleiro, sem overflow e sem erros de console.
- Commits publicados: `3715a553` unificou Damas Demo/PvP; `f237a3a5` limpou o estado da demo antes do PvP.

- Build local: `20260517-mobilefix1`.
- Mobile voltou a ter regra horizontal: portrait mostra gate de orientacao e nao abre intro/jogo antes de virar.
- Botao `Ligar som` deixou de abrir o jogo; com Google confirmado, o fluxo esperado e tocar no card/botao para abrir a intro.
- Damas Demo manteve treino local sem ficha/saldo, removeu grafico de mao, ganhou fundo de arena, pecas quadradas, placar mais visual, som de movimento e suporte melhor a tap.
- Layout de Damas em mobile landscape foi compactado para manter tabuleiro, score e botoes dentro do viewport, sem scroll.
- Teste Playwright local validou desktop, mobile landscape e mobile portrait; teste com Google mockado confirmou `Tocar para intro` e que audio nao inicia a intro.
- Online Render confirmou `/api/pubpaid/build` em `20260517-mobilefix1`; smoke online mobile landscape com Google mockado abriu intro pelo botao, manteve audio separado, moveu Damas Demo por tap, sem mao e sem overflow.

- Build local: `20260522-checkerstourney1`.
- Damas recebeu modo `Torneio` separado do Demo/PvP real. O torneio usa chaves diarias, 10 participantes de teste, check-in, chaveamento single elimination e partida de Damas com as regras oficiais, mas nao chama carteira, saldo, deposito, escrow ou backend financeiro.
- Horario oficial configurado no backend para 20:00-20:20 em `America/Rio_Branco`; em modo teste `tournamentTest=1`, as 10 chaves aparecem no painel e o fechamento pode ser simulado.
- UI nova em `pubpaid.html`/`domGameInterface.js`: botao `Torneio` no card de Damas, painel com chave/nome, lista de chaves de teste, bracket, confronto atual e retorno ao painel apos a partida.
- Responsividade: painel de torneio mobile portrait agora fica acima do gate de orientacao, sem overflow horizontal, com rolagem interna e botoes empilhados.
- Validacao local: `node --check` em JS tocado, `npm run guard:pubpaid`, `/api/pubpaid/build` em `20260522-checkerstourney1`, smoke API com 10 participantes -> 4 rodadas -> campeao, Playwright desktop/mobile e clique real na UI de chave/entrada sem erros de console. Nao versionar `data/pubpaid-tournaments.json`; ele e gerado em runtime.

- Build local: `20260522-gameux1`.
- Torneio de Damas agora tem inscricao real: reserva com Google confirmado, nome e WhatsApp, Pix/referencia de inscricao, pendencia no admin e aprovacao manual antes de liberar a vaga.
- A vaga fica presa a conta Google/WhatsApp aprovada; check-in abre uma hora antes e fecha as 20:00 no Acre. Apenas aprovados/confirmados entram no chaveamento.
- Admin PubPaid recebeu lista de inscricoes pendentes de torneio e rota `/api/pubpaid-admin/tournaments/checkers/review` para aprovar/rejeitar.
- Validacao local: `node --check`, `npm run guard:pubpaid`, `/api/pubpaid/build` em `20260522-gameux1`, smoke API `register -> admin dashboard -> approve -> join`, e Playwright com bloco de Pix/status visivel no painel.

- Build local: `20260522-chessmobile3`.
- Xadrez mobile corrigido para seguir a intro completa: preparacao, creditos e moeda visivel antes de liberar o tabuleiro.
- A chave de renderizacao do Xadrez agora inclui a fase da intro, evitando que o mobile fique preso em `Prepare-se` e esconda a moeda.
- Peças do Xadrez foram ajustadas no breakpoint mobile para ficarem dentro das casas; camera overlay continua sem setas/zoom, com apenas `Mesa fixa` visivel.
- Validacao local: `node --check` em `domGameInterface.js`, `app.js` e `server.js`; `npm run guard:pubpaid`; `git diff --check`; browser mobile 740x420 com 64 casas, 32 pecas, `outCount=0`, instrucao de toque, moeda visivel e jogada por toque/click de `b8` para `c6`.

- Build local: `20260522-mobilehud2`.
- HUD mobile dos jogos PubPaid revisado contra sobreposicao: no Xadrez treino, `Sair` foi removido por ser redundante com `Mesas`; a instrucao de camera/toque foi movida para o rodape esquerdo, sem disputar o topo com `Mesas` e `Mesa fixa`.
- Damas mobile landscape agora esconde a sidecar em telas ate 760px/430px, evitando invadir o tabuleiro e duplicar `Mesas`.
- Validacao Browser 740x420: Xadrez, Damas e Sinuca sem overlap de HUD essencial; Xadrez manteve 32 pecas dentro do tabuleiro; console sem erros.
- Validacao local: `node --check` em `domGameInterface.js`, `app.js`, `server.js`; `npm run guard:pubpaid`; `git diff --check`; `npm run review:team` com 42 apontamentos gerais existentes.

- Build local: `20260526-checkersai1`.
- Xadrez mobile: a moeda nao roda sozinha depois dos creditos; fica centralizada e clicavel, mostra face + quem comeca + cor inicial, e so entao libera o tabuleiro.
- Xadrez mobile: o tabuleiro volta a aparecer apos a moeda, com 64 casas e 32 pecas; as pecas 3D CSS foram centralizadas nas casas no breakpoint mobile, com volume por luz/sombra sem parecerem soltas.
- Xadrez mobile: placar visivel voltou ao HUD e computou lance real `e2-e4` como `1 lance`, cabendo em 844x390 sem sobrepor menus.
- Xadrez recebeu animacao visual de captura e estado de checkmate; Damas recebeu efeito de captura no ultimo destino.
- Damas e Xadrez agora usam o mesmo padrao de moeda clicavel antes de liberar a mesa, inclusive no demo local.
- Damas demo: quando a moeda escolhe a Maquina, o AI agora agenda e executa o primeiro lance logo que o tabuleiro e liberado; intro de Damas encurtada em 0,5s.
- Lobby dos jogos: cards visiveis centralizados no menu apos Sinuca sair do online.
- Audio: Phaser interno fica sem AudioContext proprio; o som customizado do PubPaid continua iniciando por gesto do jogador.
- Damas mobile landscape: HUD revisado para evitar menu sobre menu; `Mesas`, `Reiniciar demo`, `Mesa fixa` e painel de status ficam em cantos/zonas separadas, sem sobreposicao no teste.
- Sinuca foi retirada do online temporariamente: card escondido no lobby, botoes desabilitados e guardas no runtime bloqueando acesso direto.
- Validacao local: `node --check` em `domGameInterface.js`, `app.js` e `server.js`; `npm run guard:pubpaid`; `git diff --check`; `npm run review:team` com `totalIssues=0`; Playwright mobile 844x390 confirmou lobby sem Sinuca online, Damas sem overlaps, Xadrez com moeda e tabuleiro pos-moeda.

- Social CZS 2026-05-29.
- Instagram: 28 posts de noticias 28/29 e 38 stories intercalando noticias/propagandas foram publicados; story extra Cheffe Call confirmado. Bug corrigido no publicador de stories: o toque antigo acertava `Amigos Proximos`; o fluxo correto toca em `Seu story` e depois na seta azul.
- WhatsApp: 4 propagandas enviadas no grupo whitelisted `R.ALVES E REGIAO VENDAS...`, sem usar ventilador.
- Crescimento: seguir apenas baixa cadencia e curadoria local/nicho; evitar massa aleatoria. Leva do dia incluiu Mailza, prefeituras do Jurua e paginas regionais quando o botao de seguir estava visivel.
- Segunda rodada social CZS 2026-05-29 perto das 11h Acre: recaptura com 187 itens de hoje, 16 posts de feed limpos e 20 stories publicados.
- Stories da segunda rodada intercalaram 16 noticias com produtos diretos: Redmi Note 13, iPhone 11, TV e aluguel Meta Quest. Evidencia: perfil em 169 posts e story ativo; logs em `.codex-temp/instagram/premium-news-pack/recent-20260529-noon/`.

- RayX 2026-05-29: fase desktop operacional implementada. `dist/rayx/RayX.exe` agora abre o console Electron por padrao; `rayx desktop --check` valida Electron/preload/renderer; `rayx orchestrator cycle` atualiza estado local em `%LOCALAPPDATA%/RayX/state/orchestrator-state.json`; UI mostra adaptadores, workers, fila, eventos, perfis Chrome e status bruto.
- Validacao RayX: `node --check` em core/desktop, core/orchestrator, desktop/main, preload e renderer/app; `RayX.exe desktop --check` pronto; `RayX.exe status` retornou PC PLAY, Hermes parcial, Codex ok, Ollama ok e Chrome ok; `RayX.exe` sem argumentos abriu processo Electron com titulo `RayX`.
- RayX fase funcional: apos critica de que o console estava pouco acionavel, foram adicionados `rayx boot`, `rayx catalog`, `rayx hermes status|open|logs`, `rayx chrome-bridge status|launch|tabs`, `rayx profiles trust-local --permission allow`, testes Node `rayx:test` e botoes desktop para boot/catalogo/Hermes/Chrome-CDP.
- Chrome/CDP RayX: perfis Chrome locais ficaram `allow` em `%LOCALAPPDATA%/RayX/config/chrome-profiles.local.json`; `rayx chrome-bridge launch` abre sidecar controlavel em `%LOCALAPPDATA%/RayX/chrome-cdp-profile` na porta 9222. Validacao: `RayX.exe chrome-bridge status` retornou `CDP ativo: sim`, 13 perfis `allow` e abas listadas.
- RayX correcao conceitual: chat nao e camada separada; `rayx mission` e `rayx chat` agora usam um barramento unico que coleta doctor/catalogo/Hermes/Chrome em paralelo, declara lanes Codex/Hermes/Ollama/Chrome/shell/skills e devolve sintese unica em portugues. Validacao com `RayX.exe mission ... --no-llm` e com Ollama local (`llama3.2:3b`) respondeu em ~34s.
- RayX desktop workspace: para reduzir travamento, `rayx/desktop/main.js` passou a chamar o CLI por subprocessos `execFile` em vez de rodar diagnosticos pesados no processo visual. A UI ganhou conversa, compositor de missao, painel de evidencias e painel de atividade (`chatThread`, `evidenceList`, `activityList`). Validacao: `npm run rayx:test` com 6 testes, `RayX.exe desktop --check`, `RayX.exe mission ... --no-llm` e processo Electron `RayX` aberto.

## Ordem Executiva Social CZS - 2026-05-31

- Criados `docs/social/czs-executive-order-2026-05-31.md`, `docs/social/czs-instagram-news-standard-2026-05-31.md`, `docs/social/czs-growth-following-cleanup-2026-05-31.md` e `docs/social/czs-editorial-growth-formats-2026-05-31.md`.
- Nova regra do Instagram/Jornal: video de fonte primeiro, contexto claro, narracao curta quando util, imagem depois, propaganda intercalada e trilha jornalistica sem terror/suspense exagerado.
- Crescimento: parar de seguir perfis pessoais comuns; manter apenas nichos de jornal, noticias, fofoca, radio, politica regional, Acre, Vale do Jurua e Cruzeiro do Sul; sem automacao de massa.

## V8 Catálogo CZS - 2026-06-03 logo/colors/QA

- Protótipo principal revisado: `prototype-redesign-v8-portal-inteligente.backup-before-final-corrective-prompt-20260603.html`.
- Camada final: `assets/v8-final/v8-merge-ready.css` e `assets/v8-final/v8-merge-ready.js`.
- Aplicadas variações oficiais da marca: principal na intro, horizontal no topo/rodapé e ícone CZS+estrelas no mini-footer.
- Paleta travada em azul/amarelo/branco da logomarca; vermelho fica apenas para notícia urgente.
- Design ajustado para geometria quadrada/minimalista, sem dourado e sem cards transparentes.
- Corrigidos hero/fotos sem corte agressivo, ticker mobile, filtros mobile e feedback real dos escritórios da Cheffe Call.
- QA Playwright final: desktop/mobile `overflowX=0`, sem console errors, sem links antigos de `noticia.html`, reader V8 abrindo, busca funcionando e Cheffe registrando ações.
- URL local de revisão: `http://127.0.0.1:8790/prototype-redesign-v8-portal-inteligente.backup-before-final-corrective-prompt-20260603.html`.

## V8 Catálogo CZS - 2026-06-03 intro/RAIane/jovem/comercial

- Intro restaurada com a logo nova oficial e sem a cruz antiga; brilhos laterais carnavalescos trocados por fundo editorial com linha do rio, grade de mapa, sinais e notas fantasma.
- RAIane do chatbot ganhou poses por opção e fala curta via `speechSynthesis` apenas para botões/opções reais do chat; respostas digitadas continuam sem narração automática.
- Topo ganhou atalho `Venha jogar` após a marca, apontando para `pubpaid.html`, e links para Galeria, TV CZS e Área Jovem.
- Criados TV CZS Stories em formato 9:16, Área Jovem para PubPaid/games/animes/novelas/filmes/shows/agenda do Acre e lateral fechável com hashtags, mercado rápido e agenda.
- Landing comercial reformulada: botão perto da busca abre tela preta com RAIane, intro de vendas e página de números/ofertas no mesmo visual do V8.
- Cheffe Call recebeu layout de mesa de comando com prioridade, revisão, imagem, fonte, comercial e escritórios.
- Validação local: `node --check assets/v8-final/v8-merge-ready.js`, `node --check server.js`, `git diff --check` e `npm run review:team` passaram; revisão local auditou 209 arquivos com `totalIssues=0`.

## V8 Catálogo CZS - 2026-06-04 rodada corretiva screenshots

- Camada final atualizada em `assets/v8-final/v8-merge-ready.js` e `assets/v8-final/v8-merge-ready.css`; cache-buster renovado em `index.html` e `prototype-redesign-v8-portal-inteligente.html`.
- Topo recebeu crawl/ticker de manchetes entre logo e busca; ticker antigo voltou a ser preenchido; divisores de seção passaram de traços para bolinhas.
- CTA da marca mudou para vermelho `Venha apostar` com ícone de sinuca; no mobile a logo fica contida e o CTA aparece abaixo da marca.
- Compartilhar abre painel com WhatsApp, Instagram e copiar link; `Ver arquivo`/links antigos remapeiam para o arquivo V8.
- Intro agora tem logo grande persistente, RAIane em destaque e fluxo de uma vez por sessão de navegador; `skipIntro=1` ficou como atalho técnico para QA local.
- Cheffe Call saiu como acesso direto público: aparece em vermelho como sistema admin restrito, sem link para `cheffe-call.html`; a área pública virou `Escritórios de agentes`.
- TV CZS, galeria, pesquisa/newsletter, apoio local, rodapé e feed contínuo antes do rodapé foram reescritos para conversar com o layout V8.
- Validação local: `node --check assets/v8-final/v8-merge-ready.js`, `git diff --check` nos arquivos tocados e `npm run review:team` passaram; review-team auditou 210 arquivos com `totalIssues=0`. Screenshots headless confirmaram topo desktop/mobile.

## Social CZS - 2026-06-04 Instagram rodada final

- Instagram @catalogo_czs_: rodada do dia concluida com 19 stories e 9 feeds publicados via Android/BlueStacks.
- Sequencia: primeira leva 8 stories + 3 feeds; continuacao 5 stories + 3 feeds; rodada final silenciosa 6 stories + 3 feeds.
- Perfil final confirmou 225 posts e story ativo em `.codex-temp/zap-round-20260604/ig-profile-final-after-sleep-run.png`.
- Pacote final em `.codex-temp/zap-round-20260604-final/`, com allowlist manual de noticias/servicos e corte de itens sensiveis/fracos.
- Ajuste operacional: `post_instagram_manifest_feed.ps1` remove `;` do texto enviado via `adb shell input text` para evitar quebra de caption em titulos com ponto e virgula.

## V8 Catálogo CZS - 2026-06-04 deploy, captação 30 min e mídia

- Render preparado para publicar o V8 com captação de notícias a cada 30 minutos: `NEWS_REFRESH_AUTO_DISABLED=false`, `NEWS_REFRESH_INTERVAL_MS=1800000`, integridade de artigos ligada e topic feed automático a cada 30 minutos.
- Captura manual final atualizada antes do deploy: `scripts/capture-latest-news.js` retornou `ok=true`, 292 itens captados, 131 de hoje, 360 na janela ativa e 480 no arquivo.
- Parser de notícias agora separa vídeo de imagem em RSS/fontes diretas; vídeo entra como `videoUrl`/`media.type=video` e não é mais tratado como imagem quebrada.
- Matérias em `noticia.html`/`noticia.js` priorizam vídeo no hero quando a fonte traz mídia de vídeo; fotos continuam como poster/fallback e a legenda virou mídia da notícia.
- Home V8 ganhou stories em bolinhas com preview de vídeo e viewer vertical estilo stories, com fechar/anterior/próximo e link para matéria quando houver.
- Validação local passou com `node --check` nos arquivos críticos, `npm run review:team` com `totalIssues=0` e Playwright smoke desktop/mobile com screenshots em `output/playwright/czs-v8-stories-*.png`.
- Limpeza ampla ficou deliberadamente fora do deploy: `vendor/`, `tools/`, `.automation/` e assets antigos precisam de auditoria antes de remoção para não apagar material útil ou evidência aprovada.

## IA local CZS/Render - 2026-06-04 Ollama tunnel

- Backend passou a usar IA local-first: `CZS_AI_PRIMARY=ollama`, fallback OpenAI desligado por `CZS_OPENAI_FALLBACK_ENABLED=false`, modelo `qwen2.5:3b`.
- Render recebe `OLLAMA_BASE_URL` e `OLLAMA_AUTH_TOKEN` via script `scripts/ollama-render-tunnel.js --deploy`; o tunnel publico aponta para proxy local protegido em `127.0.0.1:11435`, sem expor Ollama cru.
- Criados scripts `ollama-secure-proxy.js`, `ollama-render-tunnel.js`, `start-ollama-render-tunnel.ps1` e instalador de inicializacao `install-ollama-render-tunnel-task.ps1`.
- Render publicou commit `f6d85d2a` e validacao publica confirmou `/api/rayl/chat`, `/api/office-ai/chat` e `/api/cheffe-call/ai` com `ai.status=online`, `provider=ollama`, `model=qwen2.5:3b`.
- Como Cloudflare quick tunnel troca URL ao reiniciar, o inicializador de usuario em Startup relanca o tunnel, atualiza Render e dispara deploy no login do Windows.

## Escritórios/Cheffe Call - 2026-06-04 recebimento de ordens

- `POST /api/office-orders` agora registra a ordem, chama a Cheffe/IA para despacho curto e distribui ações em `data/office-work.json` para os escritórios alvo.
- Alvos suportam lista por `target`, `to`, `office` ou `officeKey`; quando não informado ou `todos`, distribui para Redacao, Apuracao, Revisao, Comercial, Social, Design, PubPaid e Cheffe Call.
- Cheffe Call entra sempre como coordenadora quando a ordem vai para um alvo específico; recebe ação `received-order-cheffe` e os escritórios recebem `received-order`.
- Validação Render no commit `779a692`: ordem `ord-mpzzg0fweem126` ficou `distribuida`, com 4 ações online para `redacao, apuracao, revisao, cheffe-call`; leitura de `/api/office-work?officeKey=redacao` e `cheffe-call` confirmou as ações.

## RAIane chatbot helper - 2026-06-04 estudo do site

- RAIane agora usa `data/rayl-website-study.json` como estudo persistente do site antes de responder ao público.
- `GET /api/rayl/website-study` consulta/gera o estudo; `POST /api/rayl/website-study` com senha admin pede ao Ollama um resumo operacional para respostas prontas.
- `/api/rayl/chat` consulta o estudo primeiro. Se a pergunta bater em rota/resposta pronta, responde com atalho seguro; se não bater, retorna `human=true` para o frontend abrir WhatsApp com a dúvida do visitante.
- Validação Render no commit `ecf627b`: pergunta “Como faço para anunciar no site?” retornou `human=false`, `href=/divulgue.html`, `study.covered=true`, `ai.provider=ollama`; pergunta fora do estudo retornou `human=true` e mensagem de encaminhamento para WhatsApp.

## RAIane chatbot helper - 2026-06-04 voz e tom humano

- Respostas prontas de `server.js`, `data/rayl-website-study.json` e `assets/v8-final/v8-merge-ready.js` foram reescritas para tom mais humano, curto e conversado.
- Frontend da RAIane agora usa `speechSynthesis` quando o visitante clica em FAQ, rota ou envia pergunta digitada; a voz é opcional e prefere `pt-BR` quando o navegador oferece.
- Fallback fora do estudo deixou de inventar resposta e retorna somente atendimento humano, com `href` e `routeKey` vazios para não misturar WhatsApp com atalho de notícias.
- Validação local: pergunta de anúncio retornou `human=false`, `href=/divulgue.html`, resposta mais natural e `ai.provider=ollama`; pergunta fora do estudo retornou `human=true`, sem rota, e texto de WhatsApp pronto.

## V8 Catálogo CZS - 2026-06-04 acabamento final antes de subir

- CTA comercial perto do hero passou a entrar logo depois de `Mapa do site` com o texto pedido: `Oportunidade para vc e sua empresa`.
- Rodape social foi refeito para substituir os quadrados cortados `IG/WA/E-mail/Anun/Apos` por cards com rotulo e descricao.
- Intro recebeu trava anti-flash em `index.html` e release coordenado em `assets/v8-final/v8-merge-ready.js`, impedindo o site de aparecer atras do loader durante a hidratacao.
- RAIane comercial usa `assets/aylla/rayl-v2-clean/rayl-v2-present-full.png`, agora recortado/limpo; a prova visual em fundo escuro removeu o branco entre braco e corpo.
- Chatbot RAIane recebeu acabamento final: minimizado como janela circular de rosto sem fundo azul/texto, dock lateral oculto e avatar pequeno do cabecalho escondido quando o painel abre com o avatar grande.
- Validacao local: `node --check assets/v8-final/v8-merge-ready.js`, `node --check server.js`, `git diff --check`, `npm run review:team` com `totalIssues=0`, `npm run codex:health`, `npm run perf:budget` nao estrito e smoke CDP em `http://127.0.0.1:3000`.
- Relatorio interno: `.codex-temp/czs-v8-site-finish-qa-20260604/final-readiness-report.md`; decisao: pronto para revisao visual do usuario, sem deploy automatico antes de aprovacao porque o workspace segue com muitas mudancas paralelas e os gates editoriais gerais ainda existem.

## V8 Catálogo CZS - 2026-06-04 intro hard lock

- Usuario reportou que o site ainda aparecia 2x durante a intro; a trava anterior nao era suficiente durante a saida/fade do loader.
- `index.html` ganhou hard lock inline: enquanto `html.czs-intro-lock` estiver ativo, `body::before` cobre a tela, `#cinematicLoader` fica acima de tudo e os irmaos do loader ficam invisiveis.
- `assets/v8-final/v8-merge-ready.css` replica a trava no CSS principal e impede que `.v8-intro-exit` reduza a opacidade do loader antes do release real.
- Cache-buster e `V8_BOOT_VERSION` atualizados para `20260604-v8-intro-hardlock-v1`.
- Validacao CDP: `.codex-temp/czs-v8-intro-hardlock-20260604/intro-hardlock-report.json` retornou `pass=true`, `leaks=[]`; amostras de 120ms a 5200ms mantiveram `#cinematicLoader` como topo e o portal oculto; release somente depois de 7600ms.
- Capturas internas: `.codex-temp/czs-v8-intro-hardlock-20260604/intro-hardlock-800ms.png`, `intro-hardlock-7600ms.png` e `intro-hardlock-10400ms.png`.
- Revisao local: `npm run review:team` passou com 212 arquivos auditados e `totalIssues=0`.

## V8 Catálogo CZS - 2026-06-05 hidratacao real e deploy

- Captação atualizada com 371 itens, 218 de hoje, 360 ativos e 480 no arquivo; fontes novas verificadas: Portal Acre, O Alto Acre, Estado do Acre, Acre Noticias, Acre Agora e A Gazeta do Acre.
- Fallbacks visuais falsos foram retirados dos campos principais; `scripts/hydrate-source-screenshots.js` captura print da fonte quando a matéria não traz foto segura.
- Galeria virou galeria de fotos/vídeos do Juruá, sem cards de notícias; imagens quebradas da galeria foram substituídas por referências estáveis.
- Camada de vídeos lista fontes monitoradas e TV/canais; área jovem foi separada para games, anime, livros, shows e cultura pop.
- Relato comunitário virou entrada ao vivo com radar do bairro, backend e fila para Cheffe Call/WhatsApp.
- Validação local em `http://127.0.0.1:3001/?skipIntro=1`: CDP OK para `#feed`, `#videos`, `#galeriaFotos`, `#areaJovem`, `#comunidade`, `#servicos`; sem exceção JS e sem 404 de assets V8.
- `npm run review:team` passou; guard PubPaid OK; achados do auditor ficaram fora dos arquivos tocados. `git diff --check` global ainda acusa whitespace antigo em `data/editorial-health-report.md`, fora do escopo.

## V8 Catálogo CZS - 2026-06-05 otimização mobile v43

- Commit `5e4328c` publicado no Render com a versão `20260605-v8-public-corrective-pass-v43`.
- Carga fria mobile de recursos caiu de cerca de 19,47 MB para 3,56 MB ao converter imagens pesadas para WebP, adiar mídia abaixo da dobra e impedir captura redundante do vídeo local de 5 MB.
- Home validada em 390 x 844 e 1440 x 900, sem estouro horizontal, sem erro de console e com as três ações públicas: Compartilhar, Ler e Informar erro.
- Intro online comprovada: vídeo 480 x 480 pronto, reprodução avançando sem mudo no volume 1, home oculta durante a vinheta e liberada somente após a transição.
- Relatório local: `.codex-temp/mobile-audit/relatorio-final-v43.md`.

## V8 Catálogo CZS - 2026-06-06 limpeza responsiva v47

- Versão local atualizada para `20260606-v8-final-responsive-clean-v47` em `index.html` e `assets/v8-final/v8-merge-ready.js`.
- O endpoint pesado `/api/news/archive?limit=1000` foi adiado para depois da primeira pintura; mobile frio local caiu para 30 recursos e cerca de 1,28 MB antes da sincronização do arquivo completo.
- Correções responsivas: hero 320px sem corte nos botões, cards da pesquisa com altura real, newsletter em uma coluna no mobile e botões com quebra segura.
- Limpeza comprovada: removido apenas `assets/brand/catalogo-czs-logo-offline-horizontal-20260603.png`, sem referencia no projeto; `tools/`, `vendor/`, venvs e evidencias foram preservados.
- Validação local: Playwright em 320/375/390/430/768/1024/1440 sem overflow horizontal e sem console error; intro `?forceIntro=1` provou vídeo 480x480 tocando com `muted=false`, `volume=1` e release para a home.
- Relatório local: `.codex-temp/final-responsive-audit-20260606/final-report-v47.md`.

## V8 Catálogo CZS - 2026-06-06 feed dinâmico v52

- Versão local atualizada para `20260606-v8-dynamic-feed-video-themes-v52` em `index.html` e `assets/v8-final/v8-merge-ready.js`.
- Feed contínuo ganhou prioridade editorial dinâmica conforme regra CZS: impacto, urgência, proximidade, interesse e curiosidade; a ordenação agora balanceia temas para não deixar crime/segurança sequestrar o bloco inteiro.
- Cards do feed usam tamanhos calculados (`wide`, `video`, `feature-video`, `compact`) com `grid-auto-flow: dense`, reduzindo espaços mortos e limitando altura visual; licitações deixam de usar imagem/blur inútil e mostram lista de processo, órgão, publicado e objeto.
- Vídeos reais captados entram no feed como cards inline mudos e em loop; vídeos de acervo entram como TV CZS identificada. A rail da hero também recebe um vídeo relevante sem tomar a manchete principal.
- Cores semânticas aplicadas: segurança/crime preto, urgência vermelho, oportunidades/licitação amarelo, ambiente verde, local/Cruzeiro do Sul azul, saúde turquesa, cultura roxo e vídeo azul TV CZS.
- Validação local em `http://127.0.0.1:3001/?skipIntro=1&qa=dynamic-v52`: desktop sem overflow, console sem erros, 71 cards carregados no feed completo, 7 vídeos distribuídos, ações públicas preservadas como `Compartilhar`, `Ler`, `Informar erro`.
- Validação mobile 390 x 844: sem overflow horizontal, cards com largura máxima 355px, vídeos no feed e botões públicos corretos.
- `npm run review:team` rodou: guard PubPaid OK; auditor geral ainda lista pendências antigas em `tools/creative-suite/...` e venvs, fora dos arquivos tocados nesta atualização.
- Microajuste v53: cards ganharam faixa lateral, halo/contorno e fundo tonal mais forte por tema; validação local em desktop e mobile manteve console sem erros, sem overflow e ações públicas corretas.

## Social/Propaganda - 2026-06-08 Norte Ultra Fibra e Reels

- Protocolo social corrigido: grupos de venda recebem apenas venda/servico/oferta; `Catálogo CZS` WhatsApp fica como vitrine premium com imagem/video/arte + legenda, sem texto cru quando a pauta exige midia.
- Convites premium separados foram gerados para Instagram, WhatsApp e site em `.codex-temp/social-premium-invites-20260608/`; regra: no maximo 1 convite por dia por destino de venda.
- Pacote Norte Ultra Fibra criado em `.codex-temp/norte-ultra-fibra-campanha-20260608/` com separacao feed/story, legendas, hashtags, plano semanal e prospeccao de clientes.
- Atendimento oficial da campanha Norte Ultra Fibra: `https://wa.me/5568992096037`.
- Reels virou linha diaria de captacao: noticias, festas, servicos, ofertas, bastidores, piadas locais leves e produtos devem virar videos curtos com CTA para site/Instagram/WhatsApp quando cabivel.
- Facebook segue bloqueado ate o perfil correto `Clovis Sampaio` estar ativo; nao publicar pelo perfil `Antonio e Rnascimento Jr.`.

## V8 Catálogo CZS - 2026-06-08 notícias + patrocinador Norte v64

- Captação total disparada em 2026-06-08: 371 itens captados, 227 de hoje, 420 ativos e 620 no arquivo.
- `index.html`, `news-data.js`, `data/runtime-news.json` e `data/news-archive.json` foram sincronizados com o novo arquivo local e cache `20260608-norte-news-v64`.
- Norte Ultra Fibra entrou como colaborador/patrocinador real com CTA para `https://wa.me/5568992096037`, botão `Contratar internet`, cards comerciais, anúncio interno, apoio local e campanhas 500/600/800 Mega.
- Arte local temporária do patrocinador: `assets/sponsors-norte-ultra-fibra.svg`; pode ser substituída depois pelas artes finais recebidas no WhatsApp.
- Galeria premium passou a usar imagens locais de `assets/home-cache/` para evitar cards cinza quando redirects externos falham no Render.
- Validação local: `node --check assets/v8-final/v8-merge-ready.js`, `git diff --check` no escopo, `npm run review:team`, HTML local 200 com `total=620`, e captura CDP em `.codex-temp/norte-v63/`.

## Social/Propaganda - 2026-06-08 complemento vendas diretas e Reel

- Pacote `.codex-temp/sales-direct-missing-20260608/` criado para corrigir a falta de anúncios de celular, TV, gift cards/streaming/IA e serviços.
- WhatsApp grupos de venda: 24 envios concluídos, 0 erros, com 8 itens por grupo em `VENDAS E ALUGUEL! CZS`, `03 POSTAR QUE VENDE LOGO CZS` e `GRUPO DE DESAPEGO`.
- Itens enviados: TV, Redmi Note 13, gift/streaming/IA, suporte para celular/computador, sites/chats/automação e convites separados para Instagram, WhatsApp e site.
- Log/prova: `.codex-temp/sales-direct-missing-20260608/whatsapp-sales-direct-log.json` e `done-*.png`.
- Instagram/BlueStacks: publicado 1 Reel comercial em `catalogo_czs_` usando video vertical criado da arte do Redmi; prova em `.codex-temp/sales-direct-missing-20260608/reel-sales-after-share.png`.
- Facebook permaneceu bloqueado: a opção vinculada mostrava `Antonio e Rnascimento Jr.`, não `Clovis Sampaio`.
