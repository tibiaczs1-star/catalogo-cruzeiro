# Prompt Cheffe Call - Reuniaozinha Mobile Only

Voce esta na Cheffe Call sob comando direto do Codex Chefe.

Ordem principal: reunir todos os 181 agentes reais para uma rodada exclusivamente voltada ao mobile do Catalogo Cruzeiro do Sul.

Regra soberana: nao mexer no webdesktop. Toda decisao, sugestao, ajuste, teste e implementacao deve ser isolada por mobile, preferencialmente usando media queries, classes mobile ja existentes, logica condicional por viewport ou arquivos mobile dedicados. Se uma mudanca puder alterar desktop, ela nao entra sem revisao separada.

## Objetivo da reuniao

Deixar a experiencia mobile mais clara, rapida, legivel e funcional, sem quebrar a home desktop nem mudar a hierarquia visual aprovada para telas grandes.

## Escopo permitido

- Mobile pequeno: 360-390 px de largura.
- Mobile medio: 414-430 px de largura.
- Mobile alto: 844-932 px de altura.
- Tablets estreitos somente quando o CSS ja cair no mesmo comportamento mobile.
- Home mobile, menu, hero, cards, radar, arquivo, noticias internas, entretenimento, social, sidebar convertida em fluxo, botoes, formularios e modais.
- Performance percebida no celular: carregamento, overflow, texto estourado, clique dificil, imagem pesada, layout pulando.

## Escopo proibido

- Alterar desktop acima de 900 px.
- Reorganizar a home desktop.
- Trocar paleta global do site.
- Refatorar componentes que funcionam no desktop sem isolamento mobile.
- Mexer em PubPaid, jogo, Phaser, sprites ou HUD.
- Subir dados de visita, heartbeat ou logs operacionais como se fossem melhoria visual.

## Regras da fala dos agentes

1. Agente so levanta a mao se tiver evidencia mobile concreta.
2. Toda fala deve citar viewport, pagina, componente e risco.
3. Opiniao generica nao entra na fila.
4. Cada agente deve dizer:
   - o que viu no mobile;
   - onde viu;
   - por que prejudica usuario real;
   - qual correcao mobile-only recomenda;
   - como provar que nao afetou desktop.
5. Se a sugestao tocar desktop, o agente deve marcar como bloqueada.

## Times convocados

### Time 1 - Leitura e hierarquia
- Verificar se titulos, resumos, datas, fontes e botoes cabem em 360 px.
- Cortar texto excessivo apenas no mobile.
- Confirmar se hero mobile mostra noticia real sem sobrepor texto/imagem.
- Priorizar leitura de scan: primeiro titulo, depois fonte, depois resumo.

### Time 2 - Layout e overflow
- Procurar scroll horizontal.
- Procurar cards maiores que a tela.
- Procurar botoes fora do container.
- Procurar imagem cobrindo texto.
- Procurar cards dentro de cards no mobile.
- Confirmar espaçamento entre secoes.

### Time 3 - Navegacao e toque
- Verificar menu, anchors, botoes, cards clicaveis, formulários e modais.
- Garantir alvos de toque confortaveis.
- Evitar botao pequeno demais ou encostado em outro.
- Confirmar que card clicavel nao impede link interno.

### Time 4 - Imagens e midia mobile
- Checar foco de imagem em cards e hero.
- Verificar se fotos de pessoas cortam rosto.
- Verificar se fallback SVG aparece bem em mobile.
- Apontar imagens repetidas visiveis no mesmo bloco mobile.
- Nao trocar imagem por gosto; so por bug, repeticao ou corte ruim.

### Time 5 - Performance e estabilidade
- Checar scripts que atrasam o primeiro conteudo mobile.
- Verificar se splash, loaders ou animacoes travam leitura.
- Apontar elementos que causam layout shift.
- Sugerir lazy/condicional apenas para mobile quando possivel.

### Time 6 - QA e prova
- Validar em 390x844 e 430x932.
- Comparar com desktop 1365x768 ou 1440x900 para provar que nao mudou.
- Registrar antes/depois quando houver ajuste.
- Rodar checagens de sintaxe e auditorias existentes quando tocar JS/CSS/dados.

## Fila de execucao esperada

1. Capturar estado mobile atual.
2. Listar bugs reais por prioridade.
3. Classificar cada bug:
   - P0: impede uso.
   - P1: quebra leitura ou clique.
   - P2: visual ruim, mas utilizavel.
   - P3: refinamento.
4. Executar somente P0/P1/P2 que forem mobile-only.
5. Rodar QA mobile.
6. Rodar QA desktop para garantir que nada mudou.
7. Gerar relatorio final com:
   - o que foi corrigido;
   - arquivos tocados;
   - viewports testados;
   - riscos restantes;
   - prova de que desktop ficou preservado.

## Prompt de comando para execucao

Codex Chefe para todos os agentes:

"Reuniao mobile-only aberta. Voces devem revisar o Catalogo Cruzeiro do Sul como usuarios de celular. Procurem bugs reais de leitura, toque, overflow, imagem, menu, cards, modais, performance e fluxo. Nao proponham nada que altere desktop. Cada sugestao deve vir com pagina, componente, viewport, evidencia, correcao mobile-only e prova de nao regressao desktop. Ideias vagas ficam fora da fila. Primeiro levantem os problemas; depois o Codex Chefe decide o que implementar."

## Criterio de pronto

A rodada so termina quando:

- Nao houver scroll horizontal mobile.
- Textos principais couberem sem sobrepor outros blocos.
- Cards importantes forem clicaveis por toque.
- Imagens nao cortarem informacao essencial.
- Home mobile continuar leve e legivel.
- Desktop for conferido e permanecer igual no comportamento principal.
