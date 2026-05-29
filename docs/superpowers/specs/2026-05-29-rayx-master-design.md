# RayX Master Design

## Objetivo

RayX sera uma assistente local viva para o computador do Junio: um sistema autonomo, visivel e extensivel que herda ferramentas existentes, mantem continuidade cognitiva, mostra o que esta fazendo e evolui por protocolos.

O primeiro objetivo nao e controlar tudo de uma vez. O primeiro objetivo e provar que RayX esta viva, visivel, recuperavel e capaz de manter pelo menos uma rota de inteligencia funcionando.

## Principios

- RayX age como extensao operacional do Junio no proprio computador.
- Toda autonomia vira protocolo.
- Todo protocolo vira loop.
- Todo loop gera memoria.
- Toda memoria melhora o proximo protocolo.
- Nenhuma operacao longa fica invisivel.
- Nenhuma ferramenta nova entra no corpo principal sem catalogo, teste e promocao.
- Shell e comando. Dashboard e controle. Companion e presenca. Core e sobrevivencia.

## Arquitetura Geral

```text
rayx-core
  -> estado persistente
  -> fila de tarefas
  -> logs/eventos
  -> roteador de LLMs
  -> protocolos e loops
  -> catalogo de capacidades

rayx-shell
  -> comando rayx
  -> barra /
  -> status curto
  -> logs e comandos

rayx-dashboard
  -> painel local completo
  -> modelos, loops, agentes, ferramentas, projetos e saude

rayx-companion
  -> mascote flutuante
  -> avatar RayX
  -> estados visuais
  -> baloes curtos
  -> atalhos de observar, pausar e abrir painel
```

## RayX Desktop Controller

RayX deve nascer como aplicativo proprio, mas pode usar Hermes Desktop como referencia de produto e como alvo controlavel.

O estudo local em `C:\Users\junio\AppData\Local\Programs\hermes-desktop` mostra um padrao util:

- app Windows empacotado em Electron/Chromium;
- processo main em Node;
- bridge preload para IPC controlado;
- UI React no renderer;
- SQLite local via `better-sqlite3`;
- configuracao em `C:\Users\junio\AppData\Local\hermes`;
- profiles, logs, memoria, modelos, ferramentas, cron, kanban e gateway;
- atualizador apontando para GitHub `fathah/hermes-desktop`.

RayX nao deve copiar codigo, marca, assets ou CSS do Hermes Desktop. Ela deve copiar a licao arquitetural: um console local de agente com UI, processo controlador, configuracao local, diagnostico, logs e gateway visivel.

### Adaptador Hermes

Hermes entra como sistema legado controlavel, nao como corpo principal da RayX.

O adaptador Hermes deve:

- detectar `hermes` no PATH;
- detectar `hermes-agent.exe` em `C:\Users\junio\AppData\Local\Programs\hermes-desktop`;
- ler status com comandos conhecidos, como `hermes status`;
- mapear `HERMES_HOME`, profiles, gateway, logs e configuracoes;
- iniciar, parar e reiniciar Hermes por caminhos explicitos;
- registrar versao, processo, porta, rota LLM e ultimos erros;
- exibir na UI se Hermes esta pronto, parcial, quebrado ou nao encontrado;
- nunca editar arquivos internos do app instalado sem backup e plano claro.

Primeiro corte do adaptador:

```text
rayx hermes status
rayx hermes doctor
rayx hermes start
rayx hermes stop
rayx hermes logs
```

### Decisao Electron, Tauri Ou Hibrido

Hermes Desktop prova que Electron resolve rapido: UI rica, Chromium embutido, Node no main, instalador Windows e integracao com processos. O custo e peso: o app instalado ocupa centenas de MB.

Para RayX:

- Electron e melhor para MVP rapido, dashboard rico, companion e uso de bibliotecas web;
- Tauri ou core nativo podem ser avaliados depois para reduzir peso;
- o core deve ficar desacoplado da UI para permitir trocar a casca no futuro;
- qualquer browser/controlador deve ficar em processo isolado, com logs e restart.

Decisao inicial: MVP em arquitetura compativel com Electron, mas com `rayx-core` separado para nao virar um app monolitico.

## Referencias De Produto

### Antigravity

Google Antigravity reforca a direcao de RayX como superficie de gerenciamento de agentes, nao apenas chat ou editor. Ideias que entram na RayX:

