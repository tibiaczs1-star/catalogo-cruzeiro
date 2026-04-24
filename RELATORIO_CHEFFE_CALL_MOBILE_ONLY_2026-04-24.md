# Relatorio Cheffe Call - Mobile Only

Data: 2026-04-24
Comando: reuniao mobile-only com Codex como Chefe

## Status da reuniao

- Cheffe Call aberta com o prompt `PROMPT_CHEFFE_CALL_MOBILE_ONLY_2026-04-24.md`.
- 181 agentes reais acionados.
- 5 escritorios presentes.
- 181 agentes vivos/ativos.
- 36 acoes geradas pelo runtime.
- Decisao do Chefe: cortar respostas genericas que nao trouxeram evidencia mobile concreta.

## Regra soberana confirmada

Nenhuma correcao mobile pode alterar o webdesktop. Toda acao aprovada deve ser isolada por:

- media query mobile;
- classe mobile existente;
- condicional por viewport;
- arquivo mobile dedicado;
- ou ajuste que tenha prova de nao regressao em 1440x900.

## Evidencias coletadas pelo Chefe

### Viewport 390x844

- URL testada: `http://127.0.0.1:3000/index.html?v=mobile-meeting-1`
- `scrollWidth`: 390
- `clientWidth`: 390
- Scroll horizontal real da pagina: nao.
- Pontos observados:
  - chips do radar passam para fora da viewport, mas dentro de trilho horizontal esperado;
  - cards de entretenimento aparecem com conteudo muito largo no calculo interno em 390 px;
  - bloco de entretenimento fica muito profundo e denso no mobile;
  - cards de teatro/cultura mostram textos longos demais para scan rapido.

Captura: `.codex-temp/mobile-meeting-entertainment-390.png`

### Viewport 430x932

- `scrollWidth`: 430
- `clientWidth`: 430
- Scroll horizontal real da pagina: nao.
- Pontos observados:
  - cards fundadores aparecem deslocados fora da viewport, provavelmente por carrossel/faixa horizontal;
  - elementos decorativos `catalogo-sky-glow` entram fora da viewport, sem gerar scroll real;
  - entretenimento ainda mistura terceiro card antigo/fallback em filmes;
  - teatro/cultura ainda aceita materia muito antiga e pouco local.

### Desktop 1440x900

- `scrollWidth`: 1440
- `clientWidth`: 1440
- Scroll horizontal: nao.
- Hero e entretenimento renderizam sem overflow global.
- Desktop fica como baseline de nao regressao.

## Fila aprovada pelo Chefe

### P1 - Entretenimento mobile denso e pouco escaneavel

Evidencia:
- Em 390x844 e 430x932, os cards de entretenimento ficam muito longos.
- Titulos de teatro/cultura ocupam muitas linhas e atrasam a leitura.

Acao aprovada:
- Mobile-only: limitar altura/resumo dos cards de entretenimento.
- No mobile, mostrar titulo, fonte curta, imagem e CTA; resumo longo deve ser cortado.
- Nao alterar layout desktop dos cards.

Prova exigida:
- Screenshot 390x844 antes/depois.
- Desktop 1440x900 sem diferenca estrutural.

### P1 - Filtro de entretenimento precisa ser mais estrito no mobile

Evidencia:
- A reuniao encontrou `Ingressos para Campanha de Popularizacao Teatro e Danca de Juiz de Fora...` em destaque mobile.
- Conteudo e antigo e pouco conectado ao leitor local.
- Terceiro card de filme pode cair em fallback antigo quando faltam filmes reais.

Acao aprovada:
- Mobile-only ou logica de selecao segura: priorizar cultura local/Acre/Jurua e conteudo atual.
- Se nao houver terceiro filme real, mostrar card fixo "Em acompanhamento" em vez de puxar noticia fraca.
- Para teatro/cultura, priorizar data recente e fonte atual.

Prova exigida:
- Lista de titulos renderizados em 390x844 e 430x932.
- Garantir que desktop nao perde os cards atuais.

### P2 - Chips do radar precisam comunicar rolagem horizontal

Evidencia:
- Em 390x844, chips como Policia, Saude, Educacao e outros ficam fora da viewport, mas nao criam scroll horizontal global.
- E comportamento de trilho, porem pode parecer conteudo cortado.

Acao aprovada:
- Mobile-only: adicionar affordance visual de trilho horizontal, espacamento final e snap suave.
- Nao quebrar desktop.

Prova exigida:
- `document.documentElement.scrollWidth === clientWidth` em 390 e 430.
- Teste de toque/rolagem no trilho.

### P2 - Faixa de fundadores precisa ser revisada no mobile

Evidencia:
- Em 430x932, cards fundadores aparecem com `left` 390 e 700, fora da viewport.
- Nao gerou scroll global, mas pode indicar carrossel/strip sem sinal claro.

Acao aprovada:
- Mobile-only: confirmar se e carrossel intencional.
- Se for, adicionar pista visual e padding; se nao for, empilhar cards no mobile.

Prova exigida:
- Captura do bloco fundadores em 390/430.
- Desktop preservado.

### P2 - Elementos decorativos fora da viewport

Evidencia:
- `catalogo-sky-glow glow-b/glow-c` aparecem parcialmente fora da viewport em 430.
- Nao criam scroll real, mas podem gerar custo visual/performance.

Acao aprovada:
- Mobile-only: reduzir, esconder ou reposicionar decoracoes fora da viewport.
- Nao alterar hero desktop.

Prova exigida:
- Captura mobile e medicao de overflow.

## Bloqueios

- Qualquer proposta de reorganizar desktop esta bloqueada.
- Qualquer proposta de mexer em PubPaid esta bloqueada.
- Qualquer proposta baseada em gosto visual sem evidencia mobile esta bloqueada.
- Acoes geradas pelo runtime com foco generico em noticias/editorial foram recusadas para esta rodada.

## Proxima ordem recomendada

Executar apenas as correcoes P1 e P2 acima, em branch/commit separado, com QA:

- 390x844
- 430x932
- 1440x900

Comando do Chefe:

"Implementar a fila mobile-only aprovada. Nao tocar desktop. Nao tocar PubPaid. Cada alteracao precisa ter prova em 390x844, 430x932 e 1440x900."
