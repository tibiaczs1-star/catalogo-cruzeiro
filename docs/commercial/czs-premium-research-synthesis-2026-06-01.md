# Sintese Da Leitura - CZS Premium

Data base: 2026-06-01

## O Que Foi Lido

Foram processadas 3000 referencias do corpus comercial:

- newspaper_media_kit_report: 1000
- website_sales_report: 1000
- newspaper_landing: 500
- technology_landing: 500

Leitura por modo:

- html_read: 1035
- Structured data already collected from Empire Flippers API: 1000
- blocked_or_missing: 965

Acesso por categoria:

- OK por categoria: {"newspaper_landing":435,"technology_landing":500,"newspaper_media_kit_report":100,"website_sales_report":1000}
- falhas/bloqueios por categoria: {"newspaper_landing":65,"newspaper_media_kit_report":900}
- status HTTP: {"0":65,"200":2026,"202":9,"400":1,"403":123,"404":759,"428":1,"429":13,"503":3}

Observacao importante: uma pagina bloqueada, 404 ou com timeout nao vira referencia visual aprovada. Ela fica registrada como ausencia/falha de caminho. As listagens de venda de websites foram lidas por dado estruturado do coletor, com preco, receita, lucro e multiplo no campo de notas do corpus.

## O Que As 500 Landings De Jornal Ensinam

Padrao dominante:

- jornal bom nao depende de uma hero bonita; depende de hierarquia editorial viva;
- a home precisa responder rapido: o que aconteceu, onde, quando, fonte e o que muda agora;
- paginas de noticia fortes usam densidade organizada, nao vazio decorativo;
- o valor comercial vem de atencao diaria, confianca e habito local;
- tempo, transito, servico, newsletter, mais lidas e ultimas noticias aparecem como infraestrutura de retencao.

Sinais medidos:

- editorial_grid: 1623
- local_identity: 1724
- direct_cta: 1793
- seo: 1657
- media_delivery: 1695

Exemplos lidos:

- NL-0002: Atlanta&#x27;s Leading Local News: Weather, Traffic, Sports and more | Atlanta, Georgia | 11alive.com | News homepage built around editorial hierarchy and latest-story navigation; commercial value comes from daily attention and trust.
- NL-0004: Southeast Texas&#x27;s Leading Local News: Weather, Traffic, Sports and more | Southeast Texas | 12newsnow.com | News homepage built around editorial hierarchy and latest-story navigation; commercial value comes from daily attention and trust.
- NL-0005: Central Georgia&#x27;s Leading Local News: Weather, Traffic, Sports, and more | Macon, Georgia | 13wmaz.com | News homepage built around editorial hierarchy and latest-story navigation; commercial value comes from daily attention and trust.
- NL-0009: 20 Minutes - Toute l’actualité en direct et les dernières infos en continu | News homepage built around editorial hierarchy and latest-story navigation; commercial value comes from daily attention and trust.
- NL-0011: 404 Media | News homepage built around editorial hierarchy and latest-story navigation; commercial value comes from daily attention and trust.
- NL-0003: बाह्रखरी :: Baahrakhari | News homepage built around editorial hierarchy and latest-story navigation; commercial value comes from daily attention and trust.
- NL-0006: Fourteen East &#8211; Chicago&#039;s New Look | News homepage built around editorial hierarchy and latest-story navigation; commercial value comes from daily attention and trust.
- NL-0010: Omaha News, Weather, Sports, and Traffic | KMTV 3 News Now | News homepage built around editorial hierarchy and latest-story navigation; commercial value comes from daily attention and trust.
- NL-0015: 9to5Mac - Apple News & Mac Rumors Breaking All Day | News homepage built around editorial hierarchy and latest-story navigation; commercial value comes from daily attention and trust.
- NL-0013: 6abc Action News - WPVI Philadelphia, Pennsylvania, New Jersey and Delaware News | News homepage built around editorial hierarchy and latest-story navigation; commercial value comes from daily attention and trust.
- NL-0018: Phoenix, Arizona News and Weather | ABC15 Arizona | News homepage built around editorial hierarchy and latest-story navigation; commercial value comes from daily attention and trust.
- NL-0001: 100Reporters | 100Reporters | News homepage built around publisher identity and current coverage; commercial value comes from daily attention and trust.