- Manager Surface: painel para criar, observar e coordenar agentes;
- Editor/terminal/browser como ferramentas de execucao, nao como unica interface;
- agentes trabalhando de forma assincrona;
- artefatos verificaveis: plano, tarefas, capturas, gravacoes, diffs e relatorios;
- memoria operacional/knowledge base;
- modelo opcional e varias rotas de provedor.

Regra para RayX: o usuario precisa acompanhar trabalho por artefatos e estado, nao por parede de logs.

### Codex

Codex entra como referencia primaria de engenharia:

- CLI local e app desktop como superficies complementares;
- subagentes e workflows;
- skills, plugins, MCP, shell, apply patch e browser;
- comandos slash;
- worktrees, automacoes, appshots e computer use;
- sandbox/permissions como camada de politica;
- output final em portugues para o Junio, mesmo quando prompts internos forem em ingles.

RayX deve herdar capacidades Codex por catalogo e adaptadores, nao por acoplamento invisivel.

### Video Das 6 IAs Gratis

O video enviado pelo Junio, `https://www.youtube.com/watch?v=a0OQNN1Z1E0`, nao muda o core da RayX; ele muda o catalogo de rotas.

Ferramentas citadas e papel na RayX:

- Google Antigravity: ambiente externo de agentes, referencia de UX e possivel host;
- OpenCode: candidato forte a agente externo benchmarkavel;
- FreeBuff: candidato a teste rapido gratuito via terminal;
- Kilo: candidato a agente CLI multi-modelo com comandos, MCP, agents e benchmarks de latencia;
- Kiro: candidato a CLI com chat, automacoes, MCP, hooks e headless;
- Codex CLI: rota primaria ou quase primaria quando a conta estiver saudavel;
- OpenRouter: provedor/catalogo de modelos, nao agente;
- NVIDIA Build: provedor experimental;
- DeepSeek API: rota economica paga, nunca tratada como gratis;
- OpenDesign: referencia/auxiliar visual, nao runtime essencial.

RayX deve transformar essas ferramentas em entradas de catalogo:

```json
{
  "tool": "opencode",
  "role": "fallback_coding_agent",
  "status": "candidate",
  "install_command": "manual_or_detected",
  "run_command": "opencode",
  "auth_types": ["chatgpt", "copilot", "openrouter", "nvidia", "deepseek"],
  "benchmarks": ["hello_patch", "bugfix_one_file", "json_exactness"],
  "core_policy": "never_required_for_runtime"
}
```

Regras:

- detectar antes de instalar;
- pedir permissao antes de instalar qualquer CLI nova;
- testar em laboratorio pequeno;
- normalizar resultado em JSON;
- marcar falha, rate limit ou cota como estado temporario;
- nunca depender de uma CLI externa para o core ligar;
- Codex e Hermes ficam acima das rotas experimentais.

## Interface

### Shell

O shell deve ser limpo, rapido e bonito. Ele nao deve tentar desenhar rosto grande em ASCII. Ele mostra marca, status, barra de comandos, modelos, loops, logs e atalhos.

Exemplo conceitual:

```text
RAYX  online
model openai-codex  fallback ollama  chrome pending  loops active

/ ask   / agents   / chrome   / models   / projects   / watch   / total
```

### Dashboard

O dashboard e o cockpit completo. Ele mostra explicitamente:

- o que RayX esta fazendo agora;
- modelos ativos e fallbacks;
- loops 24h;
- ferramentas herdadas;
- agentes acordados;
- projetos acompanhados;
- perfis Chrome autorizados;
- saude do sistema;
- fila de tarefas;
- ultimos aprendizados;
- incidentes e recuperacoes;
- botoes de pausar, continuar, assumir controle e abrir detalhes.

### Companion

RayX Companion e uma janela flutuante opcional. Ela deve ficar pequena por padrao, nunca cobrir trabalho importante e sempre poder ser pausada.

Estados iniciais:

- online;
- pensando;
- observando;
- executando;
- alerta;
- pausada;
- modo total.

O avatar deve ser uma personagem propria da RayX, inspirada nas referencias autorizadas pelo usuario, sem copiar foto crua. Direcao visual: feminina, elegante, tecnologica, calma, com cabelo cacheado como assinatura, sem fotorealismo enganoso e sem erotizacao.

## Continuidade Cognitiva

Prioridade maxima do sistema:

```text
P0 manter pelo menos uma rota LLM funcional
P1 manter rayx-core saudavel
P2 manter memoria, fila e logs integros
P3 executar tarefas do Junio
P4 melhorar ferramentas e projetos
P5 estudo livre e expansao
```

