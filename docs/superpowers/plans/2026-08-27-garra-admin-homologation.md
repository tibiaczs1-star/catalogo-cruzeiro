# Garra dos Sonhos — painel administrativo CZS (homologação)

> **Para agentes:** executar tarefa por tarefa com TDD e revisão independente. Este plano não autoriza deploy, push, cobrança, saque, entrega de prêmio físico, nem alteração de conta externa.

**Objetivo:** criar a subpágina desktop `/garra-admin/` no Catálogo CZS para operar estoque e observar uma carteira de homologação, com trilha de auditoria. A primeira versão é uma base local segura para o jogo Godot/PC: não processa dinheiro real e não expõe matemática de margem.

**Tese visual:** console administrativo sóbrio, claro e desktop-first; uma faixa persistente de status informa `HOMOLOGAÇÃO — cobrança e saque desativados`. Nada de visual de cassino e nenhum indicador de probabilidade para o operador ou jogador.

**Plano de conteúdo:** resumo operacional, estoque por lote/raridade, extrato imutável e auditoria. Valores, quando existirem, são inteiros em centavos; a tela deixa explícito que são dados de teste até uma integração financeira revisada.

**Tese de interação:** leituras rápidas no painel; toda mutação usa uma chave de idempotência, registra ator/hora/motivo e retorna um recibo. A API é protegida pela autenticação administrativa existente do CZS; autenticação Google comum não concede este acesso.

**Arquitetura:** integrar um módulo CommonJS `garra-admin` ao `server.js` principal, usando `DATA_DIR/garra-admin` para persistência. O módulo recebe funções de I/O e de autorização por dependência, em vez de repetir segredos ou misturar o legado PubPaid. O jogo Godot permanece cliente separado até existir contrato de API revisado.

**Tecnologias:** Node.js 18+, CommonJS, `node:test`, HTML/CSS/JS nativos.

---

### Tarefa 1: Store de homologação, inventário e ledger de auditoria

**Arquivos:**
- Criar: `garra-admin/store.js`
- Criar: `garra-admin/__tests__/store.test.js`

- [ ] **Passo 1: escrever testes vermelhos do domínio**

Cobrir: estado inicial vazio, criação de lote com quantidade/raridade/custo unitário em centavos, rejeição de quantidade ou dinheiro inválidos, idempotência por chave, e evento de auditoria/ledger que não permite edição ou remoção pela API.

Executar: `node --test garra-admin/__tests__/store.test.js`

Esperado: falha porque o store ainda não existe.

- [ ] **Passo 2: implementar store isolado**

Persistir em `DATA_DIR/garra-admin/state.json` por adaptadores injetados. Modelar valores monetários exclusivamente como inteiros `*_cents`; separar `inventoryBatches`, `ledger` e `auditEvents`; limitar paginação e nunca calcular ou retornar fórmulas de margem. Cada escrita deve ter `idempotencyKey`, `actor`, `reason` e `createdAt`.

- [ ] **Passo 3: passar os testes do domínio**

Executar: `node --test garra-admin/__tests__/store.test.js`

Esperado: PASS.

### Tarefa 2: Contrato HTTP administrativo, protegido e limitado a homologação

**Arquivos:**
- Criar: `garra-admin/server-integration.js`
- Criar: `garra-admin/__tests__/server-integration.test.js`

- [ ] **Passo 1: escrever testes vermelhos do contrato**

Exigir 401 sem privilégio administrativo, `GET /api/garra-admin/health`, `GET /api/garra-admin/summary`, `GET /api/garra-admin/inventory`, `POST /api/garra-admin/inventory/batches` e `GET /api/garra-admin/ledger`. Verificar que respostas sempre incluem `mode: "homologation"`, não têm rotas de depósito/saque/resgate e exigem `Idempotency-Key` para escrita.

Executar: `node --test garra-admin/__tests__/server-integration.test.js`

Esperado: falha porque a integração ainda não existe.

- [ ] **Passo 2: implementar o handler injetável**