Aplicacao no CZS:

- A landing precisa abrir com o CZS como painel operacional do Vale do Jurua, nao como flyer de anuncio.
- A prova de jornal deve aparecer como painel de 3 dias, fontes, editorias, velocidade e confianca.
- A venda deve nascer da utilidade local: anunciante compra presenca onde a cidade consulta noticia, servico, catalogo e oportunidade.

## O Que As 500 Landings De Tecnologia Ensinam

Padrao dominante:

- tecnologia madura mostra produto em funcionamento;
- codigo, console, dashboard, fluxo e prova visual valem mais que frases abstratas;
- motion funciona quando explica sistema, nao quando vira enfeite;
- CTA precisa ser simples e repetido depois de prova;
- paginas fortes combinam produto visivel, design limpo, prova social e microinteracoes.

Sinais medidos:

- product_visible: 1862
- cinematic: 1727
- data_visual: 1626
- modern_frontend: 1082
- analytics: 869

Exemplos lidos:

- TL-0002: Make Good - Landing Page Design | Lapa Ninja | Technology/product landing built around visible product proof; conversion depends on direct_cta and seo.
- TL-0001: Polar - Landing Page Design | Lapa Ninja | Technology/product landing built around visible product proof; conversion depends on direct_cta and seo.
- TL-0004: House of Honey - Landing Page Design | Lapa Ninja | Technology/product landing built around visible product proof; conversion depends on direct_cta and seo.
- TL-0003: Idyllic New Plymouth - Landing Page Design | Lapa Ninja | Technology/product landing built around visible product proof; conversion depends on direct_cta and seo.
- TL-0005: Cosmos - Landing Page Design | Lapa Ninja | Technology/product landing built around visible product proof; conversion depends on direct_cta and seo.
- TL-0006: Contra Labs - Landing Page Design | Lapa Ninja | Technology/product landing built around visible product proof; conversion depends on direct_cta and seo.
- TL-0008: Flesh and Bones - Landing Page Design | Lapa Ninja | Technology/product landing built around visible product proof; conversion depends on direct_cta and seo.
- TL-0009: Zach Hamed - Landing Page Design | Lapa Ninja | Technology/product landing built around visible product proof; conversion depends on direct_cta and seo.
- TL-0007: Cofounder - Landing Page Design | Lapa Ninja | Technology/product landing built around visible product proof; conversion depends on direct_cta and seo.
- TL-0010: Zenwood - Landing Page Design | Lapa Ninja | Technology/product landing built around visible product proof; conversion depends on direct_cta and seo.
- TL-0011: Zelt - Landing Page Design | Lapa Ninja | Technology/product landing built around visible product proof; conversion depends on direct_cta and seo.
- TL-0012: Zajno - Landing Page Design | Lapa Ninja | Technology/product landing built around visible product proof; conversion depends on direct_cta and seo.

Aplicacao no CZS:

- Mostrar a maquina: 200 agentes, APIs, captura de noticia, catalogo, PubPaid, distribuicao e SEO em fluxo visual.
- Trocar texto de promessa por demonstracao: terminal, graficos, rede de agentes, painel de status e antes/depois comercial.
- Usar Open Design como direcao de sistema, nao como copia de SaaS estrangeiro.

## O Que Os 1000 Media Kits/Candidatos De Jornal Ensinam

Padrao dominante:

- muitas rotas obvias de media kit falham; isso ensina que a landing comercial do CZS precisa ser facil de achar e indexar;
- media kit bom mostra audiencia, formatos, exemplos, contato e pacote;
- midia local vende contexto, nao apenas impressao;
- patrocinio, newsletter, display, branded content e social precisam virar menu claro;
- sem numeros verificados, a melhor saida e rotular como estimativa, operacao ou prova local.