Rotas iniciais:

- nuvem principal: OpenAI/Codex quando disponivel;
- rota livre/intermediaria: OpenRouter, Gemini, NVIDIA ou equivalentes configurados;
- emergencia local: Ollama local com modelo leve.

RayX deve testar periodicamente latencia, erro, limite, custo e qualidade de cada rota.

## Modelo E Provedor Como Arquitetura

RayX nao deve tratar LLMs como strings de configuracao. Cada modelo precisa ser registrado com capacidades, limites e modo de uso.

Campos minimos por modelo:

- provider;
- model id;
- contexto maximo;
- saida maxima;
- suporte a ferramentas;
- suporte a computer use;
- suporte a multimodalidade;
- suporte a prompt/cache/context editing;
- modo de raciocinio: automatico, effort, thinking, fast;
- custo estimado;
- latencia media;
- confiabilidade recente;
- melhor uso: codigo, navegador, analise, escrita, visao, roteamento, fallback.

### Claude Opus 4.8

Claude Opus 4.8 deve ser tratado como modelo de alta autonomia quando disponivel. Caracteristicas relevantes para RayX:

- modelo `claude-opus-4-8`;
- foco em raciocinio complexo, agentic coding e trabalho autonomo longo;
- contexto de ate 1M tokens em superficies suportadas;
- saida maxima alta;
- mid-conversation system messages para atualizar instrucao em loops longos sem reenviar todo o prompt;
- effort padrao alto;
- fast mode para velocidade quando custo permitir;
- adaptive thinking para gastar raciocinio quando a tarefa exigir;
- melhor tool triggering e melhor recuperacao apos compaction.

Uso recomendado:

- planejamento de arquitetura;
- migracoes grandes;
- revisao de autoescrita;
- analise de repositorios baixados no laboratorio;
- tarefas longas de agentes/subagentes;
- browser/computer use quando custo e acesso permitirem.

RayX deve encapsular as diferencas de Opus 4.8 em adaptador proprio. Nao assumir que parametros como `temperature`, `top_p`, `top_k` ou thinking budgets funcionam igualmente entre versoes.

### OpenAI/Codex E Computer Use

OpenAI/Codex deve ser rota principal quando estiver saudavel, especialmente para coding, shell, agentes locais e integracao com ferramentas Codex.

Caracteristicas relevantes:

- modelos fortes recentes devem ser cadastrados com effort configuravel;
- snapshots devem ser preferidos quando estabilidade for mais importante que novidade;
- function calling, structured outputs e tool choice devem ser tratados como capacidades formais;
- custos de ferramentas como search e computer use devem entrar no calculo de rota;
- Agents SDK serve como referencia de orquestracao: agentes planejam, chamam ferramentas, colaboram com especialistas e preservam estado suficiente para trabalho multi-etapa.

O loop de computer use deve seguir a forma generica:

```text
enviar tarefa com ferramenta de computador
-> receber chamada de acao
-> executar acoes em ordem no ambiente controlado
-> capturar tela/estado atualizado
-> devolver observacao
-> repetir ate parar
```

RayX deve implementar esse loop como camada propria, nao preso a um unico provedor.

### MiniMax M2.7

MiniMax M2.7 deve ser avaliado como rota de nuvem para trabalho agentico e coding longo, nao como modelo local leve.

Caracteristicas relevantes:

- modelos `MiniMax-M2.7` e `MiniMax-M2.7-highspeed`;
- contexto de 204.800 tokens, contando entrada e saida;
- `MiniMax-M2.7-highspeed` deve ser tratado como rota rapida de aproximadamente 100 tps quando acesso/custo permitirem;
- uso por API, incluindo endpoint OpenAI-compatible `https://api.minimax.io/v1` e Anthropic-compatible `https://api.minimax.io/anthropic`;
- foco em software engineering, debugging, seguranca de codigo, ML, documentos e tarefas agenticas;
- bom candidato para tool loops, agent teams, log analysis e refatoracao multi-arquivo;
- janela de contexto grande o bastante para repositorios e historicos longos;
- highspeed deve ser tratado como rota de throughput, nao como rota barata por padrao.

Limitacoes:

- nao e fallback offline para PC modesto;
- o modelo aberto aparece com 229B parametros, entao self-host local fica fora do caminho normal;
- self-host deve ficar em pesquisa/laboratorio com infraestrutura propria ate prova de viabilidade;
- tool calls precisam preservar a resposta completa, inclusive `tool_calls`, `thinking` e `reasoning_details` quando o provedor exigir;
- deve passar por benchmark proprio antes de entrar em rota automatica.

