# RayX Local Native Profile

Este documento fixa a primeira adaptacao da RayX ao PC atual do Junio. A regra principal e: RayX roda localmente por enquanto. Nuvem e apenas rota de inteligencia quando ja existir credencial ou autorizacao.

## Maquina Atual

- Host: `PLAY`
- Sistema: Windows 11 Pro
- Build: `10.0.26200`
- CPU: AMD Ryzen 5 5500
- Nucleos: 6
- Threads: 12
- RAM: 16 GB
- GPU: Radeon RX 5500 XT, 4 GB VRAM
- Display adicional: USB Mobile Monitor Virtual Display
- Disco `C:`: cerca de 115 GB livres no momento da medicao

## Ferramentas Detectadas

| Ferramenta | Estado | Observacao |
| --- | --- | --- |
| Git | instalado | `2.54.0.windows.1` |
| Node.js | instalado | `v24.14.1` |
| npm | instalado | `11.15.0` |
| Python global | instalado | `3.14.2` |
| Hermes CLI | instalado | `Hermes Agent v0.14.0` |
| Codex CLI | instalado | `codex-cli 0.130.0` |
| Ollama | instalado | `0.24.0` |
| VS Code | instalado | `code.cmd` detectado |
| Chrome | instalado, fora do PATH | caminho real: `C:\Program Files\Google\Chrome\Application\chrome.exe` |

## Hermes Local

Hermes esta instalado e funcional no ambiente local:

- CLI: `C:\Users\junio\AppData\Local\hermes\hermes-agent\venv\Scripts\hermes.exe`
- Projeto: `C:\Users\junio\AppData\Local\hermes\hermes-agent`
- Python Hermes: `3.11.15`
- Provider ativo: OpenAI Codex
- Modelo configurado: `gpt-5.5`
- Auth OpenAI Codex: logado
- Gateway: rodando em processo manual
- Jobs: 8 ativos
- Sessoes: 2 ativas
- Aviso: Hermes esta atrasado em relacao ao upstream e recomenda `hermes update`

Credenciais remotas variam e nao devem ser hardcoded. RayX deve ler apenas estado resumido, nunca exibir segredo inteiro. No estudo atual, Gemini, NVIDIA NIM e FAL aparecem configurados; OpenRouter, MiniMax, Anthropic, DeepSeek e outros aparecem sem chave.

## Ollama Local

Modelos locais ja disponiveis:

- `llama3.2:3b`, 2.0 GB
- `qwen2.5-coder:3b`, 1.9 GB
- `qwen2.5:3b`, 1.9 GB

Politica inicial:

- manter no maximo um modelo local conversacional quente;
- `llama3.2:3b` e fallback geral/offline;
- `qwen2.5-coder:3b` e helper de codigo, nao chat principal;
- `qwen2.5:3b` pode ser reserva geral;
- modelos maiores que 7B ficam fora do MVP local, salvo teste manual;
- qualquer modelo novo entra por laboratorio e benchmark.

## Chrome Local

Chrome esta instalado e existem perfis locais autorizados pelo usuario. Perfis detectados:

- `Default`
- `Profile 1`
- `Profile 2`
- `Profile 3`
- `Profile 5`
- `Profile 8`
- `Profile 11`
- `Profile 13`
- `Profile 15`
- `Profile 16`
- `Profile 17`
- `Profile 21`
- `Profile 22`

Politica inicial:

- RayX deve mapear perfis existentes antes de usar;
- cada perfil precisa de apelido, finalidade e permissao de uso;
- controle via CDP deve preferir uma instancia dedicada com porta explicita;
- nunca fechar Chrome do usuario sem confirmacao;
- nunca fazer login, cadastro, compra ou acao sensivel sem politica especifica.

## Orçamento De Recursos

Este PC aguenta RayX local, mas nao aguenta abuso permanente de modelos grandes.

Perfis de execucao:

### Modo Leve

- usar Codex/OpenAI ou Hermes como rota principal;
- manter Ollama frio ou com um modelo pequeno;
- companion e dashboard ativos;
- loops 24h em baixa prioridade;
- ideal enquanto o usuario esta usando o PC.

