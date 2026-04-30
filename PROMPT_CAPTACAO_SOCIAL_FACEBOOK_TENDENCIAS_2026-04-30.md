# Prompt - Captacao Social, Facebook e Tendencias Reais

Data: 2026-04-30

Objetivo: corrigir a home para que `Tendencias & Conversas` use sinais sociais reais quando existirem e degrade com honestidade quando a captacao social estiver indisponivel.

## Ordem operacional

1. Captar sinais publicos externos de X/Twitter, Instagram e Facebook.
2. Facebook deve usar apenas origem publica e configurada:
   - `FACEBOOK_GRAPH_ACCESS_TOKEN`
   - `FACEBOOK_PUBLIC_PAGE_IDS`
3. Se Facebook, Instagram ou X falharem, registrar o status como indisponivel/stale/offline e nao inventar escuta.
4. Noticia comum de RSS nao pode virar `Instagram`, `TikTok`, `Facebook` ou `X/Twitter` por rotacao visual.
5. Quando nao houver prova social publica, o card deve dizer `radar editorial`, `sem escuta social confirmada` ou equivalente.
6. Opiniao de agente deve explicar o que importa: fonte, impacto, divisao editorial, publico afetado e o que falta confirmar.
7. Tarefas internas dos agentes, como "identificar rotinas manuais", nunca devem aparecer como card publico de noticia.

## Divisoes de importancia

- Politica: governo, prefeitura, camara, Aleac, eleicao, autoridades e decisoes publicas.
- Utilidade Publica: saude, educacao, transito, obra, chuva, alerta, servico, calendario e atendimento.
- Cultura: musica, livro, leitura, show, teatro, festa, evento e artistas.
- Economia: preco, comercio, negocios, empreendedorismo, Pix, mercado e consumo.
- Esporte: jogo, time, campeonato, atleta e resultado.
- Acre / Governo: Acre, Jurua, Cruzeiro do Sul, Rio Branco e Amazonia quando o assunto for regional.
- Cotidiano: demais assuntos com potencial publico, sem forcar tendencia.

## Regra de ouro

Online nao significa automaticamente certo. Online so significa que existe dado fresco para avaliar. O card so esta certo quando mostra origem, data/status, divisao, sinal social confirmado quando houver, e deixa claro quando ainda e apenas radar editorial.