Uso recomendado:

- `cloud-agentic-coding`;
- analise de logs e bugs;
- refactor supervisionado;
- revisao de codigo e docs;
- tarefas com muitas etapas independentes;
- comparacao contra OpenAI/Codex e Opus em tarefas reais do Junio.

Teste minimo antes de promocao:

- 10 tarefas reais do Projeto Codex/RayX;
- tool call com resposta completa preservada;
- taxa de erro de JSON/schema;
- latencia, custo e tokens;
- qualidade de patch;
- recuperacao apos falha;
- comparacao contra rota primaria.

### Gemini

Gemini deve entrar como rota de fallback e pesquisa quando houver chave ou acesso. Pontos relevantes:

- function calling com schemas claros;
- modos AUTO, ANY e NONE para controlar chamada de ferramentas;
- parallel function calling para chamadas independentes;
- compositional function calling para cadeia de funcoes;
- suporte a thinking em familias recentes;
- thought signatures devem ser preservadas em conversas multi-turn quando a API exigir;
- suporte a contexto longo em modelos selecionados;
- bom uso para busca, analise multimodal, estruturacao e fallback.

RayX deve aproveitar Gemini principalmente quando precisar de funcao estruturada, grounding/pesquisa ou alternativa a OpenAI/Anthropic.

### Gemma E Modelos Google Locais

Gemma deve entrar como familia local/edge, especialmente Gemma 3n quando o PC precisar de modelos pequenos e uteis.

Caracteristicas relevantes:

- Gemma 3n foi desenhado para laptops, tablets e celulares;
- modelos efetivos E2B/E4B permitem menor carga de memoria;
- contexto de 32K tokens;
- PLE caching e carregamento condicional ajudam a reduzir memoria;
- pode lidar com texto, visao e audio em variantes/capacidades suportadas.

Uso recomendado na RayX:

- chat local de emergencia;
- sumarizacao local;
- leitura rapida de capturas/OCR quando suportado;
- classificacao de tarefas;
- resposta em portugues quando a nuvem cair;
- lane leve para manter RayX viva durante falhas de rede.

Gemma nao deve ser tratado como substituto de modelo frontier para arquitetura, autoescrita critica ou refactor complexo sem revisao de um modelo maior.

### LLMs Locais Pequenas

RayX deve manter uma cesta local pequena, cada modelo com funcao clara. Para PC modesto, a selecao inicial de laboratorio deve ser pragmatica:

- `llama3.2:3b`: fallback geral, triagem e modo offline;
- `gemma3:4b`: sumarizacao, texto cotidiano e visao leve quando suportada;
- `qwen3:4b`: JSON, tool calling e pequenos agentes;
- `qwen2.5-coder:3b`: code-only background helper padrao;
- `qwen3:1.7b`: reserva se `qwen3:4b` ficar pesado;
- `gemma3n:e2b`: experimental para emergencia multimodal futura;
- `gemma3n:e4b`: experimental para multimodal local melhor quando houver memoria;
- `qwen2.5-coder:1.5b`: auxilio rapido em codigo simples;
- `qwen2.5-coder:7b`: codigo melhor quando houver memoria suficiente;
- `qwen3-vl:2b`: OCR/GUI/visao em laboratorio se backend suportar;
- `qwen3:8b`: raciocinio geral melhor, apenas se o PC aguentar;
- `deepseek-r1:1.5b`: raciocinio local curto, nao executor final;
- `deepseek-r1:7b` ou `deepseek-r1:8b`: raciocinio local melhor quando houver memoria;
- `phi4-mini`: resumo/instrucao longa quando o hardware permitir;
- `llama3.2:1b`: reserva ultra leve.

Comandos iniciais sugeridos:

```powershell
ollama pull llama3.2:3b
ollama pull gemma3:4b
ollama pull qwen3:4b
ollama pull qwen2.5-coder:3b
```

Se `qwen3:4b` ficar lento:

```powershell
ollama pull qwen3:1.7b
```

Regras:

- modelo local pequeno nunca decide acao sensivel sozinho;
- todo modelo local deve passar por smoke de portugues, JSON, resumo, codigo e latencia;
- se falhar em JSON/tool output, fica fora de automacao;
- Qwen coder local deve continuar preferencialmente code-only, nao chat principal;
- RayX deve carregar no maximo um modelo local quente por vez em PC fraco, salvo Modo Total.

