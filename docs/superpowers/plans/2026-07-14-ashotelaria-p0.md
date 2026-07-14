# AShotelaria P0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar um P0 funcional e exclusivamente online do AShotelaria com PMS, disponibilidade, reservas, acesso por cargo, governança básica, painel e motor público, integrado localmente ao servidor do Catálogo CZS.

**Architecture:** Monólito modular CommonJS isolado em `ashotelaria/`, com domínio puro, store em memória para teste/demo e store PostgreSQL para produção. O mesmo site responsivo em `ashotelaria-app/` monta a interface por função autenticada; todas as autorizações são validadas novamente no backend. Não existe persistência, fila ou operação offline; `server.js` apenas delega APIs e aliases, preservando a home editorial.

**Tech Stack:** Node.js 18+, CommonJS, `node:test`, PostgreSQL via `pg`, HTML5, CSS moderno, JavaScript nativo e Render Web Service/Postgres.

---

### Task 1: Contratos do domínio hoteleiro

**Files:**
- Create: `ashotelaria/domain.js`
- Test: `ashotelaria/__tests__/domain.test.js`

- [ ] Escrever testes para normalização de datas, número de noites, sobreposição de estadias, cálculo de preço e resumo operacional.
- [ ] Rodar `node --test ashotelaria/__tests__/domain.test.js` e confirmar falha por módulo ausente.
- [ ] Implementar `parseStayRange`, `countNights`, `rangesOverlap`, `calculateStayTotal`, `buildOperationalSummary` e validações.
- [ ] Rodar o teste e confirmar todos os casos verdes.

### Task 2: Store em memória, seed e isolamento

**Files:**
- Create: `ashotelaria/seed.js`
- Create: `ashotelaria/memory-store.js`
- Test: `ashotelaria/__tests__/memory-store.test.js`

- [ ] Testar bootstrap por tenant/propriedade, disponibilidade, criação idempotente, bloqueio de sobreposição e alteração de status da UH.
- [ ] Criar seed fictício do Hotel Juruá Palace com tipos, UHs, hóspedes, reservas e integrações sandbox.
- [ ] Implementar store assíncrono com a mesma interface esperada do PostgreSQL.
- [ ] Confirmar que consultas com tenant errado não retornam dados.

### Task 3: Esquema e adaptador PostgreSQL

**Files:**
- Create: `ashotelaria/migrations/001_initial.sql`
- Create: `ashotelaria/postgres-store.js`
- Create: `ashotelaria/store.js`
- Modify: `package.json`
- Modify: `package-lock.json`
- Test: `ashotelaria/__tests__/store.test.js`

- [ ] Adicionar `pg` e testar que produção sem `ASHOTELARIA_DATABASE_URL` falha com mensagem segura.
- [ ] Criar tabelas, índices, constraints e chaves compostas com `tenant_id`.
- [ ] Implementar reserva em transação `READ COMMITTED`, adquirindo advisory lock por tenant/propriedade antes das leituras de idempotência e inventário, com `SELECT ... FOR UPDATE SKIP LOCKED` nas UHs candidatas.
- [ ] Implementar seleção explícita do store: memória só em teste/demo não produtivo; PostgreSQL em produção.

### Task 4: Identidade, RBAC e handler HTTP

**Files:**
- Create: `ashotelaria/auth.js`
- Create: `ashotelaria/http.js`
- Test: `ashotelaria/__tests__/http.test.js`

