# Agent OS — Sistema Operacional de Agentes

## O que é

O Agent OS é o núcleo operacional que transforma os 181 agentes existentes do Codex
em uma organização autônoma de IA com hierarquia, ciclo de melhoria contínua e
integração real com o ecossistema.

## Arquitetura

```
VOCÊ (owner)
│
▼
CEO — Supervisor Geral
│
├── Diretor de Tecnologia
│      ├── Gerente Backend
│      │     ├── Especialista Backend
│      │     ├── Especialista APIs
│      │     ├── Especialista Banco de Dados
│      │     └── Especialista DevOps
│      ├── Gerente Frontend
│      │     ├── Especialista Frontend
│      │     ├── Especialista UX
│      │     └── Especialista Mobile
│      ├── Gerente IA
│      │     ├── Especialista IA Local
│      │     └── Especialista IA Cloud
│      └── Gerente Segurança
│            ├── Especialista Segurança
│            └── Especialista Performance
│
├── Diretor Editorial
│      ├── Gerente Notícias
│      │     ├── Especialista Notícias Locais
│      │     ├── Especialista Notícias Nacionais
│      │     └── Especialista Fact Checking
│      ├── Gerente Conteúdo
│      │     ├── Especialista Copywriting
│      │     ├── Especialista SEO
│      │     └── Especialista Tendências
│      ├── Gerente Social
│      │     ├── Especialista Instagram
│      │     ├── Especialista Facebook
│      │     └── Especialista WhatsApp
│      └── Gerente Pesquisa
│            ├── Especialista RSS/Feeds
│            └── Especialista Vídeo/Virais
│
├── Diretor de Design
│      ├── Gerente Visual
│      │     ├── Especialista UI
│      │     ├── Especialista Identidade Visual
│      │     └── Especialista Acessibilidade
│      ├── Gerente Motion
│      │     ├── Especialista Animações
│      │     └── Especialista VFX
│      └── Gerente Criativo
│            ├── Especialista Landing Pages
│            └── Especialista Comercial
│
├── Diretor de Crescimento
│      ├── Gerente Analytics
│      │     ├── Especialista Google Analytics
│      │     ├── Especialista Instagram Metrics
│      │     └── Especialista Conversão
│      ├── Gerente Engajamento
│      │     ├── Especialista Hashtags
│      │     ├── Especialista Horários
│      │     └── Especialista Comunidade
│      └── Gerente Monetização
│            ├── Especialista Ads
│            ├── Especialista Patrocínios
│            └── Especialista CRM
│
└── Auditor Geral
       ├── Auditor Código
       ├── Auditor Editorial
       └── Auditor Estratégico
```

## Níveis de agente

| Nível | Função | Exemplo |
|-------|--------|---------|
| CEO | Estratégia, prioridades, ciclo contínuo | Supervisor Geral |
| Diretor (5) | Coordena equipe, consolida relatórios | Diretor Editorial |
| Gerente (15) | Coordena especialistas, filtra ruído | Gerente Instagram |
| Especialista (50) | Executa tarefas técnicas, gera relatórios | Especialista UX |
| Microagente (200+) | Tarefas curtas e específicas | Ler uma notícia, analisar uma página |

## Ciclo contínuo

1. Observar (site, métricas, notícias, tendências)
2. Analisar e gerar hipóteses
3. Priorizar melhorias
4. Implementar em ambiente de teste
5. Executar testes automatizados e medir resultados
6. Aprovar ou reverter altera��ões
7. Repetir continuamente

## Regras

- O usuário está acima de tudo.
- Codex é o coordenador operacional final.
- Claude executa implementações locais.
- Hermes coordena workers e fornece LLM local.
- Nenhuma alteração vai para produção sem aprovação do usuário.
- Instagram/Facebook/WhatsApp: apenas perfil autorizado (Clovis Sampaio / Junior Clovis Sampaio).
- Todo relatório passa pelo Conselho Estratégico antes de implementação.

## Como usar

```bash
# Executar ciclo completo dos agentes
node agent-os/runtime/agent-os-runtime.js --cycle full

# Executar apenas uma equipe
node agent-os/runtime/agent-os-runtime.js --team editorial

# Executar um agente específico
node agent-os/runtime/agent-os-runtime.js --agent ux-researcher

# Gerar relatório
node agent-os/runtime/agent-os-runtime.js --report weekly

# Abrir supervisor
# Acessar: http://localhost:3000/agent-os-supervisor.html
```

## Integração com Codex existente

- Consome `/api/real-agents` e `/api/real-agents/run`
- Consome `/api/cheffe-call`
- Consome `/api/office-orders`
- Consome endpoints de notícias e IA local
- Escreve relatórios em `.codex-temp/agent-os/`
- Registra estado em `data/agent-os-state.json`