Criar `createGarraAdminServerIntegration({ rootDir, dataDir, sendFile, isAdmin, readJson, writeJson })`. Aceitar apenas os métodos e caminhos acima. Enviar cabeçalhos `Cache-Control: no-store` para HTML/API, retornar erros JSON sem detalhes internos e responder 401 sem revelar credenciais.

- [ ] **Passo 3: passar os testes do contrato**

Executar: `node --test garra-admin/__tests__/server-integration.test.js`

Esperado: PASS.

### Tarefa 3: Interface desktop de operação

**Arquivos:**
- Criar: `garra-admin/public/index.html`
- Criar: `garra-admin/public/garra-admin.css`
- Criar: `garra-admin/public/garra-admin.js`
- Criar: `garra-admin/__tests__/frontend-contract.test.js`

- [ ] **Passo 1: teste vermelho de contrato da página**

Exigir faixa de homologação, regiões de resumo, estoque, formulário de lote, ledger/auditoria, texto explícito de bloqueio de cobrança/saque e nenhum texto/promessa de ganho, probabilidade ou prêmio garantido.

Executar: `node --test garra-admin/__tests__/frontend-contract.test.js`

Esperado: falha porque a interface ainda não existe.

- [ ] **Passo 2: implementar a tela**

Implementar layout desktop com navegação por seções, tabela legível, estados vazio/carregando/erro e formulário que envie `Idempotency-Key` novo por submissão. Renderizar valores de centavos com `Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })` somente como referência de homologação; nunca aceitar valor de ponto flutuante do usuário.

- [ ] **Passo 3: validar o contrato da UI**

Executar: `node --test garra-admin/__tests__/frontend-contract.test.js`

Esperado: PASS.

### Tarefa 4: Ligar a subpágina ao servidor CZS sem tocar no legado financeiro

**Arquivos:**
- Modificar: `server.js`
- Criar: `garra-admin/README.md`
- Modificar: `garra-admin/__tests__/server-integration.test.js`

- [ ] **Passo 1: teste vermelho de montagem**

Cobrir que `/api/garra-admin/*` chega ao módulo e que `/garra-admin` redireciona para `/garra-admin/`, com arquivos estáticos sob o diretório permitido. Confirmar que uma chamada não autorizada não recebe HTML administrativo nem dados.

- [ ] **Passo 2: integrar com dependências explícitas**

No `server.js`, instanciar a integração depois de `DATA_DIR`, passando `sendFile`, `readJson`, `writeJson` e uma função `isAdmin(req)` baseada somente na guarda administrativa existente. Encaminhar API antes do fallback 404 e estáticos antes do portal genérico. Não tocar em PubPaid, depósitos, retiradas ou código legado de carteira.

- [ ] **Passo 3: documentar variáveis e limites operacionais**

No README, registrar rota, persistência, backup, autenticação administrativa existente, modo de homologação e os pré-requisitos obrigatórios para futuro dinheiro real: provedor, assinatura de webhook, idempotência de pagamento, regras públicas, proteção de dados, antifraude, política de resgate/entrega e revisão jurídica/segurança.

- [ ] **Passo 4: executar a suíte específica**

Executar: `node --test garra-admin/__tests__/*.test.js`

Esperado: PASS.

### Tarefa 5: prova local e gate de publicação

**Arquivos:**
- Verificar: `server.js`
- Verificar: `garra-admin/**`

- [ ] **Passo 1: checagem estática**

Executar: `git diff --check -- server.js garra-admin docs/superpowers/plans/2026-08-27-garra-admin-homologation.md`

Esperado: nenhuma saída.

- [ ] **Passo 2: subir servidor local e validar fluxo**

Com dados temporários isolados via `DATA_DIR`, verificar `/garra-admin/`, resposta 401 sem administração e fluxo autorizado de criação idempotente de lote; inspecionar visualmente em largura desktop e notebook.

- [ ] **Passo 3: preparar, mas não publicar**

Relatar resultado e arquivos alterados. Só fazer commit, push ou deploy no Render após autorização explícita separada e depois de revalidar o repositório, o disco persistente do Render e as variáveis de ambiente.
