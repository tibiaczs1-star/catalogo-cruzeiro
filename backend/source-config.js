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
    priorityReason: "Fonte oficial municipal prioritaria; site Wix sem RSS confiavel, capturar cards publicos da home."
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
  }
];
