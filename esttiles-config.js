const esttilesSupportCatalog = [
  {
    id: "look-rack",
    name: "Rack curado de looks",
    description: "Ajuda o time a montar combinações, provar styling e organizar leitura visual de coleção.",
    price: 74
  },
  {
    id: "photo-set",
    name: "Set de foto editorial",
    description: "Empurra fotografia, luz, fundo, enquadramento e material de campanha.",
    price: 88
  },
  {
    id: "beauty-station",
    name: "Estação de beleza",
    description: "Reforça maquiagem, cabelo, acabamento visual e leitura de backstage.",
    price: 58
  },
  {
    id: "window-display",
    name: "Vitrine e merchandising",
    description: "Melhora leitura de produto, varejo local, montagem de vitrine e narrativa comercial.",
    price: 66
  }
];

const esttilesRoomSpots = {
  ceo: [
    { x: 108, y: 160, task: "coordenando o Esttíles entre tendência, mercado, beleza e imagem", pauseMs: 1800 },
    { x: 166, y: 162, task: "definindo o destaque principal de moda, vitrine local e passarela", pauseMs: 1500 }
  ],
  news: [
    { x: 300, y: 156, task: "cruzando tendência, comportamento e repertório editorial", pauseMs: 1500 },
    { x: 430, y: 156, task: "separando o que é moda de verdade e o que é só ruído de vitrine", pauseMs: 1400 },
    { x: 492, y: 128, task: "fechando ângulos de leitura para look, beleza e marca", pauseMs: 1300 }
  ],
  subpages: [
    { x: 650, y: 188, task: "organizando passarela, produção, casting e styling da semana", pauseMs: 1500 },
    { x: 784, y: 188, task: "montando leitura de desfile, coleção e direção de imagem", pauseMs: 1500 },
    { x: 884, y: 220, task: "ligando o editorial ao comércio local e à vitrine real", pauseMs: 1600 }
  ],
  design: [
    { x: 126, y: 250, task: "ajustando styling, beleza, cor e acabamento visual", pauseMs: 1300 },
    { x: 214, y: 296, task: "desenhando identidade, branding e kits visuais", pauseMs: 1500 }
  ],
  review: [
    { x: 430, y: 258, task: "checando legibilidade, corte de texto, contraste e leitura de card", pauseMs: 1300 },
    { x: 512, y: 304, task: "revisando se imagem, copy e look contam a mesma história", pauseMs: 1500 }
  ],
  cafe: [
    { x: 640, y: 330, task: "fazendo clipping de moda local com café na mão", pauseMs: 1800 },
    { x: 714, y: 322, task: "comparando vitrine, rua, rede social e tendência global", pauseMs: 1700 },
    { x: 818, y: 322, task: "fechando repertório de marcas, creators e eventos", pauseMs: 1600 }
  ],
  dev: [
    { x: 540, y: 454, task: "organizando calendário, base de looks, commerce e painéis do Esttíles", pauseMs: 1500 },
    { x: 720, y: 474, task: "integrando cobertura de moda ao portal e às vitrines locais", pauseMs: 1400 },
    { x: 878, y: 458, task: "medindo performance, cache, recorte de foto e estabilidade da página", pauseMs: 1300 }
  ]
};

