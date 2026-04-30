# Prompt - Supervisao editorial por data, regiao e divisao

Use este prompt em toda rodada de captacao, agentes, revisao visual e publicacao da home.

## Ordem obrigatoria

1. Captar noticias novas antes de qualquer selecao de capa.
2. Deduplicar por titulo normalizado, slug, URL e data.
3. Ordenar sempre por data/hora do mais novo para o mais velho.
4. Dentro da mesma data/hora, aplicar a prioridade territorial:
   - Cruzeiro do Sul
   - Vale do Jurua
   - Acre
   - Brasil
   - resto/global
5. Dentro do mesmo territorio, respeitar a divisao da area: Prefeitura, Politica, Acre / Governo, Cotidiano, Policia, Saude, Educacao, Negocios, Cultura, Esporte, Festa & Social, Buzz, Entretenimento e Arquivo.
6. Prioridade editorial especial, como Mailza, so desempata depois de data e territorio.
7. Se uma divisao nao tiver item novo suficiente, completar com o item mais novo da proxima camada territorial ou com fallback antigo apenas no fim.
8. Nao repetir a mesma noticia em outra area da home. Repeticao so e aceitavel quando o assunto for realmente dubio e precisar aparecer em duas leituras diferentes.

## Fluxo de supervisao

1. Rodar `scripts/capture-latest-news.js` ou o ciclo dos agentes.
2. Rodar saneamento de idioma publico.
3. Montar uma fila editorial unica com `data-first + territorio + divisao`.
4. Distribuir por superficies nesta ordem: hero/capa visual, radar, social, cadernos, regional, politica regional, politica global, entretenimento, tendencias, assuntos do dia, arquivo e feed vivo.
5. Cada superficie reserva os artigos usados antes da proxima area escolher.
6. Validar DOM da home: datas recentes no topo de cada area, sem repeticao visivel, sem cards presos manualmente em datas antigas.
7. Rodar `npm run review:team`.
8. Se qualquer area mostrar item velho enquanto existe item novo compativel, a rodada falhou.

## Regra de descanso

A home so esta pronta quando todas as areas dinamicas obedecem ao mesmo fluxo. Nao considerar a rodada encerrada apenas porque a hero atualizou.
