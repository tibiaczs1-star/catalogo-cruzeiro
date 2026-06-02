# Protocolo De Automacao De Propagandas

Atualizado: 2026-05-21

Objetivo: fazer postagens comerciais rapido, com menos token/clique e sem enviar no destino errado.

## Regra Principal

Antes de postar, montar a rota:

| Canal | Destino | O que enviar |
| --- | --- | --- |
| WhatsApp | Grupos de venda | Somente venda, servico, produto, classificado, oferta comercial ou pedido de links de grupos |
| WhatsApp | Grupos de Uber/transporte | Apenas motorista particular / Julia Oliveira |
| WhatsApp | Grupos/canais de noticia | Somente noticia, enquete editorial, atualizacao publica e chamada do jornal |
| WhatsApp | Catálogo CZS | Noticias, enquete, avisos editoriais e chamadas do jornal |
| Facebook | Marketplace | Tudo, mas em anuncios separados |
| Instagram | Feed/stories/reels | Somente no final, quando o usuario mandar abrir |

Nunca enviar propaganda em conversa individual, salvo ordem explicita com numero/nome.

## Regra Dura De Separacao

- Grupo de venda e grupo de vendas sao a mesma coisa: nao recebem noticia.
- Grupo geral/de venda so recebe noticia se o usuario disser explicitamente que aquele grupo tambem aceita noticias.
- Noticia, politica, enquete, alerta publico e jornalismo ficam apenas em grupo/canal de noticia confirmado.
- Hoje o unico destino de noticia confirmado no WhatsApp e `Catálogo CZS`.
- Se o destino tiver `VENDE`, `VENDAS`, `ALUGUEL`, `DESAPEGO`, `CLASSIFICADOS`, `COMPRA`, `TROCA`, `POSTAR QUE VENDE` ou similar no nome, tratar como grupo de vendas.
- Se houver duvida sobre o tipo do grupo: nao postar; pedir/registrar classificacao primeiro.
- Nunca usar grupo de vendas para testar alcance de noticia.
- Antes de qualquer lote, separar a fila em: `vendas_servicos`, `noticias_editorial`, `pedir_links`, `status_proprio`, `pendente_classificacao`.

## Pedido Para Encontrar Novos Grupos

Quando a ordem for procurar mais grupos, postar apenas uma mensagem de pedido de links, sem noticia anexada:

```text
Pessoal, quem puder ajudar, manda aqui links de grupos ativos de vendas/classificados de Cruzeiro do Sul, Vale do Jurua e Acre.

Tambem estamos procurando grupos/canais de noticias locais para acompanhar o que acontece na regiao.

Se souber de algum, envie o link ou nome do grupo. Obrigado!
```

Versao curta para grupos gerais:

```text
Alguem tem links de grupos de vendas ou grupos/canais de noticias de Cruzeiro do Sul, Vale do Jurua e Acre? Pode mandar aqui ou no privado.
```

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

- produtos reais;
- servicos digitais;
- gift cards / streaming / IA sob consulta;
- T.I Logistico CZS;
- pedido de links para novos grupos;
- nunca noticia, enquete, politica ou editorial.

### Grupos/canais de noticia

- `Catálogo CZS`

Enviar:

- noticias;
- stories/editorial;
- enquete editorial;
- chamada do jornal;
- pedidos de links para outros grupos/canais de noticia.

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
4. Classificar o destino: venda, noticia, transporte, geral, proprio ou desconhecido.
5. Conferir se a categoria do conteudo combina com o destino.
6. Se for grupo de venda, bloquear automaticamente noticia/enquete/politica/editorial.
7. So entao anexar imagem e colar legenda.

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