const esttilesPositions = {
  ceo: [
    { x: 96, y: 148 }, { x: 148, y: 156 }, { x: 196, y: 184 }, { x: 122, y: 188 }
  ],
  news: [
    { x: 286, y: 132 }, { x: 356, y: 132 }, { x: 426, y: 132 }, { x: 496, y: 132 },
    { x: 318, y: 172 }, { x: 388, y: 172 }, { x: 458, y: 172 }, { x: 528, y: 172 }
  ],
  subpages: [
    { x: 604, y: 144 }, { x: 674, y: 144 }, { x: 744, y: 144 }, { x: 814, y: 144 },
    { x: 884, y: 164 }, { x: 638, y: 210 }, { x: 708, y: 210 }, { x: 778, y: 210 }, { x: 850, y: 220 }
  ],
  design: [
    { x: 82, y: 246 }, { x: 144, y: 246 }, { x: 206, y: 246 }, { x: 110, y: 310 }, { x: 172, y: 310 }, { x: 234, y: 318 }
  ],
  review: [
    { x: 330, y: 246 }, { x: 392, y: 246 }, { x: 454, y: 246 }, { x: 516, y: 270 },
    { x: 360, y: 320 }, { x: 430, y: 322 }, { x: 500, y: 324 }
  ],
  cafe: [
    { x: 610, y: 318 }, { x: 676, y: 318 }, { x: 742, y: 318 }, { x: 808, y: 318 }, { x: 874, y: 330 }
  ],
  dev: [
    { x: 86, y: 438 }, { x: 154, y: 438 }, { x: 222, y: 438 }, { x: 290, y: 438 }, { x: 358, y: 438 },
    { x: 426, y: 438 }, { x: 494, y: 438 }, { x: 562, y: 438 }, { x: 630, y: 438 }, { x: 698, y: 438 }, { x: 766, y: 438 }
  ]
};

