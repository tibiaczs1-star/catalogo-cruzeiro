# Protocolo De Automacao De Propagandas

Atualizado: 2026-05-21

Objetivo: fazer postagens comerciais rapido, com menos token/clique e sem enviar no destino errado.

## Regra Principal

Antes de postar, montar a rota:

| Canal | Destino | O que enviar |
| --- | --- | --- |
| WhatsApp | Grupos de venda | Gift cards, servicos digitais, streaming/IA sob consulta, T.I Logistico CZS |
| WhatsApp | Grupos de Uber/transporte | Apenas motorista particular / Julia Oliveira |
| Facebook | Marketplace | Tudo, mas em anuncios separados |
| Instagram | Feed/stories/reels | Somente no final, quando o usuario mandar abrir |

Nunca enviar propaganda em conversa individual, salvo ordem explicita com numero/nome.

## Uso Do Plugin/Controle Direto

- Usar sempre o plugin/controle direto de navegador/tela quando a tarefa envolver WhatsApp, Facebook ou Instagram abertos.
- Nao improvisar por URL ou clique cego se o plugin consegue ver/clicar/digitar/anexar.
- Antes de iniciar lote, tirar um screenshot/estado da tela e confirmar se esta no app correto.
- Se existir mais de uma aba/janela do WhatsApp, resolver primeiro a janela ativa certa.

## Preparacao Rapida

1. Separar imagens e legendas por categoria.
2. Criar uma tabela curta de destino antes de enviar.
3. Usar whitelist de grupos, nao resultado solto de busca.
4. Preferir filtro `Grupos` no WhatsApp para evitar conversa individual.
5. Se usar busca, validar o cabecalho do chat aberto antes de enviar.

## Whitelist Atual

### Grupos de venda

- `VENDE-SE TUDO EM CZS`
- `VENDAS E ALUGUEL! CZS`
- `R.ALVES E REGIAO VENDAS...`
- `GRUPO DE DESAPEGO`
- `GRUPO VIP DONA...`

Enviar:

- `01-geral-gift-streaming-ia.png`
- legenda de gift cards / servicos digitais
- `05-ti-logistico-czs-remoto-retirada.png`
- legenda do T.I Logistico CZS

### Grupos de Uber/transporte

- `UBER E MOTO UBER EM CZS-AC`
- `UBER CZS`
- `MOTO UBER MANO LIMA`
- `UBER 1 MOTO UBER...CZS`

Enviar:

- `06-motorista-julia-oliveira.png`
- legenda da Julia Oliveira / motorista particular

## Validacao Antes De Enviar

Para cada destino:

1. Abrir o grupo.
2. Conferir nome no cabecalho ou na linha aberta.
3. Conferir se e grupo, nao contato individual.
4. Conferir se a categoria combina.
5. So entao anexar imagem e colar legenda.

Se qualquer ponto falhar: pular destino e registrar no log.

## Ordem De Execucao

1. WhatsApp grupos de venda.
2. WhatsApp grupos de Uber/transporte.
3. Facebook Marketplace, em anuncios separados:
   - servicos digitais/gift cards;
   - T.I Logistico CZS;
   - motorista particular.
4. Avisar o usuario para abrir/autorizar Instagram.
5. Instagram por ultimo.

## Regras De Parada

Parar imediatamente se:

- usuario disser `para`;
- chat aberto for individual sem ordem explicita;
- aparecer tela de login/permissao;
- Facebook/WhatsApp pedir confirmacao sensivel;
- houver risco de postar em grupo errado.

Se o usuario mexer pouco no mouse, continuar. Se houver movimento brusco indicando tomada de controle, parar.

## Registro

Ao terminar:

- salvar screenshot final em `.codex-temp`;
- registrar log de grupos enviados;
- atualizar `orders.json` se a rodada for relevante;
- avisar somente o resumo final, sem narrar cada clique.
