# AShotelaria P0 Design

## Objetivo

Entregar o primeiro corte funcional do AShotelaria dentro do Catálogo CZS sem alterar a homepage editorial: painel operacional, inventário de UHs, disponibilidade, reservas, hóspedes, governança básica e motor público de reserva, todos centralizados online e preparados para persistência PostgreSQL no Render.

## Escopo desta rodada

O P0 cobre uma propriedade por navegação, mas o modelo é multi-tenant e multipropriedade desde o banco. O usuário consegue abrir o painel, consultar chegadas/saídas/ocupação, filtrar reservas, alterar o estado operacional de quartos, consultar disponibilidade e criar uma reserva direta. A reserva usa idempotência e bloqueia sobreposição. No PostgreSQL, reservas da mesma propriedade são serializadas logicamente por advisory lock antes de qualquer leitura relevante, dentro de uma transação `READ COMMITTED`; a segurança não depende de snapshot `SERIALIZABLE`.

FNRH, NFS-e, Pix, cartão e channel manager aparecem somente no painel de integrações com estados reais `sandbox`, `configuração necessária` ou `indisponível`. Nenhuma integração externa é simulada como concluída.

## Arquitetura

- `ashotelaria/`: domínio CommonJS, store em memória para demo/teste, adaptador PostgreSQL, autenticação operacional e handler HTTP isolado.
- `ashotelaria/migrations/`: SQL versionado para organizações, propriedades, tipos de UH, UHs, hóspedes, reservas, vínculos de reserva, integrações e auditoria.
- `ashotelaria-app/`: site administrativo responsivo e motor público de reservas em HTML/CSS/JS sem build, compatíveis com o servidor atual.
- `server.js`: somente composição do módulo, delegação das rotas `/api/ashotelaria/v1/*` e aliases públicos; nenhuma regra hoteleira entra no monólito existente.

Em desenvolvimento e testes, o sistema usa um store em memória com dados fictícios do Hotel Juruá Palace. Em produção, `ASHOTELARIA_DATABASE_URL` é obrigatório e o processo deve falhar de forma segura se não houver PostgreSQL. O modo demo nunca é ativado implicitamente em produção.

## Segurança

As respostas nunca retornam documentos completos nem segredos. Em produção, todas as rotas operacionais exigem sessão individual autenticada. A autorização combina tenant, propriedade, cargo, departamento, turno e permissão granular; esconder menus nunca substitui a validação no backend. Toda mutação recebe `tenantId`, `propertyId`, `actor` e evento de auditoria. O adaptador PostgreSQL filtra todas as consultas pelo tenant/propriedade.

O mesmo site `/ashotelaria/app` atende todos os funcionários. Depois do login, a navegação é montada pelo cargo: camareira vê somente suas tarefas e dados operacionais mínimos; recepcionista vê recepção e reservas; supervisor vê governança; manutenção vê ordens; contador/financeiro e administrador são os únicos perfis com fluxo de caixa completo. Usuários com mais de uma função selecionam um contexto autorizado, registrado na auditoria.

O produto é exclusivamente online. Não haverá fila local, banco local, sincronização posterior nem cache de reservas, hóspedes, valores ou documentos. Em perda de conexão, a interface bloqueia mutações, informa o estado e consulta novamente o servidor antes de repetir qualquer ação.

## UX

O painel é mobile-first, com agenda operacional e exceções antes de métricas. A identidade usa azul profundo, areia e cobre, distinta do jornal sem romper com a marca CZS. Não haverá menu com botão falso: cada item autorizado abre uma tela funcional. O motor público mantém preço total e políticas visíveis e conclui a reserva em até três etapas.

## Fora do escopo desta rodada

- Transmissão real FNRH.
- Emissão fiscal real.
- Cobrança real Pix/cartão.
- Sincronização real com OTAs.
- Deploy, push ou alteração de recursos Render.
- CRM avançado, RMS, PDV, estoque, manutenção preventiva e BI financeiro completo.

Esses módulos permanecem previstos no prompt mestre, mas exigem planos próprios após a validação do P0.

## Critérios de aceite

1. Testes bloqueiam datas inválidas, sobreposição, acesso cruzado e operação fora da permissão do cargo.
2. Duas requisições com a mesma chave de idempotência criam uma única reserva.
3. O painel exibe métricas derivadas dos dados reais do store.
4. Alterar status de UH atualiza o painel e gera auditoria.
5. O motor público consulta disponibilidade e cria reserva confirmada em modo demo.
6. Produção sem banco/token não cai silenciosamente em demo.
7. Páginas funcionam online em desktop e mobile e passam por verificação visual; sem conexão, mutações são bloqueadas sem armazenamento local.
8. `server.js` continua sintaticamente válido e os testes anteriores permanecem verdes.