- [ ] Testar rotas públicas de disponibilidade/reserva, sessão individual, seleção de contexto e rotas operacionais protegidas por permissão.
- [ ] Implementar `GET /health`, `GET /public/properties/:slug`, `GET /public/availability`, `POST /public/reservations`, `GET /bootstrap`, `GET /reservations` e `PATCH /rooms/:id/status`.
- [ ] Implementar papéis `superadmin`, `proprietario`, `administrador`, `gerente`, `recepcionista`, `camareira`, `supervisor_governanca`, `contador`, `financeiro`, `caixa`, `manutencao`, `revenue_manager`, `auditor` e `hospede`, com permissões granulares e escopo por tenant/propriedade.
- [ ] Exigir sessão individual em produção, limitar corpo, validar content-type, mascarar erro interno e adicionar correlation ID.
- [ ] Garantir que fluxo de caixa completo só seja autorizado a `contador`, `financeiro`, `administrador` e proprietário explicitamente autorizado.
- [ ] Retornar `409` para conflito de inventário e repetir a mesma resposta para chave idempotente já processada.

### Task 5: Site operacional responsivo por função

**Files:**
- Create: `ashotelaria-app/index.html`
- Create: `ashotelaria-app/styles.css`
- Create: `ashotelaria-app/app.js`

- [ ] Criar shell acessível com sidebar, topo, usuário/cargo/hotel, estado de conexão e navegação por hash.
- [ ] Montar menus pelo conjunto de permissões retornado pelo servidor, nunca por valores confiados do navegador.
- [ ] Implementar painéis funcionais por cargo: recepção, camareira, supervisão, manutenção, financeiro/contador e administração.
- [ ] Consumir bootstrap/API, renderizar estados vazio, erro e perda de conexão, e permitir mudança real de status da UH.
- [ ] Ao perder conexão, bloquear mutações e não salvar reservas, hóspedes, documentos, valores ou tarefas no armazenamento local.

### Task 6: Motor público de reservas

**Files:**
- Create: `ashotelaria-app/booking.html`
- Create: `ashotelaria-app/booking.js`

- [ ] Criar busca de datas/hóspedes e lista de acomodações disponíveis.
- [ ] Manter preço total, políticas e recursos de acessibilidade visíveis.
- [ ] Implementar formulário curto de hóspede e confirmação via API com chave de idempotência.
- [ ] Exibir explicitamente `Pagamento na hospedagem — sandbox` enquanto não houver provedor homologado.

### Task 7: Integração segura com o Catálogo CZS

**Files:**
- Modify: `server.js`
- Test: `ashotelaria/__tests__/server-integration.test.js`

- [ ] Importar e instanciar o handler AShotelaria sem mover regras para `server.js`.
- [ ] Delegar `/api/ashotelaria/v1/*` antes das rotas legadas.
- [ ] Criar aliases `/czs-labs/ashotelaria`, `/ashotelaria/app`, `/hoteis` e `/reservar/:slug`.
- [ ] Confirmar que `/`, notícias, PubPaid e APIs existentes continuam com o mesmo comportamento.

### Task 8: Documentação operacional e configuração

**Files:**
- Create: `docs/ASHOTELARIA.md`
- Create: `ashotelaria/.env.example`
- Modify: `package.json`

- [ ] Documentar arquitetura, execução local, modo demo, migração PostgreSQL, variáveis e limites do sandbox.
- [ ] Adicionar scripts `ashotelaria:test` e `ashotelaria:check`.
- [ ] Documentar proposta de recursos Render sem alterar ou publicar infraestrutura.
- [ ] Listar integrações que exigem credenciais e homologação.

### Task 9: Verificação completa e visual

**Files:**
- Create: `outputs/ashotelaria-p0/RELATORIO-VALIDACAO.md`

- [ ] Rodar `npm run ashotelaria:test`, testes legados e `node --check server.js`.
- [ ] Subir servidor local com demo habilitada e validar APIs por HTTP.
- [ ] Testar painel e motor online em navegador real, desktop e viewport móvel, alternando contas/cargos.
- [ ] Testar que camareira não acessa hóspedes/financeiro, recepcionista não acessa DRE/usuários e somente contador/financeiro/administrador acessa fluxo de caixa.
- [ ] Inspecionar console, acessibilidade básica, foco, contraste e estados offline/erro.
- [ ] Registrar evidências, pendências e o portão R5 de deploy no relatório final.