Sinais medidos:

- media_kit: 1386
- proof: 1292
- pricing: 821
- direct_cta: 1793
- conversion_stack: 130

Exemplos acessiveis/candidatos lidos:

- MK-0008: Friends & Partners | 100Reporters | Advertising/media-kit page candidate; expected to work through audience proof, formats, sponsorship packages and contact flow.
- MK-0009: Advertise With 11Alive WXIA | Atlanta, Georgia | 11alive.com | Advertising/media-kit page candidate; expected to work through audience proof, formats, sponsorship packages and contact flow.
- MK-0007: Friends & Partners | 100Reporters | Advertising/media-kit page candidate; expected to work through audience proof, formats, sponsorship packages and contact flow.
- MK-0025: Advertise With Us | Beaumont, Texas | 12newsnow.com | Advertising/media-kit page candidate; expected to work through audience proof, formats, sponsorship packages and contact flow.
- MK-0033: Advertise with 13WMAZ | Macon, Georgia | 13wmaz.com | Advertising/media-kit page candidate; expected to work through audience proof, formats, sponsorship packages and contact flow.
- MK-0089: 41NBC News | WMGT-DT | Advertising/media-kit page candidate; expected to work through audience proof, formats, sponsorship packages and contact flow.
- MK-0095: Partners in Education hosting P.I.E. Day celebration to support music lessons in Middle Georgia - 41NBC News | WMGT-DT | Advertising/media-kit page candidate; expected to work through audience proof, formats, sponsorship packages and contact flow.
- MK-0096: Partners in Education hosting P.I.E. Day celebration to support music lessons in Middle Georgia - 41NBC News | WMGT-DT | Advertising/media-kit page candidate; expected to work through audience proof, formats, sponsorship packages and contact flow.
- MK-0091: Advertising on WMGT-DT - 41NBC News | WMGT-DT | Advertising/media-kit page candidate; expected to work through audience proof, formats, sponsorship packages and contact flow.
- MK-0105: Advertise With Us | Denver, Colorado | 9news.com | Advertising/media-kit page candidate; expected to work through audience proof, formats, sponsorship packages and contact flow.
- MK-0113: Partner with the 9to5Mac network - 9to5Mac | Advertising/media-kit page candidate; expected to work through audience proof, formats, sponsorship packages and contact flow.
- MK-0119: PARTNERS - 9to5Mac | Advertising/media-kit page candidate; expected to work through audience proof, formats, sponsorship packages and contact flow.

Aplicacao no CZS:

- Criar secoes comerciais com nome claro: Anuncio Local, Pacote Jornal, Pacote Catalogo, PubPaid, Cota Premium, Operacao Completa.
- Cada pacote deve ter: onde aparece, para quem serve, resultado esperado, prova, CTA.
- SEO precisa tornar a pagina encontravel para buscas como anunciar em Cruzeiro do Sul, propaganda no Vale do Jurua, catalogo comercial CZS.

## O Que Os 1000 Relatorios/Listagens De Venda De Websites Ensinam

Padrao dominante:

- site vendavel e apresentado como ativo: receita, lucro, margem, multiplo, risco e oportunidade;
- comprador nao compra beleza; compra maquina que opera e pode crescer;
- risco declarado aumenta confianca quando vem com plano de mitigacao;
- historico, recorrencia e canal de aquisicao valem mais que promessa;
- uma pagina comercial premium precisa parecer due diligence simplificada.

Sinais medidos:

- valuation: 1722
- proof: 1292
- data_visual: 1626
- pricing: 821

Exemplos lidos por dado estruturado:

