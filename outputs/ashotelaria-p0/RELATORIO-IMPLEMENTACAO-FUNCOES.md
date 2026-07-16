# AShotelaria — Relatório de implementação e funções

Data: 16/07/2026  
Escopo: sistema hoteleiro web desktop, mobile responsivo e instalável como app/PWA.

## Resultado implementado

O AShotelaria foi fechado como sistema operacional para hotel, sem linguagem de demonstração na entrada. A interface trabalha em tons claros de vermelho, com ajuda contextual por área e controle hierárquico: quem está no topo enxerga a cadeia inteira; cargos abaixo recebem apenas o que é do seu setor.

## Plataformas atendidas

- Web desktop: painel operacional em `/ashotelaria/app`.
- Mobile: navegação inferior, formulários adaptados, captura de foto com câmera do aparelho.
- App/PWA: `manifest.webmanifest`, tema vermelho, modo `standalone`, escopo raiz e ícones 192/512.
- Portal público/cliente: reserva, serviços do quarto, limpeza agendada, parceiros e chamados em `/hoteis` ou `/reservar/hotel-jurua-palace`.

## Acessos e hierarquia

- Administrador, proprietário, superadmin e gerente têm visão ampla da operação.
- Recepção acessa reservas, balcão e rotina de hospedagem.
- Camareira acessa tarefas atribuídas, status de quarto e foto de entrega.
- Manutenção acessa ordens técnicas.
- Financeiro, contador e caixa acessam áreas financeiras conforme permissão.
- O mesmo usuário `admin` pode entrar com cargos diferentes sem misturar permissões.

## Operação de quartos

- Cadastro de quarto, tipo, status operacional e relação com reserva.
- Estados: disponível, ocupado, limpeza pendente, em limpeza, inspecionado, manutenção, interditado e não perturbe.
- Upload/captura de foto do quarto.
- Foto de entrega da camareira ou administrador.
- Ao salvar foto de entrega, o quarto pode avançar para inspecionado e tarefas relacionadas são concluídas.
- Espaço operacional para futura correção automática por imagem.

## Reserva e entrada direta

- Reserva pública online com consulta de disponibilidade.
- Proteção de estoque contra conflito.
- Reserva com chave de idempotência para evitar duplicidade.
- Entrada imediata no balcão para hóspede que chega sem reserva.
- Check-in bloqueado fora da data operacional da propriedade.
- Check-out muda o quarto para limpeza pendente.

## Documentação do hóspede

- Ficha operacional com nome, e-mail, telefone e documento.
- Campo preparado para RG/CPF/documento apresentado.
- Dados de documento são mascarados nas leituras operacionais.
- Estrutura permite expansão para endereço, nacionalidade, profissão, origem/destino e ficha nacional quando necessário.

## Governança e camareiras

- Distribuição automática de demanda entre camareiras.
- Tipos de tarefa:
  - limpeza diária;
  - limpeza final;
  - contagem de consumo.
- Balanceamento por carga aberta.
- Notificações geradas para a camareira atribuída.
- Solicitação do hóspede informa horário em que estará fora do quarto.
- Tarefa registra origem: sistema, distribuição automática ou portal do cliente.

## Portal do cliente

- Agendamento de limpeza.
- Pedido de contagem de consumo.
- Chamado para recepção, governança ou gerência.
- Lista de parceiros com desconto.
- Cardápio de fast food/room service para pedir comida no quarto.
- Pedido fica visível na central do administrador.

## Parceiros e restaurante

- Cadastro inicial de parceiros por categoria:
  - restaurante;
  - vendas;
  - turismo;
  - serviços.
- Cada parceiro tem desconto, contato e descrição.
- Cardápio de room service com preço em centavos e categoria.
- Pedidos vinculados à reserva ativa e ao quarto.

## Central do administrador

- Área “Central” no painel.
- Leitura via `/admin/overview`.
- Indicadores de quartos, limpeza, chamados e receita.
- Gráficos por status de governança e quartos.
- Pedidos de comida no quarto.
- Chamados do cliente.
- Situação de quarto arrumado e foto de entrega.
- Botão para distribuir limpezas.
- Área para preparar mensagem direta para cliente ou funcionário.

## Backend/API

Rotas adicionadas ou reforçadas:

- `GET /public/client-portal`
- `POST /public/service-requests`
- `POST /public/room-service-orders`
- `POST /public/messages`
- `GET /admin/overview`
- `POST /housekeeping/distribute`

Persistência:

- Store em memória atualizada.
- Store Postgres atualizada.
- Migração `004_client_portal_ops.sql`.
- Bootstrap de parceiros e cardápio.

## Segurança e confiabilidade

- RBAC por cargo.
- Sessão por cookie assinado.
- Troca e redefinição de senha.
- Senha temporária com troca obrigatória quando configurado.
- Rate/lock de tentativas falhas.
- Erros públicos controlados.
- Sem exposição de segredo de integração.
- Sem retorno de token de sessão.

## Validação executada

- `node --test ashotelaria/__tests__/memory-store.test.js ashotelaria/__tests__/http.test.js ashotelaria/__tests__/frontend-contract.test.js`
  - Resultado: 72/72 testes passaram.
- `npm test`
  - Resultado: 130/130 testes passaram.
- `npm run ashotelaria:check`
  - Resultado: checagem sintática sem erro.
- Smoke local:
  - `/ashotelaria/app` retornou HTTP 200.
  - `/hoteis` retornou HTTP 200.
  - `/ashotelaria-app/manifest.webmanifest` retornou HTTP 200.

## Arquivos principais alterados

- `ashotelaria/seed.js`
- `ashotelaria/memory-store.js`
- `ashotelaria/postgres-store.js`
- `ashotelaria/http.js`
- `ashotelaria/migrate.js`
- `ashotelaria/migrations/004_client_portal_ops.sql`
- `ashotelaria-app/index.html`
- `ashotelaria-app/booking.html`
- `ashotelaria-app/booking.js`
- `ashotelaria-app/app.js`
- `ashotelaria-app/styles.css`
- `ashotelaria-app/manifest.webmanifest`
- testes de contrato, HTTP, memória e migração.

## Pendências futuras recomendadas

- Conectar envio real de mensagem por WhatsApp/SMS/e-mail.
- Integrar análise automática de imagem com modelo visual em produção.
- Expandir ficha documental para padrão completo de FNRH, se o hotel for operar hospedagem formal com envio/guarda desse formulário.
- Criar contas reais individuais para cada funcionário, além do modo atual por cargo.
