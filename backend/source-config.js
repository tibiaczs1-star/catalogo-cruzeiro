module.exports = [
  {
    id: "ac24horas",
    name: "ac24horas",
    feedUrl: "https://ac24horas.com/feed/",
    siteUrl: "https://ac24horas.com/",
    defaultCategory: "Cotidiano",
    limitPerSource: 30
  },
  {
    id: "contilnet-instagram",
    name: "ContilNet / Instagram",
    feedUrl: "https://contilnetnoticias.com.br/",
    feedType: "official-home-headlines",
    siteUrl: "https://contilnetnoticias.com.br/",
    instagramHandle: "@contilnetnoticias",
    instagramUrl: "https://www.instagram.com/contilnetnoticias/",
    defaultCategory: "Cotidiano",
    limitPerSource: 35,
    priority: 970,
    priorityReason: "Fonte acreana solicitada pelo usuario; monitorar chamadas publicas do portal e atribuir o canal @contilnetnoticias quando a materia trouxer o post incorporado.",
    linkAllowPattern: "contilnetnoticias\\.com\\.br/(?:destaque|destaque-2|noticia|politica|policia|acre|brasil)/"
  },
  {
    id: "jurua-online",
    name: "Jurua Online",
    feedUrl: "https://juruaonline.com.br/wp-json/wp/v2/posts?per_page=24&_embed=1",
    feedType: "wordpress-json",
    siteUrl: "https://juruaonline.com.br/",
    defaultCategory: "Cotidiano",
    limitPerSource: 45,
    priority: 980,
    priorityReason: "Fonte regional prioritaria do Vale do Jurua; usar REST do WordPress quando RSS redirecionar para HTML."
  },
  {
    id: "jurua-em-tempo",
    name: "Jurua em Tempo",
    feedUrl: "https://www.juruaemtempo.com.br/wp-json/wp/v2/posts?per_page=24&_embed=1",
    feedType: "wordpress-json",
    siteUrl: "https://www.juruaemtempo.com.br/",
    defaultCategory: "Cotidiano",
    limitPerSource: 45,
    priority: 975,
    priorityReason: "Fonte regional do Vale do Jurua com WordPress REST ativo; amplia cobertura local de CZS, Mancio Lima, Rodrigues Alves e entorno."
  },
  {
    id: "agencia-acre",
    name: "Agencia Acre",
    feedUrl: "https://agencia.ac.gov.br/feed/",
    siteUrl: "https://agencia.ac.gov.br/",
    defaultCategory: "Prefeitura",
    limitPerSource: 25
  },
  {
    id: "prefeitura-czs",
    name: "Prefeitura de CZS",
    feedUrl: "https://www.cruzeirodosul.ac.gov.br/",
    feedType: "prefeitura-wix-home",
    siteUrl: "https://www.cruzeirodosul.ac.gov.br/",
    defaultCategory: "Utilidade Publica",
    limitPerSource: 60,
    priority: 1000,
    priorityReason: "Fonte oficial municipal prioritaria; site Wix sem RSS confiavel, capturar cards publicos da home.",
    linkAllowPattern: "cruzeirodosul\\.ac\\.gov\\.br/publicacoes-transparencia/"
  },
  {
    id: "prefeitura-mancio-lima",
    name: "Prefeitura de Mancio Lima",
    feedUrl: "https://www.manciolima.ac.gov.br/",
    feedType: "prefeitura-wix-home",
    siteUrl: "https://www.manciolima.ac.gov.br/",
    defaultCategory: "Utilidade Publica",
    limitPerSource: 20,
    priority: 955,
    priorityReason: "Fonte oficial municipal do Vale do Jurua; captura home Wix para ampliar cobertura hiperlocal.",
    linkAllowPattern: "manciolima\\.ac\\.gov\\.br/publicacoes-transparencia/"
  },
  {
    id: "prefeitura-rodrigues-alves",
    name: "Prefeitura de Rodrigues Alves",
    feedUrl: "https://www.rodriguesalves.ac.gov.br/",
    feedType: "prefeitura-wix-home",
    siteUrl: "https://www.rodriguesalves.ac.gov.br/",
    defaultCategory: "Utilidade Publica",
    limitPerSource: 20,
    priority: 950,
    priorityReason: "Fonte oficial municipal vizinha de CZS; importante para pauta de Rodrigues Alves sem depender de grupo de vendas.",
    linkAllowPattern: "rodriguesalves\\.ac\\.gov\\.br/publicacoes-transparencia/"
  },
  {
    id: "prefeitura-porto-walter",
    name: "Prefeitura de Porto Walter",
    feedUrl: "https://www.portowalter.ac.gov.br/",
    feedType: "prefeitura-wix-home",
    siteUrl: "https://www.portowalter.ac.gov.br/",
    defaultCategory: "Utilidade Publica",
    limitPerSource: 20,
    priority: 945,
    priorityReason: "Fonte oficial municipal do Jurua; reforca cobertura regional e utilidade publica.",
    linkAllowPattern: "portowalter\\.ac\\.gov\\.br/publicacoes-transparencia/"
  },
  {
    id: "prefeitura-marechal-thaumaturgo",
    name: "Prefeitura de Marechal Thaumaturgo",
    feedUrl: "https://www.marechalthaumaturgo.ac.gov.br/",
    feedType: "prefeitura-wix-home",
    siteUrl: "https://www.marechalthaumaturgo.ac.gov.br/",
    defaultCategory: "Utilidade Publica",
    limitPerSource: 20,
    priority: 940,
    priorityReason: "Fonte oficial municipal do Jurua; reforca cobertura de interior e servicos publicos.",
    linkAllowPattern: "marechalthaumaturgo\\.ac\\.gov\\.br/publicacoes-transparencia/"
  },
  {
    id: "pcac",
    name: "Policia Civil do Acre",
    feedUrl: "https://pc.ac.gov.br/feed/",
    siteUrl: "https://pc.ac.gov.br/",
    defaultCategory: "Policia",
    limitPerSource: 20,
    priority: 910,
    priorityReason: "Fonte oficial de seguranca publica do Acre com RSS ativo; priorizar quando houver impacto no Jurua."
  },
  {
    id: "detran-acre",
    name: "Detran Acre",
    feedUrl: "https://www.detran.ac.gov.br/feed/",
    siteUrl: "https://www.detran.ac.gov.br/",
    defaultCategory: "Utilidade Publica",
    limitPerSource: 15,
    priority: 875,
    priorityReason: "Fonte oficial de transito do Acre com RSS ativo; boa para servico, alerta, CNH e fiscalizacao."
  },
  {
    id: "mpac",
    name: "Ministerio Publico do Acre",
    feedUrl: "https://www.mpac.mp.br/",
    feedType: "official-home-headlines",
    siteUrl: "https://www.mpac.mp.br/",
    defaultCategory: "Utilidade Publica",
    limitPerSource: 12,
    priority: 870,
    priorityReason: "Fonte oficial sem RSS confiavel; captura manchetes publicas da home para pauta institucional e protecao social.",
    linkAllowPattern: "mpac\\.mp\\.br/(?:[^\"'#]+/)?(?:mpac|a-pedido|noticias|2026|\\d{4})"
  },
  {
    id: "tjac",
    name: "Tribunal de Justica do Acre",
    feedUrl: "https://www.tjac.jus.br/noticias/",
    feedType: "official-home-headlines",
    siteUrl: "https://www.tjac.jus.br/",
    defaultCategory: "Utilidade Publica",
    limitPerSource: 12,
    priority: 860,
    priorityReason: "Fonte oficial do Judiciario acreano; usar para servico publico e decisoes com impacto regional.",
    linkAllowPattern: "tjac\\.jus\\.br/(?:noticias|.*\\d{4})"
  },
  {
    id: "jurua-24-horas",
    name: "Jurua 24 Horas",
    feedUrl: "https://jurua24horas.com/feed/",
    siteUrl: "https://jurua24horas.com/",
    defaultCategory: "Cotidiano",
    limitPerSource: 45
  },
  {
    id: "jurua-comunicacao",
    name: "Jurua Comunicacao",
    feedUrl: "https://juruacomunicacao.com.br/feed/",
    siteUrl: "https://juruacomunicacao.com.br/",
    defaultCategory: "Cotidiano",
    limitPerSource: 45
  },
  {
    id: "batelao",
    name: "Batelao",
    feedUrl: "https://batelao.com/feed/",
    siteUrl: "https://batelao.com/",
    defaultCategory: "Cotidiano",
    limitPerSource: 25
  },
  {
    id: "tribuna-do-jurua",
    name: "Tribuna do Jurua",
    feedUrl: "https://tribunadojurua.com.br/feed/",
    siteUrl: "https://tribunadojurua.com.br/",
    defaultCategory: "Cotidiano",
    limitPerSource: 45
  },
  {
    id: "portal-do-jurua",
    name: "Portal do Jurua",
    feedUrl: "https://www.portaldojurua.com.br/feeds/posts/default",
    siteUrl: "https://www.portaldojurua.com.br/",
    defaultCategory: "Cotidiano",
    limitPerSource: 45,
    priority: 970,
    priorityReason: "Fonte regional prioritaria; o feed valido e Atom/Blogger em /feeds/posts/default."
  },
  {
    id: "voz-do-norte",
    name: "Voz do Norte",
    feedUrl: "https://www.vozdonorte.com.br/feed/",
    siteUrl: "https://www.vozdonorte.com.br/",
    defaultCategory: "Cotidiano",
    limitPerSource: 45,
    priority: 965,
    priorityReason: "Jornal regional do Jurua com RSS ativo e cobertura direta de Cruzeiro do Sul."
  },
  {
    id: "jurua-informativo",
    name: "Jurua Informativo",
    feedUrl: "https://www.juruainformativo.com.br/feed/",
    siteUrl: "https://www.juruainformativo.com.br/",
    defaultCategory: "Cotidiano",
    limitPerSource: 35,
    priority: 962,
    priorityReason: "Fonte regional do Vale do Jurua verificada em 2026-06-05 com RSS ativo; reforca cobertura de bairro, seguranca e servicos."
  },
  {
    id: "integracao-net",
    name: "Integracao Net",
    feedUrl: "https://integracaonet.com/feed/",
    siteUrl: "https://integracaonet.com/",
    defaultCategory: "Cotidiano",
    limitPerSource: 35,
    priority: 958,
    priorityReason: "Portal regional de Cruzeiro do Sul verificado em 2026-06-05 com RSS ativo; amplia cobertura do Vale do Jurua."
  },
  {
    id: "acre-in-foco",
    name: "Acre in Foco",
    feedUrl: "https://acreinfoco.com/wp-json/wp/v2/posts?per_page=24&_embed=1",
    feedType: "wordpress-json",
    siteUrl: "https://acreinfoco.com/",
    defaultCategory: "Cotidiano",
    limitPerSource: 35,
    priority: 840,
    priorityReason: "Fonte acreana com editoria do Vale do Jurua; usada para reforcar lacunas regionais quando houver impacto local."
  },
  {
    id: "folha-do-acre",
    name: "Folha do Acre",
    feedUrl: "https://folhadoacre.com.br/wp-json/wp/v2/posts?per_page=24&_embed=1",
    feedType: "wordpress-json",
    siteUrl: "https://folhadoacre.com.br/",
    defaultCategory: "Cotidiano",
    limitPerSource: 35,
    priority: 830,
    priorityReason: "Fonte estadual com cobertura frequente de Cruzeiro do Sul, seguranca, politica e servicos do interior."
  },
  {
    id: "portal-acre",
    name: "Portal Acre",
    feedUrl: "https://portalacre.com.br/feed/",
    siteUrl: "https://portalacre.com.br/",
    defaultCategory: "Cotidiano",
    limitPerSource: 24,
    priority: 825,
    priorityReason: "Fonte acreana verificada em 2026-06-05 com RSS ativo; entra como reforco para esporte, cidades e temas do interior."
  },
  {
    id: "o-alto-acre",
    name: "O Alto Acre",
    feedUrl: "https://oaltoacre.com/feed/",
    siteUrl: "https://oaltoacre.com/",
    defaultCategory: "Cotidiano",
    limitPerSource: 20,
    priority: 820,
    priorityReason: "Fonte estadual verificada em 2026-06-05 com RSS ativo; usar como camada complementar quando houver impacto no Acre ou no Jurua."
  },
  {
    id: "estado-do-acre",
    name: "Estado do Acre",
    feedUrl: "https://estadodoacre.com.br/feed/",
    siteUrl: "https://estadodoacre.com.br/",
    defaultCategory: "Cotidiano",
    limitPerSource: 20,
    priority: 815,
    priorityReason: "Fonte acreana verificada em 2026-06-05 com RSS ativo; reforca cultura, eventos e agenda regional."
  },
  {
    id: "acre-com-br",
    name: "Acre Noticias",
    feedUrl: "https://acre.com.br/feed/",
    siteUrl: "https://acre.com.br/",
    defaultCategory: "Cotidiano",
    limitPerSource: 20,
    priority: 810,
    priorityReason: "Fonte acreana verificada em 2026-06-05 com RSS ativo; inclui pautas de governo, tecnologia, esporte e juventude."
  },
  {
    id: "acre-agora",
    name: "Acre Agora",
    feedUrl: "https://acreagora.com/feed/",
    siteUrl: "https://acreagora.com/",
    defaultCategory: "Cotidiano",
    limitPerSource: 20,
    priority: 805,
    priorityReason: "Fonte acreana verificada em 2026-06-05 com RSS ativo; camada complementar para cidades, servicos e politica."
  },
  {
    id: "a-gazeta-do-acre",
    name: "A Gazeta do Acre",
    feedUrl: "https://agazetadoacre.com/feed/",
    siteUrl: "https://agazetadoacre.com/",
    defaultCategory: "Cotidiano",
    limitPerSource: 20,
    priority: 800,
    priorityReason: "Fonte estadual verificada em 2026-06-05 com RSS ativo; usada como reforco de cobertura quando o tema dialogar com o Vale do Jurua."
  },
  {
    id: "agencia-brasil-ultimas",
    name: "Agencia Brasil",
    feedUrl: "https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml",
    siteUrl: "https://agenciabrasil.ebc.com.br/",
    defaultCategory: "Nacional",
    limitPerSource: 15
  },
  {
    id: "g1-brasil",
    name: "G1 Brasil",
    feedUrl: "https://g1.globo.com/rss/g1/brasil/",
    siteUrl: "https://g1.globo.com/",
    defaultCategory: "Nacional",
    limitPerSource: 18
  },
  {
    id: "g1-politica",
    name: "G1 Politica",
    feedUrl: "https://g1.globo.com/rss/g1/politica/",
    siteUrl: "https://g1.globo.com/politica/",
    defaultCategory: "Politica",
    limitPerSource: 18
  },
  {
    id: "g1-pop-arte",
    name: "G1 Pop & Arte",
    feedUrl: "https://g1.globo.com/rss/g1/pop-arte/",
    siteUrl: "https://g1.globo.com/pop-arte/",
    defaultCategory: "Cultura",
    limitPerSource: 14
  },
  {
    id: "cnn-brasil",
    name: "CNN Brasil",
    feedUrl: "https://www.cnnbrasil.com.br/feed/",
    siteUrl: "https://www.cnnbrasil.com.br/",
    defaultCategory: "Nacional",
    limitPerSource: 18
  },
  {
    id: "terra-diversao",
    name: "Terra Diversao",
    feedUrl: "https://www.terra.com.br/rss/Controller?channelid=7f6c931cc6b6d310VgnVCM4000009bcceb0aRCRD",
    siteUrl: "https://www.terra.com.br/diversao/",
    defaultCategory: "Cultura",
    limitPerSource: 10,
    disabled: true,
    disabledReason: "Canal web ativo, mas RSS monitorado retornou 0 itens; usar como referência manual até trocar integração."
  },
  {
    id: "the-verge",
    name: "The Verge",
    feedUrl: "https://www.theverge.com/rss/index.xml",
    siteUrl: "https://www.theverge.com/",
    defaultCategory: "Novidades",
    limitPerSource: 10,
    disabled: true,
    disabledReason: "Desativado na rodada 20260522-homecatch1: textos em ingles nao podem vazar para a area publica antes de uma etapa de traducao editorial."
  },
  // +42 fontes validadas ao vivo em 2026-11-18 (Acre, Amazonia, Regional e Brasil)
  {
    id: "g1-acre",
    name: "G1 Acre",
    feedUrl: "https://g1.globo.com/rss/g1/ac/acre/",
    siteUrl: "https://g1.globo.com/ac/acre/",
    defaultCategory: "Cotidiano",
    limitPerSource: 30,
    priority: 960,
    priorityReason: "Cobertura estadual oficial do G1 Acre validada com RSS ativo."
  },
  {
    id: "contilnet-rss",
    name: "ContilNet Noticias",
    feedUrl: "https://contilnetnoticias.com.br/wp-json/wp/v2/posts?per_page=20&_embed=1",
    feedType: "wordpress-json",
    siteUrl: "https://contilnetnoticias.com.br/",
    defaultCategory: "Cotidiano",
    limitPerSource: 25,
    priority: 955,
    priorityReason: "WP-JSON oficial do ContilNet com publicacoes completas do Acre."
  },
  {
    id: "noticias-da-hora",
    name: "Noticias da Hora",
    feedUrl: "https://www.noticiasdahora.com.br/feed/",
    siteUrl: "https://www.noticiasdahora.com.br/",
    defaultCategory: "Cotidiano",
    limitPerSource: 20,
    priority: 920,
    priorityReason: "Portal acreano de cobertura diaria validado com RSS ativo."
  },
  {
    id: "oriobranco",
    name: "O Rio Branco",
    feedUrl: "https://oriobranco.net/feed/",
    siteUrl: "https://oriobranco.net/",
    defaultCategory: "Cotidiano",
    limitPerSource: 20,
    priority: 915,
    priorityReason: "Portal tradicional do Acre validado com RSS ativo."
  },
  {
    id: "diario-do-acre",
    name: "Diario do Acre",
    feedUrl: "https://diariodoacre.com.br/feed/",
    siteUrl: "https://diariodoacre.com.br/",
    defaultCategory: "Cotidiano",
    limitPerSource: 25,
    priority: 910,
    priorityReason: "Portal jornalístico do Acre validado com RSS ativo."
  },
  {
    id: "acrenews",
    name: "Acre News",
    feedUrl: "https://acrenews.com.br/feed/",
    siteUrl: "https://acrenews.com.br/",
    defaultCategory: "Cotidiano",
    limitPerSource: 20,
    priority: 905,
    priorityReason: "Portal estadual de noticias do Acre validado com RSS ativo."
  },
  {
    id: "o-seringal",
    name: "O Seringal",
    feedUrl: "https://oseringal.com/feed/",
    siteUrl: "https://oseringal.com/",
    defaultCategory: "Cotidiano",
    limitPerSource: 20,
    priority: 900,
    priorityReason: "Veiculo regional acreano validado com RSS ativo."
  },
  {
    id: "jurua-informativo-wp",
    name: "Jurua Informativo WP",
    feedUrl: "https://juruainformativo.com.br/wp-json/wp/v2/posts?per_page=15&_embed=1",
    feedType: "wordpress-json",
    siteUrl: "https://juruainformativo.com.br/",
    defaultCategory: "Cotidiano",
    limitPerSource: 20,
    priority: 965,
    priorityReason: "API WP-JSON direta do Vale do Jurua."
  },
  {
    id: "portal-amazonia",
    name: "Portal Amazonia",
    feedUrl: "https://portalamazonia.com/feed/",
    siteUrl: "https://portalamazonia.com/",
    defaultCategory: "Amazonia",
    limitPerSource: 15,
    priority: 720
  },
  {
    id: "amazonia-real",
    name: "Amazonia Real",
    feedUrl: "https://amazoniareal.com.br/feed/",
    siteUrl: "https://amazoniareal.com.br/",
    defaultCategory: "Amazonia",
    limitPerSource: 15,
    priority: 715
  },
  {
    id: "o-eco",
    name: "O Eco",
    feedUrl: "https://oeco.org.br/feed/",
    siteUrl: "https://oeco.org.br/",
    defaultCategory: "Clima",
    limitPerSource: 12,
    priority: 700
  },
  {
    id: "infoamazonia",
    name: "InfoAmazonia",
    feedUrl: "https://infoamazonia.org/feed/",
    siteUrl: "https://infoamazonia.org/",
    defaultCategory: "Clima",
    limitPerSource: 15,
    priority: 705
  },
  {
    id: "rondoniagora",
    name: "Rondoniagora",
    feedUrl: "https://www.rondoniagora.com/rss",
    siteUrl: "https://www.rondoniagora.com/",
    defaultCategory: "Regional",
    limitPerSource: 12,
    priority: 640
  },
  {
    id: "g1-amazonas",
    name: "G1 Amazonas",
    feedUrl: "https://g1.globo.com/rss/g1/am/amazonas/",
    siteUrl: "https://g1.globo.com/am/amazonas/",
    defaultCategory: "Regional",
    limitPerSource: 15,
    priority: 650
  },
  {
    id: "g1-rondonia",
    name: "G1 Rondonia",
    feedUrl: "https://g1.globo.com/rss/g1/ro/rondonia/",
    siteUrl: "https://g1.globo.com/ro/rondonia/",
    defaultCategory: "Regional",
    limitPerSource: 15,
    priority: 645
  },
  {
    id: "g1-economia",
    name: "G1 Economia",
    feedUrl: "https://g1.globo.com/rss/g1/economia/",
    siteUrl: "https://g1.globo.com/economia/",
    defaultCategory: "Economia",
    limitPerSource: 12,
    priority: 520
  },
  {
    id: "g1-educacao",
    name: "G1 Educacao",
    feedUrl: "https://g1.globo.com/rss/g1/educacao/",
    siteUrl: "https://g1.globo.com/educacao/",
    defaultCategory: "Educacao",
    limitPerSource: 12,
    priority: 525
  },
  {
    id: "g1-tecnologia",
    name: "G1 Tecnologia",
    feedUrl: "https://g1.globo.com/rss/g1/tecnologia/",
    siteUrl: "https://g1.globo.com/tecnologia/",
    defaultCategory: "Tecnologia",
    limitPerSource: 10,
    priority: 490
  },
  {
    id: "g1-saude",
    name: "G1 Saude",
    feedUrl: "https://g1.globo.com/rss/g1/saude/",
    siteUrl: "https://g1.globo.com/saude/",
    defaultCategory: "Saude",
    limitPerSource: 12,
    priority: 530
  },
  {
    id: "g1-mundo",
    name: "G1 Mundo",
    feedUrl: "https://g1.globo.com/rss/g1/mundo/",
    siteUrl: "https://g1.globo.com/mundo/",
    defaultCategory: "Mundo",
    limitPerSource: 10,
    priority: 460
  },
  {
    id: "g1-natureza",
    name: "G1 Meio Ambiente",
    feedUrl: "https://g1.globo.com/rss/g1/natureza/",
    siteUrl: "https://g1.globo.com/meio-ambiente/",
    defaultCategory: "Clima",
    limitPerSource: 10,
    priority: 510
  },
  {
    id: "g1-concursos",
    name: "G1 Trabalho e Carreira",
    feedUrl: "https://g1.globo.com/rss/g1/trabalho-e-carreira/",
    siteUrl: "https://g1.globo.com/trabalho-e-carreira/",
    defaultCategory: "Emprego",
    limitPerSource: 12,
    priority: 540
  },
  {
    id: "g1-ciencia",
    name: "G1 Ciencia",
    feedUrl: "https://g1.globo.com/rss/g1/ciencia/",
    siteUrl: "https://g1.globo.com/ciencia/",
    defaultCategory: "Ciencia",
    limitPerSource: 10,
    priority: 470
  },
  {
    id: "poder360",
    name: "Poder360",
    feedUrl: "https://www.poder360.com.br/feed/",
    siteUrl: "https://www.poder360.com.br/",
    defaultCategory: "Politica",
    limitPerSource: 10,
    priority: 500
  },
  {
    id: "metropoles",
    name: "Metropoles",
    feedUrl: "https://www.metropoles.com/feed",
    siteUrl: "https://www.metropoles.com/",
    defaultCategory: "Nacional",
    limitPerSource: 12,
    priority: 495
  },
  {
    id: "correio-braziliense",
    name: "Correio Braziliense",
    feedUrl: "https://www.correiobraziliense.com.br/rss/noticia/brasil/rss.xml",
    siteUrl: "https://www.correiobraziliense.com.br/",
    defaultCategory: "Nacional",
    limitPerSource: 10,
    priority: 480
  },
  {
    id: "senado-noticias",
    name: "Agencia Senado",
    feedUrl: "https://www12.senado.leg.br/noticias/feed/todasnoticias/RSS",
    siteUrl: "https://www12.senado.leg.br/noticias",
    defaultCategory: "Politica",
    limitPerSource: 10,
    priority: 515
  },
  {
    id: "agencia-brasil-economia",
    name: "Agencia Brasil Economia",
    feedUrl: "https://agenciabrasil.ebc.com.br/rss/economia/feed.xml",
    siteUrl: "https://agenciabrasil.ebc.com.br/economia",
    defaultCategory: "Economia",
    limitPerSource: 10,
    priority: 510
  },
  {
    id: "agencia-brasil-educacao",
    name: "Agencia Brasil Educacao",
    feedUrl: "https://agenciabrasil.ebc.com.br/rss/educacao/feed.xml",
    siteUrl: "https://agenciabrasil.ebc.com.br/educacao",
    defaultCategory: "Educacao",
    limitPerSource: 10,
    priority: 515
  },
  {
    id: "agencia-brasil-saude",
    name: "Agencia Brasil Saude",
    feedUrl: "https://agenciabrasil.ebc.com.br/rss/saude/feed.xml",
    siteUrl: "https://agenciabrasil.ebc.com.br/saude",
    defaultCategory: "Saude",
    limitPerSource: 10,
    priority: 515
  },
  {
    id: "agencia-brasil-justica",
    name: "Agencia Brasil Justica",
    feedUrl: "https://agenciabrasil.ebc.com.br/rss/justica/feed.xml",
    siteUrl: "https://agenciabrasil.ebc.com.br/justica",
    defaultCategory: "Seguranca",
    limitPerSource: 10,
    priority: 505
  },
  {
    id: "infomoney",
    name: "InfoMoney",
    feedUrl: "https://www.infomoney.com.br/feed/",
    siteUrl: "https://www.infomoney.com.br/",
    defaultCategory: "Economia",
    limitPerSource: 10,
    priority: 485
  },
  {
    id: "canaltech",
    name: "Canaltech",
    feedUrl: "https://canaltech.com.br/rss/",
    siteUrl: "https://canaltech.com.br/",
    defaultCategory: "Tecnologia",
    limitPerSource: 10,
    priority: 475
  },
  {
    id: "olhar-digital",
    name: "Olhar Digital",
    feedUrl: "https://olhardigital.com.br/feed/",
    siteUrl: "https://olhardigital.com.br/",
    defaultCategory: "Tecnologia",
    limitPerSource: 10,
    priority: 470
  },
  {
    id: "tecnoblog",
    name: "Tecnoblog",
    feedUrl: "https://tecnoblog.net/feed/",
    siteUrl: "https://tecnoblog.net/",
    defaultCategory: "Tecnologia",
    limitPerSource: 10,
    priority: 470
  },
  {
    id: "ge-futebol",
    name: "ge Esportes",
    feedUrl: "https://ge.globo.com/rss/ge/",
    siteUrl: "https://ge.globo.com/",
    defaultCategory: "Esportes",
    limitPerSource: 12,
    priority: 500
  },
  {
    id: "uol-noticias",
    name: "UOL Noticias",
    feedUrl: "https://rss.uol.com.br/feed/noticias.xml",
    siteUrl: "https://noticias.uol.com.br/",
    defaultCategory: "Nacional",
    limitPerSource: 10,
    priority: 480
  },
  {
    id: "folha-poder",
    name: "Folha Poder",
    feedUrl: "https://feeds.folha.uol.com.br/poder/rss091.xml",
    siteUrl: "https://www1.folha.uol.com.br/poder/",
    defaultCategory: "Politica",
    limitPerSource: 10,
    priority: 475
  },
  {
    id: "folha-mercado",
    name: "Folha Mercado",
    feedUrl: "https://feeds.folha.uol.com.br/mercado/rss091.xml",
    siteUrl: "https://www1.folha.uol.com.br/mercado/",
    defaultCategory: "Economia",
    limitPerSource: 10,
    priority: 475
  },
  {
    id: "gazeta-do-povo",
    name: "Gazeta do Povo",
    feedUrl: "https://www.gazetadopovo.com.br/feed/rss/ultimas-noticias.xml",
    siteUrl: "https://www.gazetadopovo.com.br/",
    defaultCategory: "Nacional",
    limitPerSource: 10,
    priority: 485
  },
  {
    id: "revista-oeste",
    name: "Revista Oeste",
    feedUrl: "https://revistaoeste.com/feed/",
    siteUrl: "https://revistaoeste.com/",
    defaultCategory: "Nacional",
    limitPerSource: 10,
    priority: 485
  },
  {
    id: "terra-noticias",
    name: "Terra Noticias",
    feedUrl: "https://www.terra.com.br/rss.xml",
    siteUrl: "https://www.terra.com.br/noticias/",
    defaultCategory: "Nacional",
    limitPerSource: 10,
    priority: 465
  }
];