### Modo Trabalho

- permitir um modelo Ollama pequeno quente;
- permitir 2 a 3 processos de agente quando forem externos/cloud;
- limitar workers locais a tarefas curtas;
- atualizar UI a cada etapa;
- pausar benchmarks pesados se Chrome/Codex estiverem consumindo muita RAM.

### Modo Total

- usado so por comando explicito;
- pode usar mais CPU e memoria por periodo limitado;
- deve preservar reserva para Windows, Chrome, Codex, logs e recuperacao;
- precisa mostrar timer e proximo passo;
- se a memoria ficar critica, volta para Modo Trabalho.

Limites iniciais:

- alvo normal de RAM da RayX UI + core: abaixo de 1 GB;
- alvo normal de Ollama local: abaixo de 3 GB por modelo pequeno;
- concorrencia local pesada: 1;
- concorrencia cloud/API: 3 quando houver rota saudavel;
- operacao sem satisfacao: nunca passar de 10 minutos.

## Natividade Da Arquitetura

RayX deve se adaptar a este PC com camadas locais:

```text
rayx-desktop
  -> UI local
  -> companion
  -> painel de boot/status

rayx-core
  -> estado local
  -> eventos locais
  -> fila local
  -> roteador local/cloud
  -> protocolos

rayx-adapters
  -> hermes
  -> codex
  -> ollama
  -> chrome
  -> powershell
  -> git/node/python
  -> cli catalog
```

O core deve ser independente da UI. A UI pode ser Electron no MVP, mas o estado, filas, logs e adaptadores devem ficar em arquivos/processos que possam sobreviver a uma troca futura de interface.

## Estrutura Local Sugerida

```text
%LOCALAPPDATA%\RayX\
  config\
    rayx.local.json
    providers.local.json
    chrome-profiles.local.json
  state\
    events.sqlite
    tasks.sqlite
    capability-registry.sqlite
  logs\
    rayx-core.log
    rayx-desktop.log
    adapters\
  lab\
    cli-bench\
    downloaded-repos\
    quarantine\
  cache\
  backups\
```

No repositorio, a implementacao pode nascer em:

```text
rayx\
  core\
  desktop\
  adapters\
  docs\
  scripts\
```

## Prioridade Nativa Do MVP

1. `rayx doctor`: detectar ambiente local sem alterar nada.
2. `rayx status`: mostrar Hermes, Codex, Ollama, Chrome, modelos e recursos.
3. `rayx desktop`: abrir painel local.
4. `rayx companion`: abrir mascote local opcional.
5. `rayx hermes status`: usar Hermes como adaptador.
6. `rayx ollama status`: listar modelos locais e memoria estimada.
7. `rayx chrome profiles`: listar perfis detectados e pedir apelidos/permissoes.
8. `rayx boot`: iniciar em modo rapido com progresso visivel.
9. `rayx catalog scan`: detectar Codex, Hermes, CLIs, skills, MCPs e scripts.
10. `rayx report`: gerar relatorio local em portugues.

## Decisoes Para Implementacao

- Nao depender de OpenRouter, MiniMax, Anthropic ou outra nuvem para ligar.
- Nao baixar repositorios automaticamente no boot do MVP.
- Nao instalar CLIs externas automaticamente.
- Nao mexer no Hermes Desktop instalado; controlar por CLI/processo.
- Nao usar modelos locais grandes antes de benchmark.
- Usar PowerShell como primeira camada nativa de diagnostico no Windows.
- Usar SQLite para eventos/fila/catalogo local quando o core precisar persistir.
- Usar arquivos JSON para configuracoes editaveis pelo usuario.
- Usar logs simples em texto para debug rapido.

## Proximo Corte

O proximo corte de construcao deve criar um `rayx doctor` local que gere um JSON com:

- hardware resumido;
- disco e memoria;
- ferramentas detectadas;
- estado Hermes;
- estado Codex;
- estado Ollama;
- perfis Chrome;
- recomendacao de modo: leve, trabalho ou total;
- riscos encontrados;
- proximos passos.

Esse `doctor` deve ser a primeira prova de natividade da RayX neste PC.