### OpenRouter E Rotas Livres

OpenRouter deve ser tratado como camada de roteamento, nao como garantia unica. RayX deve:

- consultar modelos e provedores disponiveis;
- usar fallback model routing quando fizer sentido;
- medir falhas, rate limits e truncamentos;
- nao confiar apenas em sucesso HTTP como sucesso de tarefa;
- manter fallback direto fora do OpenRouter quando possivel;
- registrar qual provedor real respondeu.

OpenRouter e util para descoberta, benchmarking e continuidade, mas RayX deve validar qualidade por tarefa.

### Ollama Como Barramento Local

Ollama deve ser o primeiro barramento local da RayX.

Capacidades relevantes:

- API local em `localhost:11434`;
- chat, generate e streaming;
- structured outputs por schema/`response_format` em API compativel;
- tool calling em modelos que suportam;
- biblioteca de modelos com tamanhos diferentes.

RayX deve usar Ollama para:

- health check local;
- modelo de emergencia;
- benchmark de modelos pequenos;
- tarefas offline;
- workers locais de baixo risco;
- comparacao contra respostas de nuvem.

### Politica De Selecao

RayX escolhe modelo por tarefa:

- simples/rapida: modelo barato ou local;
- codigo pequeno: Codex ou modelo coder validado;
- arquitetura longa: Opus 4.8, OpenAI forte ou Gemini Pro;
- navegador/computer use: modelo com capacidade comprovada de UI;
- emergencia/offline: Ollama local;
- verificacao cruzada: segundo modelo diferente;
- autoescrita: pelo menos executor + revisor separados.

Toda decisao de modelo deve ficar logada com motivo curto.

### Fatoracao De Tarefas Entre LLMs

RayX deve decompor trabalho em sub-tarefas paralelas quando isso aumentar velocidade, qualidade ou resiliencia.

Multiagente e acelerador seletivo, nao modo padrao. RayX so abre varios agentes quando eles reduzem tempo real, aumentam cobertura independente ou capturam erros que um teste/revisor unico provavelmente nao pegaria.

Papeis padrao:

- classificador: entende pedido e escolhe estrategia;
- planejador: quebra a tarefa;
- buscador: pesquisa/documenta;
- executor: aplica mudanca;
- verificador: testa e encontra falhas;
- revisor: revisa risco, codigo e coerencia;
- sintetizador: junta resultados em portugues.

Padroes de execucao:

- simples: um modelo rapido resolve;
- medio: executor + verificador;
- complexo: planejador + workers paralelos + revisor + sintetizador;
- sensivel: executor + revisor de outro provedor + log detalhado;
- incerto: dois modelos opinam, um sintetiza;
- longo: long-context planner acompanha memoria e workers menores executam partes.

Politicas iniciais:

- `simple`: um agente, sem paralelismo;
- `research_breadth`: 2 a 4 pesquisadores paralelos e um sintetizador;
- `code_change`: executor + revisor; paralelismo so para leitura/diagnostico por area;
- `high_risk`: executor + revisor + teste/validador;
- `bulk_independent`: fan-out com limite de concorrencia e cache;
- `ambiguous`: orquestrador faz plano curto antes de abrir workers;
- `local_low_resource`: no maximo um modelo local conversacional quente; Qwen coder apenas helper de codigo.

Regras de eficiencia:

- nao paralelizar tarefas dependentes;
- nao pedir a tres modelos a mesma coisa se um smoke barato basta;
- usar consenso so quando ha incerteza real ou risco;
- dividir por arquivos, ferramentas, dominios ou fases;
- cada worker recebe escopo fechado e criterio de saida;
- resultados entram em memoria com origem, modelo, custo, latencia e confianca;
- se dois agentes discordarem, RayX registra conflito e sobe para revisor ou usuario conforme risco.
- usar orquestracao deterministica quando o workflow for conhecido;
- usar roteamento por LLM quando a intencao for aberta ou especialistas precisarem ser escolhidos dinamicamente.

Freios obrigatorios:

- `task_fingerprint`: hash de objetivo, arquivos/fontes e tipo de saida;
- `scope_key`: evita dois agentes mexendo no mesmo escopo;
- cache por subtarefa;
- limite de agentes por classe de tarefa;
- deduplicacao de fontes/arquivos antes de spawn;
- handoff compacto em vez de historico inteiro;
- cancelamento quando criterio de pronto ja foi satisfeito;
- fail-fast para provedor em rate limit;
- orquestrador como dono do orcamento.

