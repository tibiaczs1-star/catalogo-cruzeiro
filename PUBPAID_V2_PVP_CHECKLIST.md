# PubPaid 2.0 - Checklist de Execucao PvP

Este documento consolida a decisao de produto para iniciar a PubPaid 2.0 sem quebrar a versao atual.

## Fluxo de entrada

1. Splash / `Enter game`.
2. Rua viva em frente ao PubPaid.
3. Login Google.
4. Convite: `Ta duro? Experimente.`
5. 100 creditos de teste, nao apostaveis e sem saque.
6. Modo IA simples para aprender.
7. Deposito real pelo sistema ja existente.
8. Carteira atualiza sem F5.
9. Desbloqueio cosmetico: 5 sprites base e 10 sprites/itens premium.
10. PvP real com escrow.

## Regras de carteira

- `testCoins`: so modo teste contra IA/maquina.
- `availableCoins`: saldo real aprovado e disponivel.
- `lockedMatchCoins`: saldo travado em mesa PvP.
- `lockedWithdrawalCoins`: saldo em saque pendente.
- `settledCoins`: valores liquidados em historico/ledger.

Credito de teste nunca vira saldo real, nunca saca e nunca entra em mesa PvP real.

## PvP real minimo

- Matchmaking por `gameId + stake`.
- Escrow obrigatorio no `join`.
- Servidor autoritativo para toda jogada.
- Cliente envia intencao; servidor valida turno, estado, saldo e resultado.
- Logs append-only por partida.
- Idempotencia em entrada, jogada, abandono e liquidacao.
- Reconexao por Google/wallet.
- Abandono: 60 segundos para voltar; depois perde.
- Payout padrao: vencedor recebe 80% do pote, casa retém 20%.
- Empate: refund ou split, definido por jogo antes da mesa abrir.

## Ordem dos jogos

### MVP real

- Dardos: pontuacao por hitbox, mesmo numero de arremessos.
- Dama: sem RNG, turno claro, resultado auditavel.

### Segunda onda

- Truco: deck no servidor, manilha registrada, log de vazas.
- Poker: embaralhamento auditavel, descarte/troca registrado.

### Aguardar

- 21 do Bar: entra depois por ter peso maior de sorte.
- Caca-niqueis: somente evento competitivo, nunca jogador contra maquina.
- Roleta, dados/copos: manter como demo/evento ate blindagem juridica e tecnica.

## Primeira entrega tecnica recomendada

1. Criar ledger real com `available`, `lockedMatch`, `lockedWithdrawal`.
2. Adaptar `/api/pubpaid/pvp/join` para travar escrow antes de parear.
3. Adaptar finalizacao da partida para liquidar 80/20.
4. Adicionar `deadlineAt` e job/endpoint de abandono.
5. Adicionar polling da carteira no game a cada 5-15s e no foco da aba.
6. Adicionar auditoria admin de partidas.

## Observacao legal

Antes de dinheiro real publico, revisar com advogado/regulatorio. O produto deve evitar parecer aposta contra a casa/RNG. A linha segura do MVP e competicao jogador contra jogador com regras claras, logs e resultado auditavel.