const esttilesDisciplines = [
  ["fashion-lead", "Maya Esttíles", "ceo", "ceo", "Direção editorial de moda", "visão de moda, recorte editorial e integração com o portal"],
  ["market-lead", "Rafa Mercado", "sales", "ceo", "Moda e negócios locais", "varejo, comércio, vitrine local e ponte com anunciantes"],
  ["trend-lead", "Iris Tendência", "copy", "ceo", "Curadoria de tendência", "tendência, comportamento, rua e repertório de coleção"],
  ["fashion-producer", "Bento Producer", "review", "ceo", "Produção e direção de rodada", "agenda, ritmo, produção, cronograma e entrega"],
  ["street-style", "Nina Rua", "copy", "news", "Street style", "rua, comportamento, look do dia e leitura pública"],
  ["fashion-reporter", "Theo Moda", "copy", "news", "Reporter de moda", "desfile, evento, coleção e comportamento"],
  ["beauty-watch", "Luna Beauty", "design", "news", "Radar de beleza", "make, cabelo, pele, perfume e backstage de beleza"],
  ["trend-scout", "Caio Scout", "sources", "news", "Scout de tendências", "passarela, tendência, creators, repertório e sinais de mercado"],
  ["color-stylist", "Mika Cor", "design", "news", "Cor e composição", "paleta, contraste, harmonia e direção visual"],
  ["fabric-editor", "Jade Tecido", "copy", "news", "Leitura de material", "tecido, textura, caimento e acabamento"],
  ["culture-fashion", "Rui Cultura", "copy", "news", "Moda e cultura", "cultura pop, comportamento, cidade e leitura pública"],
  ["photo-brief", "Tessa Brief", "review", "news", "Direção de imagem", "enquadramento, foco, recorte e leitura de foto"],
  ["styling-lead", "Cleo Styling", "design", "subpages", "Styling e montagem", "montagem de look, peça, proporção e silhueta"],
  ["casting-director", "Ayla Casting", "design", "subpages", "Casting e presença", "casting, pose, passarela e persona"],
  ["runway-producer", "Nara Passarela", "games", "subpages", "Passarela e desfile", "desfile, sequência, entrada, saída e ritmo"],
  ["lookbook-editor", "Vera Lookbook", "design", "subpages", "Lookbook", "editorial, sequência, campanha e imagem de coleção"],
  ["wardrobe-editor", "Dora Acervo", "design", "subpages", "Acervo e figurino", "guarda-roupa, prova, curadoria e combinação"],
  ["menswear", "Luan Alfaiate", "copy", "subpages", "Masculino", "alfaiataria, casual, ajuste e leitura masculina"],
  ["womenswear", "Mina Feminina", "copy", "subpages", "Feminino", "vestido, conjunto, caimento e estilo feminino"],
  ["kids-fashion", "Bia Mini", "copy", "subpages", "Moda infantil", "moda kids, conforto, cor, segurança e leitura familiar"],
  ["plus-style", "Sol Curvas", "copy", "subpages", "Moda plus size", "caimento, conforto, proporção e representação"],
  ["beauty-director", "Ivy Glow", "design", "design", "Direção de beleza", "glow, make, cabelo, finalização e identidade"],
  ["makeup-artist", "Mara Make", "design", "design", "Makeup editorial", "maquiagem, sombra, pele e acabamento"],
  ["hair-artist", "Rita Hair", "design", "design", "Hair styling", "cabelo, textura, corte, finalização e visual"],
  ["nails-details", "Kika Detalhe", "design", "design", "Detalhes de beleza", "unhas, acessório, close-up e acabamento"],
  ["accessories", "Pietra Acesso", "design", "design", "Acessórios", "bolsa, joia, óculos, chapéu e leitura de complemento"],
  ["branding", "Otto Marca", "sales", "design", "Branding de moda", "marca, posicionamento, linguagem, naming e coleção"],
  ["merchandising", "Gabi Vitrine", "sales", "design", "Visual merchandising", "vitrine, exposição, loja, percurso e impacto"],
  ["ecommerce", "Vini Store", "dev", "review", "Moda digital", "e-commerce, produto, ficha, vitrine online e conversão"],
  ["photo-editor", "Lia Foto", "review", "review", "Edição de foto", "corte, cor, foco, contraste e nitidez"],
  ["text-editor", "Téo Copy", "review", "review", "Copy de moda", "título, legenda, leitura, clareza e corte de texto"],
  ["layout-editor", "Noa Grid", "review", "review", "Layout e card", "grid, card, respiro, altura e leitura mobile"],
  ["accessibility-style", "Ravi Acesso", "review", "review", "Legibilidade visual", "contraste, tamanho, leitura e acessibilidade"],
  ["campaign-qa", "Nico QA", "review", "review", "QA de campanha", "alinhamento de imagem, texto e CTA"],
  ["retouch-watch", "Mila Pele", "review", "review", "Retoque responsável", "retoque, naturalidade e consistência de imagem"],
  ["local-market", "Juca Varejo", "sales", "cafe", "Mercado local", "lojas, marcas, serviço, comércio e rua"],
  ["creator-scout", "Lola Creator", "sources", "cafe", "Creators e cena local", "influenciadores, creators, cena local e social"],
  ["event-scout", "Rex Evento", "sources", "cafe", "Agenda fashion", "evento, lançamento, feira, desfile e calendário"],
  ["fashion-archive", "Cora Acervo", "sources", "cafe", "Arquivo editorial", "arquivo, referência, histórico e memória visual"],
  ["style-consumer", "Miro Compra", "sales", "cafe", "Consumo e compra", "desejo, ticket, timing e comportamento de compra"],
  ["fashion-social", "Bela Social", "sources", "cafe", "Moda e redes", "instagram, reels, feed, presença social e viral"],
  ["cms-fashion", "Enzo CMS", "dev", "dev", "Operação do subsite", "CMS, painel, cards, seções e atualização"],
  ["data-fashion", "Tina Dados", "dev", "dev", "Dados e métricas", "tema, clique, leitura, grade e performance"],
  ["photo-pipeline", "Ari Pipeline", "dev", "dev", "Pipeline de imagem", "compressão, versão, foco e cache"],
  ["calendar-fashion", "Nina Agenda", "dev", "dev", "Calendário de entrada no ar", "agenda, lançamentos e fluxo"],
  ["ad-fashion", "Beto Ads", "sales", "dev", "Monetização fashion", "anunciante, branded content, vitrine e oferta"],
  ["trend-ai", "Dora AI", "dev", "dev", "Pesquisa e cruzamento", "IA, cruzamento de tendência, busca e curadoria"],
  ["shop-guide", "Cleo Guia", "copy", "dev", "Guia de compra", "guia, serviço, ocasião e recomendação"],
  ["ethics-fashion", "Tessa Ética", "review", "dev", "Ética e imagem", "imagem pública, representação e segurança editorial"],
  ["beauty-copy", "Gaia Glow", "copy", "dev", "Copy de beleza", "roteiro, linguagem, beleza e serviço"],
  ["fashion-deploy", "Vera Deploy", "dev", "dev", "Build e publicação", "deploy, versão, estabilidade e entrada no ar"]
];

