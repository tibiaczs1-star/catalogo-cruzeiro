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

Cada capacidade entra no catalogo com:

- nome;
- origem;
- tipo;
- comando ou adaptador;
- estado: descoberto, testado, falhando, precisa login, em quarentena, promovido;
- risco;
- ultimo teste;
- observacoes.

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

1. Criar identidade visual, assets e estados da RayX.
2. Criar shell e dashboard mockados.
3. Criar companion flutuante.
4. Criar rayx-core minimo.
5. Ligar interface ao estado real.
6. Criar roteador de LLMs.
7. Criar capability registry.
8. Criar boot transparente e timers de satisfacao.
9. Criar loops 24h em dry-run.
10. Integrar Chrome/CDP.
11. Integrar agentes dinamicos.
12. Integrar controle visual de maquina.
13. Integrar laboratorio de absorcao universal.
14. Integrar autoescrita.

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
