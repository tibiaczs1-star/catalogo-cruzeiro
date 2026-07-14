# AShotelaria Check-in Safety Design

## Objetivo

Impedir que `confirmed -> checked_in` altere uma reserva ou um quarto fora do dia operacional de entrada, com quarto incompatível ou quando outra hospedagem já ocupa o mesmo quarto.

## Regras aprovadas

- O dia operacional é calculado no fuso `properties.timeZone`, usando relógio injetável nos stores.
- Check-in é permitido somente quando o dia operacional é exatamente `reservation.checkIn` e anterior a `reservation.checkOut`.
- Apenas quartos `available` ou `inspected` estão prontos para check-in.
- Qualquer outro estado, inclusive `maintenance`, `blocked`, `dirty`, `cleaning`, `occupied` e `do_not_disturb`, produz `ROOM_NOT_READY` sem mutação.
- Outra reserva `checked_in` no mesmo tenant, propriedade e quarto também produz `ROOM_NOT_READY`.
- Regra de data inválida produz `CHECK_IN_NOT_ALLOWED`.
- Os dois erros são públicos e mapeados para HTTP 409.

## Atomicidade

O memory store serializa a transição pelo quarto associado e valida todas as invariantes antes de qualquer mutação. O PostgreSQL bloqueia a reserva, bloqueia o quarto com `FOR UPDATE`, consulta outra reserva `checked_in` e somente então atualiza reserva e quarto. A auditoria permanece na mesma seção crítica/transação.

## Relógio e seed

`createMemoryStore` e `createPostgresStore` recebem `now`, uma função que retorna `Date` ou `YYYY-MM-DD`. A conversão de `Date` usa exclusivamente o fuso da propriedade. O cenário confirmado do seed usa entrada em `2026-07-14` e saída em `2026-07-16`.

## Testes

Os testes cobrem dia anterior, limite de checkout, conversão no fuso da propriedade, quarto incompatível sem sobrescrita, conflito com outra hospedagem, locks SQL, rollback, sucesso com auditoria e resposta HTTP pública 409.
