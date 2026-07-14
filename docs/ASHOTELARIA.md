# AShotelaria

Sistema hoteleiro online do CZS Labs integrado ao Catálogo CZS. O painel operacional e o motor público usam o mesmo servidor e uma base PostgreSQL central. Não há modo desconectado, fila local, cache de dados operacionais ou sincronização posterior.

## Endereços

- `/ashotelaria/app` e `/czs-labs/ashotelaria`: acesso da equipe.
- `/hoteis`: motor público da unidade padrão.
- `/reservar/:slug`: reserva pública por hotel.
- `/api/ashotelaria/v1/health`: saúde do módulo.

## Acesso por cargo

O usuário inicial é `admin`. O cargo é selecionado de forma explícita no login e faz parte da identidade autenticada. O servidor valida todas as permissões; ocultar menus no navegador é apenas uma projeção visual, nunca a barreira de segurança.

Papéis disponíveis: proprietário, administrador, gerente, recepção, camareira, supervisão de governança, contador, financeiro, caixa, manutenção, gestão de tarifas e auditoria. A camareira recebe somente suas tarefas atribuídas e os quartos correspondentes. Fluxo financeiro é restrito aos papéis autorizados pelo RBAC.

As quatro senhas iniciais são recebidas exclusivamente por variáveis protegidas do ambiente. Senhas temporárias curtas são aceitas somente no provisionamento inicial e exigem troca antes do uso do sistema. Troca própria e redefinição administrativa exigem a política normal de no mínimo oito caracteres. O administrador principal pode redefinir a senha temporária de outro cargo, invalidando as sessões anteriores.

## Variáveis

Copie `ashotelaria/.env.example` para a configuração segura do ambiente. Nunca salve os valores reais no repositório.

- `ASHOTELARIA_DATABASE_URL`: conexão PostgreSQL com TLS em produção.
- `ASHOTELARIA_SESSION_SECRET`: segredo aleatório com ao menos 32 caracteres.
- `ASHOTELARIA_ADMIN_PASSWORD`: senha inicial de proprietário/administrador.
- `ASHOTELARIA_FINANCE_PASSWORD`: senha inicial de contador/financeiro/caixa/tarifas.
- `ASHOTELARIA_RECEPTION_PASSWORD`: senha inicial da recepção.
- `ASHOTELARIA_DEFAULT_PASSWORD`: senha inicial dos demais cargos.

## Execução local

```powershell
npm install
$env:ASHOTELARIA_DEMO_MODE = "true"
$env:ASHOTELARIA_SESSION_SECRET = "use-um-segredo-local-com-mais-de-32-caracteres"
$env:ASHOTELARIA_ADMIN_PASSWORD = "senha-temporaria-de-teste"
$env:ASHOTELARIA_FINANCE_PASSWORD = "senha-temporaria-de-teste"
$env:ASHOTELARIA_RECEPTION_PASSWORD = "senha-temporaria-de-teste"
$env:ASHOTELARIA_DEFAULT_PASSWORD = "senha-temporaria-de-teste"
npm start
```

O modo demo mantém os dados somente na memória do processo e é bloqueado quando `NODE_ENV=production`. Produção exige PostgreSQL.

## Banco e testes

```powershell
npm run ashotelaria:migrate
npm run ashotelaria:test
```

As reservas usam chave de idempotência persistente, transação e trava por hotel antes da leitura do inventário. Datas usam checkout exclusivo e preços são inteiros em centavos.

## Integrações

Pagamento, fiscal e FNRH permanecem identificados como `sandbox` até que cada fornecedor entregue credenciais e conclua homologação. O P0 confirma pagamento na hospedagem; ele não simula captura financeira nem emissão fiscal real.

## Render

O serviço web deve receber a URL interna do PostgreSQL e os cinco segredos acima. Migrações são idempotentes e precisam terminar antes de liberar a nova versão. Depois do deploy, valide `/health`, login por ao menos administrador, recepção e camareira, troca de senha, isolamento de menus e uma reserva pública de teste.
