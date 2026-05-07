# PubPaid 1 - fonte legada

Status: descontinuado como produto ativo.

PubPaid 1 fica no projeto apenas para consulta e extracao controlada de metodos de pagamento, carteira, admin e dashboard. Nao usar esta frente para evoluir jogo, arte, UI publica, fluxo visual ou runtime de gameplay.

## Arquivos fonte

- `pubpaid-runtime.js`: fonte principal de store, carteira, depositos, saques, aprovacoes, locks e payload do dashboard.
- `pubpaid-admin.html`: referencia de painel admin para revisar depositos, retiradas, carteiras e relatorios.
- `pubpaid.js`: referencia de cliente para Google, Pix, deposito, saque, saldo e historico.
- `pubpaid.html`: referencia de markup para caixa Pix, carteira e entrada do admin.
- `pubpaid.css`: referencia visual apenas para entender estados de carteira/admin; nao copiar tema para PubPaid 2 sem nova direcao.

## Regra de uso

- Nao publicar alteracoes de PubPaid 1.
- Nao adicionar feature nova em PubPaid 1.
- Nao trocar arte, fluxo publico ou jogo em PubPaid 1.
- Nao usar PubPaid 1 para comparar direcao visual da PubPaid 2.
- Ao extrair algo, criar patch no destino real e citar qual funcao/padrao foi usado como fonte.

## Destinos provaveis

- Pagamento/carteira: extrair de `pubpaid-runtime.js` para o runtime oficial que estiver ativo.
- Dashboard/admin: extrair de `pubpaid-admin.html` e `pubpaid-runtime.js`.
- Cliente PubPaid 2: adaptar somente depois de ordem explicita e teste local.

## Testes minimos ao extrair

- `node --check server.js`
- `node --check pubpaid-runtime.js`
- teste manual ou scriptado do fluxo alterado no destino real

Se a mudanca envolver PubPaid 2 visual, tambem rodar `npm run pubpaid:visual-audit` e nao declarar visual limpo se falhar.
