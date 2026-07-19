# Agent OS — Manifestos Completos (50 Especialistas)

Este arquivo contém os manifestos de todos os 50 especialistas organizados por diretor.

Cada especialista inclui:
- Cargo e especialidade
- Objetivos mensuráveis
- Autonomia e limites
- Ferramentas disponíveis
- Protocolos operacionais
- Sub-rotinas (SOPs)
- Métricas de sucesso

Os manifestos são consumidos pelo runtime do Agent OS e transformados em prompts
para a LLM (Fable 5.0 via Ollama).

## Como usar

```bash
# O runtime carrega estes manifestos automaticamente
node agent-os/runtime/agent-os-runtime.js --cycle full

# Ou execute um especialista específico
node agent-os/runtime/agent-os-runtime.js --agent esp-017
```

## Estrutura

```
Diretor de Tecnologia (10 especialistas)
├── ESP-001: Backend
├── ESP-002: APIs
├── ESP-003: Banco de Dados
├── ESP-004: DevOps
├── ESP-005: Segurança
├── ESP-006: Performance
├── ESP-007: IA Local
├── ESP-008: IA Cloud
├── ESP-009: Frontend
└── ESP-010: UX

Diretor Editorial (11 especialistas)
├── ESP-011: Notícias Locais
├── ESP-012: Notícias Nacionais
├── ESP-013: Fact Checking
├── ESP-014: Copywriting
├── ESP-015: SEO
├── ESP-016: Tendências
├── ESP-017: Instagram
├── ESP-018: Facebook
├── ESP-019: WhatsApp
├── ESP-020: RSS/Feeds
└── ESP-021: Vídeo/Virais

Diretor de Design (7 especialistas)
├── ESP-022: UI
├── ESP-023: Identidade Visual
├── ESP-024: Acessibilidade
├── ESP-025: Animações
├── ESP-026: VFX
├── ESP-027: Landing Pages
└── ESP-028: Comercial

Diretor de Crescimento (9 especialistas)
├── ESP-029: Google Analytics
├── ESP-030: Instagram Metrics
├── ESP-031: Conversão
├── ESP-032: Hashtags
├── ESP-033: Horários
├── ESP-034: Comunidade
├── ESP-035: Ads
├── ESP-036: Patrocínios
└── ESP-037: CRM

Auditor Geral (3 especialistas)
├── ESP-038: Auditor Código
├── ESP-039: Auditor Editorial
└── ESP-040: Auditor Estratégico
```