const esttilesRoomCursor = {};
function nextEsttilesPosition(room) {
  const slots = esttilesPositions[room] || esttilesPositions.news;
  const cursor = esttilesRoomCursor[room] || 0;
  esttilesRoomCursor[room] = cursor + 1;
  return slots[cursor % slots.length];
}

function buildEsttilesAgents() {
  return esttilesDisciplines.map(([id, name, role, room, title, specialty], index) => {
    const spot = nextEsttilesPosition(room);
    return {
      id,
      name,
      role,
      room,
      title,
      specialty,
      description:
        `Especialista do Esttíles dedicado a ${specialty}. Trabalha moda como leitura pública: imagem, utilidade, comportamento, mercado e identidade visual.`,
      task: `trabalhando ${specialty} para deixar o Esttíles mais forte e mais funcional`,
      skills: specialty.split(",").map((item) => item.trim()).slice(0, 4),
      x: spot.x,
      y: spot.y,
      speed: 7 + (index % 4),
      lines: [
        `Estou puxando ${specialty} para dentro do editorial de moda.`,
        "A moda aqui precisa ficar bonita e legível ao mesmo tempo.",
        "Eu cruzo visual, comportamento e utilidade antes de fechar qualquer proposta."
      ]
    };
  });
}

window.__OFFICE_CONFIG__ = {
  officeKey: "esttiles-fashion",
  defaultTheme: "fashion-runway",
  disableNews: false,
  supportIntro:
    "A vaquinha do Esttíles ajuda o time a acelerar styling, fotografia, beleza, branding, vitrine e cobertura de moda local.",
  environments: [
    {
      id: "fashion-runway",
      label: "Runway Floor",
      shortLabel: "Passarela",
      description: "Modo principal do Esttíles: passarela, styling, lookbook e direção de imagem.",
      spriteKit: "default",
      focusLabel: "passarela, estilo e direção visual"
    },
    {
      id: "editorial-hq",
      label: "Estúdio Editorial",
      shortLabel: "Estúdio",
      description: "Modo de foto, campanha, luz, beleza, casting e recorte editorial.",
      spriteKit: "astronaut",
      focusLabel: "foto, beleza e campanha"
    },
    {
      id: "editorial-west",
      label: "Vitrine Noturna",
      shortLabel: "Vitrine",
      description: "Modo vitrine e comércio: branding, varejo, loja, tendência e comportamento de compra.",
      spriteKit: "cowboy",
      focusLabel: "mercado, vitrine e consumo"
    }
  ],
  supportCatalog: esttilesSupportCatalog,
  terminalWelcome:
    "Esttíles online. 50 agentes de moda, beleza, fotografia, branding, passarela, varejo e comportamento estão em operação.",
  reducedMotionMessage:
    "Movimento reduzido ativo: os 50 agentes do Esttíles seguem disponíveis nos perfis e no radar lateral.",
  smallTalk: [
    "Moda bonita que ninguém consegue ler no celular ainda não está pronta.",
    "Look, foto e copy precisam se completar, não competir.",
    "Vitrine boa vende sem precisar gritar.",
    "A moda local também merece leitura premium, não só réplica de tendência global.",
    "Se a imagem está linda mas o texto corta, o card falhou.",
    "No Esttíles, beleza sem função não fecha a leitura."
  ],
  roomSpots: esttilesRoomSpots,
  agents: buildEsttilesAgents()
};