- WS-0001: $99.7K Per Month Amazon FBA Business in the Home Niche | Website/business sale reference; works by exposing revenue, profit, multiple, risk and opportunity signals for valuation.
- WS-0002: $22.4K Per Month Amazon FBA Business in the Occasions & Gifts Niche | Website/business sale reference; works by exposing revenue, profit, multiple, risk and opportunity signals for valuation.
- WS-0003: $61.6K Per Month Amazon FBA Business in the Apparel & Accessories Niche | Website/business sale reference; works by exposing revenue, profit, multiple, risk and opportunity signals for valuation.
- WS-0004: $30.8K Per Month Amazon FBA Business in the Home Niche | Website/business sale reference; works by exposing revenue, profit, multiple, risk and opportunity signals for valuation.
- WS-0005: $70.5K Per Month eCommerce Business in the Beauty Niche | Website/business sale reference; works by exposing revenue, profit, multiple, risk and opportunity signals for valuation.
- WS-0006: $8.7K Per Month eCommerce Business in the Beauty Niche | Website/business sale reference; works by exposing revenue, profit, multiple, risk and opportunity signals for valuation.
- WS-0007: $3.9K Per Month Display Advertising Site in the Finance Niche | Website/business sale reference; works by exposing revenue, profit, multiple, risk and opportunity signals for valuation.
- WS-0008: $88.5K Per Month Amazon FBA Business in the Pet Care Niche | Website/business sale reference; works by exposing revenue, profit, multiple, risk and opportunity signals for valuation.
- WS-0009: $16.1K Per Month Amazon FBA Business in the Health & Fitness Niche | Website/business sale reference; works by exposing revenue, profit, multiple, risk and opportunity signals for valuation.
- WS-0010: $6.0K Per Month DropShipping Site in the Electronics Niche | Website/business sale reference; works by exposing revenue, profit, multiple, risk and opportunity signals for valuation.
- WS-0011: $53.6K Per Month Amazon FBA Business in the Beauty Niche | Website/business sale reference; works by exposing revenue, profit, multiple, risk and opportunity signals for valuation.
- WS-0012: $2.4K Per Month Display Advertising Site in the Health & Fitness Niche | Website/business sale reference; works by exposing revenue, profit, multiple, risk and opportunity signals for valuation.

Aplicacao no CZS:

- A landing deve ter camada de relatorio: operacao, ativos, tecnologia, audiencia, monetizacao, riscos e proximos 90 dias.
- Onde nao houver dado publico confiavel, usar linguagem de capacidade operacional, nao inflar metrica.
- Os graficos devem explicar motor economico: produto -> distribuicao -> captura -> conversao -> recorrencia.

## Decisao De Design Para A Proxima Landing

O caminho premium nao e "mais brilho" sozinho. O caminho e:

1. Hero como sala de controle regional: CZS operando agora no Vale do Jurua.
2. Painel de 3 dias: noticias, fontes, alertas, catalogo e servicos.
3. Rede de tecnologia: agentes, APIs, captura, SEO, distribuicao, PubPaid.
4. Media kit vivo: produtos comerciais, formatos, exemplos, prova e CTA.
5. Relatorio de ativo: numeros verificaveis, risco, crescimento e cota.
6. Camada cinematografica: motion, parallax, nodes e graficos para explicar fluxo, nao para decorar.

## Regras Para Nao Ficar Amador

- Nada de flyer grande com pouco conteudo.
- Nada de tecnologia contada apenas em frase.
- Nada de grafico sem explicar decisao comercial.
- Nada de metrica sem origem ou rotulo.
- Nada de hero que esconda o produto real.
- Nada de pagina sem CTA comercial claro.
- Nada de SEO generico; o CZS deve ranquear para hiperlocal + anunciar + catalogo + jornal.

## Arquivos De Evidencia

- Corpus: `docs/commercial/research/czs-premium-corpus-2026-06-01.csv`
- Leitura linha a linha: `docs/commercial/research/screening/czs-premium-corpus-screening-2026-06-01.jsonl`
- Sumario tecnico: `docs/commercial/research/screening/czs-premium-corpus-screening-summary-2026-06-01.json`
- Relatorio automatico: `docs/commercial/research/screening/czs-premium-corpus-screening-report-2026-06-01.md`
