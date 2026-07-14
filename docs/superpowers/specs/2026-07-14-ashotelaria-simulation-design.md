# AShotelaria: acesso e operação simulada

## Objetivo

Entregar uma versão demonstrativa funcional do Hotel Juruá Palace enquanto os dados verdadeiros não estiverem disponíveis. Login, consulta de disponibilidade e reserva devem funcionar no navegador publicado, usando o mesmo banco e as mesmas APIs que receberão os dados reais.

## Diagnóstico confirmado

Os formulários de login, disponibilidade e hóspede chamam `setBusy` antes de construir `FormData`. Como `setBusy` desativa os campos, o navegador exclui esses valores do envio. O servidor recebe objetos vazios e devolve erros de validação que a interface apresenta como erro genérico.

## Escopo aprovado

- Corrigir a coleta dos formulários antes de desativar os controles.
- Manter o usuário `admin` e senhas iniciais por cargo, com acesso direto no modo demonstração.
- Mostrar claramente as credenciais demonstrativas na entrada, sem texto longo.
- Ampliar o Hotel Juruá Palace para três categorias e doze quartos demonstrativos.
- Permitir consulta e criação de reserva pelo fluxo público.
- Permitir no painel confirmar, cancelar, fazer check-in e check-out de reservas.
- Permitir alterar o estado operacional dos quartos.
- Identificar os dados como `SIMULAÇÃO`, preservando banco PostgreSQL, isolamento por hotel, auditoria e idempotência.
- Não processar cobrança real; o pagamento permanece como sandbox/na hospedagem.

## Arquitetura

O frontend continuará estático em `ashotelaria-app/` e consumirá `/api/ashotelaria/v1`. O domínio e as stores continuarão responsáveis por validação e persistência. Novas transições de reserva serão expostas por uma rota autenticada e auditadas no banco. O seed PostgreSQL será idempotente, adicionando inventário e reservas demonstrativas sem apagar registros criados durante os testes.

## Estados

Reservas seguem `confirmed -> checked_in -> checked_out`; uma reserva `confirmed` também pode ir para `cancelled`. Quartos continuam usando os estados existentes (`available`, `occupied`, `dirty`, `cleaning`, `inspected`, `maintenance`, `blocked`, `do_not_disturb`). Check-in marca o quarto ocupado; check-out marca o quarto sujo; cancelamento libera um quarto que ainda não recebeu check-in.

## Erros e segurança

Erros conhecidos ganham mensagem direta em português. Credenciais não são incluídas em respostas da API. O modo demonstrativo pode dispensar a troca obrigatória da senha inicial por configuração explícita; ao sair do modo demonstração, a política segura volta a exigir troca. Todas as mutações autenticadas preservam permissões e auditoria.

## Verificação

Primeiro serão criados testes que falham para a ordem incorreta de `FormData`, transições de reserva e seed demonstrativo. Depois serão executadas as suítes Node, verificações de sintaxe, testes HTTP e um roteiro manual no Google Chrome: login administrativo, navegação pelo painel, consulta de quartos, criação de reserva, visualização no painel, check-in e check-out.