Metadados obrigatorios por subtarefa:

- objetivo;
- modelo/provedor;
- papel;
- ferramentas permitidas;
- arquivos/escopo;
- custo estimado;
- deadline;
- resultado;
- score de confianca;
- decisao: aceito, rejeitado, precisa revisao, precisa usuario.

Evento estruturado minimo:

```json
{
  "run_id": "...",
  "task_id": "...",
  "parent_task_id": "...",
  "agent_role": "orchestrator|executor|reviewer|judge|researcher",
  "model": "...",
  "provider": "...",
  "route_reason": "...",
  "task_fingerprint": "...",
  "scope_key": "...",
  "input_refs": ["..."],
  "output_ref": "...",
  "handoff_summary": "...",
  "constraints": ["..."],
  "started_at": "...",
  "ended_at": "...",
  "latency_ms": 0,
  "prompt_tokens": 0,
  "completion_tokens": 0,
  "estimated_cost": 0,
  "tool_calls": [],
  "status": "success|failed|cancelled|needs_review",
  "failure_type": "timeout|rate_limit|validation|tool_error|low_confidence",
  "confidence": 0.0,
  "review_result": "pass|fail|warn",
  "dedupe_hit": false,
  "cache_hit": false
}
```

## Protocolos 24h

### Protocolo Sistema Vivo

A cada 24h:

- verificar PATH, shell, Node, Python, Git e dependencias;
- verificar Hermes legado quando ainda existir;
- verificar Chrome/CDP;
- verificar Ollama;
- verificar provedores remotos;
- verificar consumo de disco, memoria e CPU;
- gerar relatorio de saude;
- limpar caches temporarios apenas quando seguro.

### Protocolo Projetos Vivos

A cada 24h:

- localizar projetos conhecidos;
- ler handoffs e memoria local;
- classificar status: ativo, parado, bloqueado, precisa teste, precisa deploy;
- criar fila por prioridade;
- acordar agentes por produto quando util.

### Protocolo Produto Variavel

Cada produto pode ter loop proprio:

- PubPaid: jogo, QA, legal, economia, mobile, deploy;
- CZS: noticias, fontes, social, homepage, propaganda;
- RayX: modelos, ferramentas, companion, core, protocolos;
- novos produtos: protocolo nasce junto com o produto.

## Boot Transparente

Ao iniciar, RayX deve mostrar:

- etapa atual;
- duracao da etapa;
- tempo total de boot;
- estimativa;
- proximo passo;
- falhas e fallback escolhido;
- quando estara pronta.

Modos:

- boot rapido: essencial primeiro, background depois;
- boot completo: modelos, ferramentas, Chrome, projetos e loops;
- boot total: varredura agressiva, GitHub, benchmarks e laboratorio.

## Satisfacao Obrigatoria

RayX nunca deve passar mais de 10 minutos em qualquer operacao sem dar sinal de vida.

Timers:

- 3 minutos: atualizacao discreta no companion/dashboard;
- 10 minutos: satisfacao obrigatoria;
- 30 minutos: resumo maior, reavaliacao e possivel incidente.

Atualizacao minima:

- tempo decorrido;
- o que ja foi feito;
- o que esta fazendo;
- proximo passo;
- estimativa;
- se esta avancando ou travada.

## Heranca De Capacidades

RayX deve catalogar e herdar capacidades de:

- Codex;
- Hermes legado;
- Kimi e outras CLIs instaladas;
- VS Code/Copilot prompts;
- skills Codex;
- plugins Codex;
- MCPs;
- scripts locais;
- PowerShell, Python, Node, Git, Playwright e Ollama;
- ferramentas que aparecem como comandos slash.
- CLIs externas estudadas: OpenCode, FreeBuff, Kilo, Kiro, OpenDesign e similares.

Cada capacidade entra no catalogo com:

- nome;
- origem;
- tipo;
- comando ou adaptador;
- estado: descoberto, testado, falhando, precisa login, em quarentena, promovido;
- risco;
- ultimo teste;
- observacoes.

### Bench Lane Para CLIs Externas

Toda CLI externa deve passar por um banco pequeno de provas antes de virar fallback real:

