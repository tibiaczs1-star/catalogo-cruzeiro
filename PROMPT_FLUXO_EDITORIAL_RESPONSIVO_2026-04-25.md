# Prompt de Fluxo Editorial e Responsividade

Data: 25 de abril de 2026

## Ordem editorial

Organize a home como uma fila de reserva editorial, sem repetir a mesma noticia entre superficies.

1. Hero: abre com os fatos mais fortes do dia, foto real e impacto imediato.
2. Destaques: complementam a Hero com assuntos fortes que ficaram fora da abertura.
3. Arquivo de Abril / mes: mostra contexto, recorrencia e materias importantes do periodo sem repetir Hero nem Destaques.
4. Noticias do dia: lista o restante que nao foi promovido, em ordem de atualidade e relevancia.

## Reserva anti-repeticao

- Quando uma materia entra na Hero, reservar `slug`, `sourceUrl`, titulo normalizado, imagem e pauta central.
- Destaques nao podem usar materia, foto ou pauta ja reservada pela Hero.
- Arquivo do mes nao pode usar materia, foto ou pauta ja reservada por Hero ou Destaques.
- Noticias do dia nao devem promover como card forte o que ja apareceu acima; se precisar voltar ao tema, usar link discreto de continuidade.
- Republicacao por fontes diferentes conta como repeticao quando o personagem, acontecimento, data e resumo contam o mesmo fato.

## Regras de diversidade

- Nao colocar duas materias seguidas da mesma editoria se houver alternativa boa.
- Evitar dominio unico em uma vitrine; misturar fonte local, fonte oficial, portal regional e producao autoral quando possivel.
- No bloco visivel, limitar fonte, categoria, imagem e pauta central antes de preencher sobras por recencia.
- Mailza/Mailsa continua como prioridade editorial, mas nao deve ocupar todas as superficies ao mesmo tempo.
- Cards da home usam resumo curto; a leitura completa fica na pagina da materia.

## Responsividade de cards com foto

Todo card com imagem precisa respeitar proporcao, nao apenas largura.

- TV / desktop muito largo: centralizar cards e limitar largura para nao virar outdoor horizontal.
- Desktop confortavel: 2 ou 3 colunas somente se cada card mantiver largura minima real.
- Desktop estreito com trilhos laterais: cair para 1 coluna quando a foto comecar a ficar espremida.
- Tablet: usar `auto-fit` com minimo seguro de card.
- Mobile: 1 coluna, foto 4:3 ou proporcao equivalente que preserve pessoas e grupos.

## Regra final

A home deve parecer uma edicao jornalistica: Hero abre, Destaques ampliam, Abril explica o mes, e o feed do dia entrega o restante sem competir com o que ja foi promovido.
