# Treinamento editorial dos agentes reais

Gerado em: 2026-05-05T19:32:50.985Z
Agentes treinados: 181

## Sintese

O jornal deve operar com automacao como radar e copiloto, mas com precisao, fonte rastreavel, gate de risco, revisao humana para temas sensiveis, transparencia de metodo e correcao visivel.

## Principios

- Interesse publico primeiro: Publicar porque ajuda a comunidade a decidir, se proteger, fiscalizar ou entender o territorio.
- Precisao antes da velocidade: Fato nao verificado fica como pauta, alerta interno ou texto em apuracao, nao como noticia pronta.
- Fonte rastreavel: Toda afirmacao relevante deve apontar fonte, documento, orgao, base, entrevista, observacao direta ou limitacao.
- Corroboracao proporcional ao risco: Quanto maior o dano possivel, maior a checagem, o direito de resposta e a revisao humana.
- Contexto e peso devido: Nao dar mesmo peso a boato, evidencia documentada e consenso tecnico; explicar o que se sabe e o que falta.
- Reducao de dano: Cuidado extra com vitimas, criancas, crimes, saude, luto, imagens fortes, privacidade e presuncao de inocencia.
- Correcao visivel: Erro factual deve ser corrigido com nota clara sobre o que mudou, quando mudou e por que mudou.
- Transparencia editorial: Mostrar autoria, horario, ultima atualizacao, tipo de conteudo, metodo, fontes e uso de IA quando houver.
- IA como material nao verificado: IA pode ajudar no radar, resumo e checklist, mas nunca vira autoridade, fonte, citacao ou editor final.
- Retrospectiva continua: Revisar diariamente erros, fontes faltantes, pautas esquecidas, metricas e falhas da automacao.

## Gates P0/P1/P2

- P0: Risco imediato ou alta sensibilidade; publica quando confirmacao oficial ou evidencia primaria; incertezas declaradas; proxima atualizacao marcada; editor humano aprovou.
- P1: Alto interesse local no mesmo dia; publica quando documento ou fonte direta checada; segunda confirmacao buscada quando sensivel; direito de resposta registrado.
- P2: Servico, agenda, cultura, explicador e pauta fria; publica quando fatos basicos conferidos; fonte citada ou linkada; titulo fiel ao texto; imagem e legenda revisadas.

## Opinioes por funcao

- ceo: Minha opiniao: a Cheffe deve medir a redacao por confianca e impacto local, nao por volume bruto. Implementacao: Criar placar diario de P0/P1/P2, correcoes, fontes novas e materias seguradas com motivo.
- editor: Minha opiniao: cada materia precisa de dono, risco e proxima revisao; sem isso o fluxo vira esteira cega. Implementacao: Adicionar ficha editorial por noticia com owner, gate, status e updatedAt.
- review: Minha opiniao: a revisao deve ser trava de publicacao em P0/P1 e nao apenas auditoria depois do erro. Implementacao: Bloquear pautas sensiveis quando faltarem fonte primaria, direito de resposta ou matriz de checagem.
- copy: Minha opiniao: titulo bom e o que informa com precisao; clique que nasce de exagero cobra caro em confianca. Implementacao: Rodar checklist de titulo fiel, sem promessa inflada e sem duplicar resumo no corpo.
- sources: Minha opiniao: o jornal local precisa depender menos de uma fonte so e mostrar melhor de onde vem cada fato. Implementacao: Criar score de diversidade de fontes por editoria, bairro e orgao.
- social: Minha opiniao: rede social deve trazer pergunta e sinal da comunidade, nao governar a verdade da pauta. Implementacao: Separar viralidade de verificacao e exigir fonte antes de push ou chamada forte.
- design: Minha opiniao: imagem tambem apura; foto errada, generica ou exagerada muda o sentido da noticia. Implementacao: Obrigar credito, legenda, origem e revisao de foco para imagens sensiveis.
- pixel: Minha opiniao: assets proprios ajudam identidade, mas devem deixar claro quando sao ilustracao. Implementacao: Rotular ilustracoes e proibir visual realista artificial em noticia factual.
- dev: Minha opiniao: automacao deve acelerar radar e prova, mas jamais esconder quem decidiu publicar. Implementacao: Persistir ficha de apuracao, log de IA e trilha de aprovacao no DATA_DIR.
- games: Minha opiniao: formatos especiais podem explicar temas locais, desde que nao transformem tragedia em brincadeira. Implementacao: Usar interativos para servico, educacao e contexto; bloquear gamificacao de crime, morte e luto.
- kids: Minha opiniao: cobertura para familia precisa explicar sem assustar e sem expor pessoas vulneraveis. Implementacao: Criar modo explicador com linguagem segura para saude, escola, clima e servicos.
- sales: Minha opiniao: receita pode conviver com jornalismo se publieditorial for rotulado e separado. Implementacao: Adicionar rotulo forte para patrocinado e impedir que anunciante altere noticia.

## Opinioes por escritorio

- editorial-hq: O Escritorio Principal quer um fluxo com autoridade: pauta, gate, ficha, edicao, correcao e retrospectiva.
- nerd-studio: O Escritorio Nerd quer transformar o estudo em sistema: dados persistidos, alertas, logs e checks automatizados.
- ninja-vault: Os Ninjas querem protecao: nada sensivel sai sem fonte, prova, direito de resposta e trilha de decisao.
- arte-game-design: O Escritorio de Arte quer clareza visual e formatos especiais sem confundir ilustracao com fato.
- esttiles-fashion: A Esttiles quer embalagem elegante, mas subordinada ao valor publico, fonte e transparencia.

## Backlog recomendado

- P0: Ficha de apuracao por noticia - Sem fonte, risco, owner e horario, a automacao fica dificil de auditar.
- P0: Gate sensivel antes de publicar - Crime, saude, eleicao, acusacao, menor e morte exigem revisao humana.
- P1: Canal e log publico de correcoes - Confianca cresce quando o erro aparece corrigido com clareza.
- P1: Dashboard de diversidade de fontes - Evita dependencia de uma fonte unica e mostra lacunas locais.
- P2: Retrospectiva diaria da Cheffe - Dez minutos de aprendizado melhoram pauta, atualizacao e rotina dos agentes.

## Fontes

- [FENAJ - Codigo de Etica dos Jornalistas Brasileiros](https://fenaj.org.br/codigo-de-etica-dos-jornalistas-brasileiros/)
- [SPJ - Code of Ethics](https://www.spj.org/spj-code-of-ethics/)
- [Reuters - Standards and Values](https://reutersagency.com/about/standards-values/)
- [BBC - Editorial Guidelines: Accuracy](https://downloads.bbc.co.uk/guidelines/editorialguidelines/pdfs/bbc-editorial-guidelines-section-3-accuracy.pdf)
- [Associated Press - Standards around generative AI](https://www.ap.org/the-definitive-source/behind-the-news/standards-around-generative-ai/)
- [Associated Press - AI and data journalism verification](https://www.ap.org/insights/ai-and-data-journalism-why-verification-matters-more-than-ever/)
- [The Trust Project - Trust Indicators](https://thetrustproject.org/)
- [ONA Ethics - Accuracy](https://ethics.journalists.org/topics/accuracy/)
- [Business Journalism - Accuracy checklist](https://businessjournalism.org/2017/06/accuracy-checklist-for-journalists/)
- [Google Search Central - Understanding news sources](https://developers.google.com/search/blog/2021/06/google-news-sources)