- `detect`: comando existe, versao responde e autenticacao e conhecida;
- `hello_patch`: editar arquivo descartavel em workspace temporario;
- `json_exactness`: responder JSON valido conforme schema;
- `bugfix_one_file`: corrigir bug simples com diff pequeno;
- `repo_read_only_triage`: analisar sem editar;
- `latency_and_cost`: medir duracao, falhas, cota e custo;
- `permission_probe`: confirmar se a CLI tenta pedir aprovacao, executar comandos ou editar arquivos.

Saida normalizada minima:

```json
{
  "ok": true,
  "tool": "kilo",
  "version": "...",
  "model": "...",
  "duration_ms": 0,
  "changed_files": [],
  "stdout_excerpt": "...",
  "error_class": null,
  "promotion": "candidate|quarantine|promoted|rejected"
}
```

CLIs externas podem ajudar RayX a continuar trabalhando, mas nao podem instalar dependencias, alterar repositorios reais ou mexer em contas reais sem passar pelo laboratorio.

## Agentes

RayX deve importar os 181 agentes locais do Projeto Codex como biblioteca viva, nao como multidao falando ao mesmo tempo.

Fluxo:

```text
pedido do Junio
  -> classificador de intencao
  -> escolhe especialistas
  -> cria sala de trabalho
  -> roda em paralelo quando util
  -> consolida pareceres
  -> executor final age
  -> revisor confere
  -> memoria aprende
```

Agentes devem ter criterio de silencio: so acordam quando sua especialidade, memoria ou risco forem relevantes.

## Chrome E Controle De Maquina

RayX deve usar os perfis Chrome existentes autorizados pelo usuario. Ela deve mapear perfis, apelidos, contas e usos permitidos.

Camadas de controle:

- Chrome/CDP para navegador;
- shell para comandos;
- mouse engine para ponteiro;
- keyboard engine para teclas;
- vision surface para screenshot, OCR e segunda tela;
- action verifier para confirmar resultado;
- recovery reflex para parar e replanejar quando a tela divergir.

Controle visual completo fica depois do MVP.

## Protocolo De Absorcao Universal

Ao ligar ou em loops programados, RayX deve buscar novidades em GitHub, documentacao, modelos e ferramentas.

Nada entra direto no corpo principal. Tudo passa pelo laboratorio:

```text
descoberto
-> baixado
-> quarentena
-> teste
-> adaptacao
-> promocao ou rejeicao
```

O laboratorio deve analisar:

- licenca;
- confiabilidade;
- compatibilidade Windows;
- instalacao;
- utilidade real;
- custo;
- risco de supply chain;
- testes pequenos;
- necessidade de adaptador.

## Aprendizagem De Maquina E Servicos Novos

RayX deve procurar novos LLMs, ferramentas de IA, APIs, embeddings, visao, TTS, navegadores e agentes.

Ela pode estudar, abrir servicos nos perfis Chrome autorizados e testar planos gratuitos. Cadastro automatico so e aceitavel quando:

- nao exige pagamento;
- nao exige cartao;
- nao exige documento sensivel;
- nao viola termos claros;
- usa perfil autorizado;
- registra tudo no catalogo.

Se envolver custo, KYC, documento, cartao, telefone sensivel ou risco de conta, RayX prepara resumo e sobe ao usuario.

## Autoescrita

RayX pode propor e testar melhorias no proprio sistema, mas sempre com fluxo versionado:

```text
hipotese
-> branch ou copia isolada
-> patch
-> teste
-> comparacao
-> promover ou reverter
-> registrar aprendizado
```

Autoescrita fica fora do MVP inicial.

## Modo Total

Modo Total permite uso agressivo de recursos para cumprir tarefas importantes. Mesmo assim, RayX deve manter reserva minima para Windows, logs, companion e recuperacao.

Sinais para reduzir carga:

- memoria critica;
- CPU sustentada demais;
- travamento do Chrome;
- falta de resposta do shell;
- usuario usando o PC ativamente;
- falha repetida de modelo.

## MVP

O MVP deve conter:

1. identidade visual RayX inicial;
2. shell limpo com status e barra slash mockada;
3. companion flutuante com estados basicos;
4. dashboard local com estado mockado;
5. rayx-core minimo com estado, eventos, health e fila simples;
6. roteador de LLMs com tres vias registradas;
7. catalogo inicial de capacidades herdadas;
8. boot transparente;
9. satisfacao obrigatoria;
10. protocolos 24h basicos em modo dry-run.

## Fora Do MVP

- mouse/teclado total;
- segunda visao completa;
- autoescrita;
- cadastro automatico em servicos;
- promocao automatica de plugins;
- controle profundo de todos os perfis Chrome;
- subagentes criando subagentes livremente;
- voz e lip sync avancado;
- automacoes sensiveis em contas reais.

## Ordem De Construcao

1. Fechar estudo de referencias: Hermes Desktop, Codex, Antigravity e video das CLIs.
2. Criar identidade visual, assets e estados da RayX.
3. Criar shell e dashboard mockados.
4. Criar companion flutuante.
5. Criar rayx-core minimo.
6. Criar adaptador Hermes em modo status/doctor.
7. Ligar interface ao estado real.
8. Criar roteador de LLMs.
9. Criar capability registry.
10. Criar boot transparente e timers de satisfacao.
11. Criar loops 24h em dry-run.
12. Criar bench lane para CLIs externas.
13. Integrar Chrome/CDP.
14. Integrar agentes dinamicos.
15. Integrar controle visual de maquina.
16. Integrar laboratorio de absorcao universal.
17. Integrar autoescrita.

## Criterio De Sucesso Do Primeiro Corte

RayX esta pronta para avancar quando:

- abre por comando local;
- mostra shell bonito;
- abre dashboard;
- mostra companion;
- registra eventos;
- mostra boot com etapas;
- emite satisfacao em tarefas longas;
- conhece modelos disponiveis;
- conhece ferramentas herdadas iniciais;
- sobrevive a falha simulada de uma rota LLM;
- entrega relatorio claro em portugues.

## Fontes De Pesquisa Do Roteador

Esta versao da spec foi fechada consultando documentacao primaria/oficial dos provedores e modelos:

- Anthropic Claude Opus 4.8: https://platform.claude.com/docs/en/about-claude/models/whats-new-claude-4-8
- OpenAI GPT-5.1: https://platform.openai.com/docs/models/gpt-5.1/
- OpenAI Function Calling: https://platform.openai.com/docs/guides/function-calling
- OpenAI Agents SDK: https://platform.openai.com/docs/guides/agents-sdk/
- MiniMax M2.7: https://www.minimax.io/models/text/m27
- MiniMax API Overview: https://platform.minimax.io/docs/api-reference/api-overview
- MiniMax AI Coding Tools: https://platform.minimax.io/docs/guides/text-ai-coding-tools
- MiniMax Tool Use: https://platform.minimax.io/docs/guides/text-m2-function-call
- MiniMax M2.7 Hugging Face: https://huggingface.co/MiniMaxAI/MiniMax-M2.7
- Google Gemini Function Calling: https://ai.google.dev/gemini-api/docs/function-calling
- Google Gemini Thinking: https://ai.google.dev/gemini-api/docs/thinking
- Google Gemma 3n: https://ai.google.dev/gemma/docs/gemma-3n
- Ollama API: https://docs.ollama.com/api
- Ollama Tool Calling: https://docs.ollama.com/capabilities/tool-calling
- Ollama Structured Outputs: https://docs.ollama.com/capabilities/structured-outputs
- Ollama Gemma 3n: https://ollama.com/library/gemma3n
- Ollama Qwen2.5 Coder: https://ollama.com/library/qwen2.5-coder
- Ollama Qwen3: https://ollama.com/library/qwen3
- Ollama DeepSeek-R1: https://ollama.com/library/deepseek-r1
- Ollama Phi4 Mini: https://ollama.com/library/phi4-mini
- Ollama Llama 3.2: https://ollama.com/library/llama3.2
- OpenRouter Model Fallbacks: https://openrouter.ai/docs/guides/routing/model-fallbacks
- OpenRouter Provider Selection: https://openrouter.ai/docs/guides/routing/provider-selection

## Fontes Do Estudo De Produto

- Hermes Desktop local: `C:\Users\junio\AppData\Local\Programs\hermes-desktop`
- YouTube, Guilherme Lazarotto: https://www.youtube.com/watch?v=a0OQNN1Z1E0
- Google Antigravity docs: https://www.antigravity.google/docs/home
- Google Developers Blog, Antigravity: https://developers.googleblog.com/en/build-with-google-antigravity-our-new-agentic-development-platform/
- OpenAI Codex CLI: https://developers.openai.com/codex/cli/
- OpenCode: https://dev.opencode.ai/
- FreeBuff: https://freebuff.ai/
- Kilo CLI: https://kilo.ai/docs/code-with-ai/platforms/cli
- Kiro CLI: https://kiro.dev/docs/cli/
- OpenRouter Models API: https://openrouter.ai/docs/guides/overview/models
