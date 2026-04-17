window.__OFFICE_CONFIG__ = {
  officeKey: "nerd-studio",
  defaultTheme: "nerd-arcade",
  disableNews: true,
  supportIntro:
    "A vaquinha do estúdio nerd deixa cada apoio virar melhoria visível para o desenvolvimento do PubPaid.",
  environments: [
    {
      id: "nerd-arcade",
      label: "Arcade Lab",
      shortLabel: "Arcade",
      description:
        "O estúdio vira uma bancada neon de game lab, com brilho de arcade e clima de produção pesada.",
      spriteKit: "default",
      focusLabel: "protótipos, HUD e iteração rápida"
    },
    {
      id: "nerd-starship",
      label: "Nave Estelar",
      shortLabel: "Nave",
      description:
        "O time entra em modo estação espacial e os sprites passam a vestir capacete de astronauta dentro da nave.",
      spriteKit: "astronaut",
      focusLabel: "simulação, engine e monitoramento orbital"
    },
    {
      id: "nerd-frontier",
      label: "Cyber Oeste",
      shortLabel: "Oeste",
      description:
        "Uma mistura de velho oeste e laboratório neon, com chapéu de cowboy, couro e bancada de fronteira.",
      spriteKit: "cowboy",
      focusLabel: "protótipos de risco, playtest e improviso criativo"
    }
  ],
  supportCatalog: [
    {
      id: "nerd-gpu",
      name: "Mais poder computacional",
      description: "Empurra render, efeitos, build e testes pesados do estúdio com mais folga.",
      price: 90
    },
    {
      id: "nerd-monitor",
      name: "Monitor ultrawide",
      description: "Mais espaço para mapa, HUD, timeline e debug do PubPaid.",
      price: 68
    },
    {
      id: "nerd-audio",
      name: "Kit de áudio melhor",
      description: "Ajuda o time a trabalhar som, palco e feedback com mais precisão.",
      price: 52
    },
    {
      id: "nerd-chair",
      name: "Cadeira pro playtest",
      description: "Conforto para rodadas longas de QA, sensação e polimento final.",
      price: 44
    }
  ],
  terminalWelcome:
    "Escritório Nerd em modo de produção pesada. O CEO chamou o time inteiro para acelerar física, sprites, lógica, HUD e novas rodadas do PubPaid.",
  reducedMotionMessage:
    "Movimento reduzido ativo: o time nerd continua disponível nos perfis e no terminal lateral.",
  smallTalk: [
    "A sensação de clique precisa responder como jogo, não como slide.",
    "A física boa não aparece só no código; ela aparece no que a mão sente.",
    "O PubPaid está ficando mais vivo quando luz, som e NPCs contam a mesma história.",
    "HUD bonito não basta; ele precisa ser lido em um segundo.",
    "Cada mesa tem que parecer um convite, não um bloco perdido no salão.",
    "Se a colisão confunde, a fantasia quebra rápido.",
    "Neon, partículas e sombra só valem quando ajudam o clima do pub.",
    "Uma animação curta bem feita vende mais presença do que dez efeitos aleatórios.",
    "O jogador precisa sentir que o salão reage à presença dele.",
    "Quanto mais claro o feedback, mais justa a rodada parece.",
    "O CEO acabou de pedir ritmo máximo: ninguém sai da bancada sem melhorar alguma parte do PubPaid.",
    "Hoje o escritório nerd entrou em modo fábrica, com arte e sistema andando ao mesmo tempo."
  ],
  roomSpots: {
    ceo: [
      { x: 108, y: 160, task: "mandando o time inteiro acelerar sprites, física, lógica e polimento do PubPaid", pauseMs: 2000 },
      { x: 166, y: 162, task: "revisando o quadro mestre com metas de produção pesada para o salão e os minigames", pauseMs: 1500 }
    ],
    news: [
      { x: 300, y: 156, task: "desenhando o loop principal da noite e as entradas de cada mesa", pauseMs: 1500 },
      { x: 430, y: 156, task: "refinando onboarding, ritmo e leitura de interação", pauseMs: 1500 },
      { x: 492, y: 128, task: "alinhando microcopys, dicas e feedback do salão", pauseMs: 1200 }
    ],
    subpages: [
      { x: 650, y: 188, task: "planejando cenário, fluxo e clima da navegação do pub", pauseMs: 1500 },
      { x: 784, y: 188, task: "equilibrando recompensas, mesas e sensação de progressão", pauseMs: 1500 },
      { x: 884, y: 220, task: "checando som, palco e eventos especiais do ambiente", pauseMs: 1600 }
    ],
    design: [
      { x: 126, y: 250, task: "testando sprites, luzes e partículas do salão", pauseMs: 1300 },
      { x: 214, y: 296, task: "redesenhando interface, ícones e acabamentos do PubPaid", pauseMs: 1500 }
    ],
    review: [
      { x: 430, y: 258, task: "rodando playtests para achar atritos de controle e clareza", pauseMs: 1300 },
      { x: 512, y: 304, task: "fazendo checklist de equilíbrio, acessibilidade e polimento", pauseMs: 1500 }
    ],
    cafe: [
      { x: 640, y: 330, task: "fazendo pausa rápida antes da próxima bateria de testes", pauseMs: 1800 },
      { x: 714, y: 322, task: "trocando ideias sobre feedback visual e sensação de jogo", pauseMs: 1700 },
      { x: 818, y: 322, task: "fechando referências de arte e vibe do pub", pauseMs: 1600 }
    ],
    dev: [
      { x: 540, y: 454, task: "ajustando colisão, resposta e física de navegação", pauseMs: 1500 },
      { x: 720, y: 474, task: "integrando lógica de eventos, HUD e sistemas da noite", pauseMs: 1400 },
      { x: 878, y: 458, task: "monitorando performance, timers e estabilidade do minigame", pauseMs: 1300 }
    ]
  },
  agents: [
    {
      id: "codex-nerd",
      name: "Codex Nerd Lead",
      role: "ceo",
      title: "Direção criativa e técnica do Escritório Nerd",
      room: "ceo",
      specialty: "visão de produto, prioridades de desenvolvimento e integração entre arte, design e sistema",
      description:
        "Coordena o time que evolui o PubPaid, costurando jogabilidade, direção visual, clareza de interface, estabilidade técnica e ritmo de entrega.",
      task: "disparando ordem geral para o time trabalhar pesado no PubPaid",
      speed: 9,
      skills: ["direção", "produto", "prioridades", "integração"],
      x: 108,
      y: 160,
      lines: [
        "O time inteiro entrou em ritmo máximo para melhorar sprites, física e o fôlego dos minigames.",
        "O PubPaid precisa parecer vivo, legível e divertido ao mesmo tempo.",
        "Quando eu puxo o ritmo, cada agente sai da mesa com uma melhoria concreta na mão."
      ]
    },
    {
      id: "game-loop",
      name: "Iris Loop",
      role: "games",
      title: "Game design e fluxo da noite",
      room: "news",
      specialty: "loop principal, onboarding, ritmo de interação e leitura das mesas",
      description:
        "Desenha o caminho do jogador desde a porta até cada ponto interativo, deixando as escolhas mais claras e o começo da noite mais envolvente.",
      task: "organizando o fluxo entre entrada, salão, mesas e atalhos",
      skills: ["game design", "onboarding", "ritmo", "fluxo"],
      x: 300,
      y: 156,
      lines: [
        "Entrada boa ensina sem precisar parecer tutorial pesado.",
        "Se a noite começa confusa, o jogador perde confiança cedo.",
        "Eu penso no caminho inteiro antes de pensar no brilho."
      ]
    },
    {
      id: "ui-hud",
      name: "Beto HUD",
      role: "design",
      title: "Interface, HUD e leitura rápida",
      room: "news",
      specialty: "HUD, painéis, microcopy de ação e clareza de informação",
      description:
        "Refina o que o jogador lê enquanto joga, para saldo, ações, avisos e atalhos ficarem rápidos de entender sem poluir o cenário.",
      task: "ajustando hierarquia visual do HUD e dos prompts",
      skills: ["HUD", "UI", "microcopy", "hierarquia"],
      x: 430,
      y: 156,
      lines: [
        "HUD bom explica rápido e some da frente quando não precisa chamar atenção.",
        "Toda dica precisa ajudar a agir, não só ocupar tela.",
        "No PubPaid, leitura boa deixa a noite mais elegante."
      ]
    },
    {
      id: "nina-lore",
      name: "Nina Lore",
      role: "copy",
      title: "Ambientação, falas e identidade do pub",
      room: "news",
      specialty: "clima narrativo, falas dos NPCs, instruções públicas e personalidade do jogo",
      description:
        "Cuida das falas, mensagens e descrições para o PubPaid soar como um lugar vivo, acolhedor e coerente com a própria fantasia.",
      task: "lapidando a voz pública do salão e dos personagens",
      skills: ["copy", "ambientação", "NPCs", "identidade"],
      x: 492,
      y: 128,
      lines: [
        "O salão precisa conversar com a pessoa, não recitar manual técnico.",
        "Fala boa dá clima e também ensina.",
        "Cada personagem do PubPaid precisa parecer que existe mesmo."
      ]
    },
    {
      id: "maya-stage",
      name: "Maya Stage",
      role: "games",
      title: "Cenário, palco e fluxo espacial",
      room: "subpages",
      specialty: "organização do salão, leitura de hotspots e valorização dos pontos do cenário",
      description:
        "Distribui palco, jukebox, garçom, mesas e zonas de interesse para o PubPaid ficar mais convidativo e mais fácil de percorrer.",
      task: "reposicionando o salão para destacar hotspots de forma natural",
      skills: ["level design", "fluxo espacial", "cena", "hotspots"],
      x: 650,
      y: 188,
      lines: [
        "O jogador tem que entender para onde olhar assim que entra.",
        "Se o hotspot pede legenda demais, o cenário ainda não está fazendo o trabalho certo.",
        "Cada canto do pub precisa ter uma função clara."
      ]
    },
    {
      id: "ravi-economy",
      name: "Ravi Balance",
      role: "sales",
      title: "Economia, recompensas e progressão",
      room: "subpages",
      specialty: "apostas demo, retorno, progressão e valor percebido de upgrades",
      description:
        "Cuida do equilíbrio entre risco e recompensa, para bebidas, mesas, ganhos e compras visuais parecerem justos e empolgantes.",
      task: "equalizando stakes, retorno e sensação de progresso",
      skills: ["economia", "balanceamento", "recompensa", "progressão"],
      x: 784,
      y: 188,
      lines: [
        "Quando o retorno parece justo, a rodada ganha mais emoção.",
        "Upgrade visual também precisa parecer conquista.",
        "Aposta pequena sem graça mata o começo do jogo."
      ]
    },
    {
      id: "luna-audio",
      name: "Luna Áudio",
      role: "social",
      title: "Som, palco e eventos vivos",
      room: "subpages",
      specialty: "jukebox, cantora, timing de eventos e pistas sonoras do ambiente",
      description:
        "Desenha a presença sonora do salão para o palco, a jukebox e os pequenos eventos parecerem parte orgânica da noite.",
      task: "refinando as pistas de som e a personalidade do palco",
      skills: ["áudio", "eventos", "palco", "timing"],
      x: 884,
      y: 220,
      lines: [
        "Som bom faz o cenário respirar mesmo antes de qualquer clique.",
        "A jukebox precisa ser dica de gameplay e também parte da fantasia.",
        "Quando o palco responde bem, o pub inteiro parece mais vivo."
      ]
    },
    {
      id: "pixo-fx",
      name: "Pixo FX",
      role: "pixel",
      title: "Pixel art, VFX e presença visual",
      room: "design",
      specialty: "sprites, partículas, neon, brilhos e pequenas animações do salão",
      description:
        "Dá forma visual ao PubPaid, combinando pixel art, iluminação e pequenos efeitos que deixam o pub mais expressivo sem virar poluição.",
      task: "criando sprites de bebidas, máquinas e efeitos para o salão e os jogos",
      skills: ["pixel art", "VFX", "neon", "sprites"],
      x: 126,
      y: 296,
      lines: [
        "Luz boa ajuda a jogar; não é só enfeite.",
        "Eu estou fazendo o salão piscar vida sem roubar leitura.",
        "Um efeito pequeno bem colocado vale mais que fogos em toda parte."
      ]
    },
    {
      id: "nika-render",
      name: "Nika Render",
      role: "design",
      title: "Direção visual e acabamento gráfico",
      room: "design",
      specialty: "paleta, profundidade, contraste e unidade visual do PubPaid",
      description:
        "Cuida para a aparência do pub continuar marcante, com profundidade e leitura, sem virar uma mistura solta de cores e elementos.",
      task: "amarrando contraste, paleta e profundidade do pub",
      skills: ["direção visual", "gráficos", "paleta", "acabamento"],
      x: 214,
      y: 250,
      lines: [
        "Gráfico forte também precisa saber respirar.",
        "Se o neon apaga a leitura, eu puxo o freio.",
        "Meu foco é fazer o PubPaid parecer um mundo coerente."
      ]
    },
    {
      id: "otto-physics",
      name: "Otto Physics",
      role: "dev",
      title: "Movimento, colisão e sensação física",
      room: "dev",
      specialty: "resposta de movimento, colisão, aproximação por mouse e sensação de peso leve",
      description:
        "Refina a navegação do salão para o personagem responder melhor, travar menos em obstáculos e passar uma sensação mais justa ao circular.",
      task: "ajustando colisão, clique no cenário e resposta de navegação",
      skills: ["física", "colisão", "controle", "mouse"],
      x: 540,
      y: 454,
      lines: [
        "Se o corpo trava num canto invisível, a magia do jogo quebra na hora.",
        "Eu cuido da sensação de deslocamento, não só da matemática.",
        "O ideal é o jogador sentir o controle leve e confiável."
      ]
    },
    {
      id: "gabi-avatar",
      name: "Gabi Avatar",
      role: "design",
      title: "Personagem, inventário e acessórios",
      room: "dev",
      specialty: "avatar, acessórios comprados, leitura do loadout e identidade do jogador",
      description:
        "Garante que o que a pessoa compra e equipa apareça de forma clara e agradável no avatar e no inventário visual.",
      task: "desenhando acessórios, inventário visual e sprites do loadout do jogador",
      skills: ["avatar", "inventário", "cosméticos", "silhueta"],
      x: 720,
      y: 474,
      lines: [
        "Se comprou, tem que aparecer com orgulho no personagem.",
        "Visual equipado ajuda a transformar saldo em sensação de conquista.",
        "O avatar precisa parecer parte viva da noite."
      ]
    },
    {
      id: "tami-qa",
      name: "Tami QA",
      role: "review",
      title: "Playtest, QA e polimento final",
      room: "review",
      specialty: "playtest, revisão de atritos, clareza de botões e consistência da experiência",
      description:
        "Entra depois de cada melhoria para encontrar o que ainda parece quebrado, estranho, confuso ou menos divertido do que deveria.",
      task: "rodando bateria de playtest para achar atritos invisíveis",
      skills: ["QA", "playtest", "clareza", "polimento"],
      x: 430,
      y: 258,
      lines: [
        "Se tem um clique que parece morto, eu vou achar.",
        "Jogo polido é o que parece fácil sem ser raso.",
        "Meu trabalho é proteger a sensação final da experiência."
      ]
    },
    {
      id: "zed-engine",
      name: "Zed Engine",
      role: "dev",
      title: "Sistemas, eventos e estabilidade",
      room: "review",
      specialty: "timers, estados de jogo, integração de sistemas e consistência técnica",
      description:
        "Conecta eventos, modais, estados e regras para o PubPaid crescer sem perder estabilidade ou virar um conjunto de peças soltas.",
      task: "checando integração entre estados, mesas e eventos especiais",
      skills: ["sistemas", "estado", "integração", "estabilidade"],
      x: 512,
      y: 304,
      lines: [
        "Quando o salão cresce, os sistemas precisam continuar simples por dentro.",
        "Eu seguro a parte invisível para a fantasia funcionar sem tropeço.",
        "Fluxo técnico limpo evita bugs e também melhora o ritmo do jogo."
      ]
    }
  ],
  spriteProfiles: {
    "codex-nerd": { skin: "#f1c69a", hair: "#1b1d30", accent: "#68f4ff", accessory: "badge", prop: "tablet", hairStyle: "parted" },
    "game-loop": { skin: "#efc29f", hair: "#4f2b70", accent: "#7ef9be", accessory: "headset", prop: "gamepad", hairStyle: "wave" },
    "ui-hud": { skin: "#efbd97", hair: "#20304a", accent: "#ffe07a", accessory: "visor", prop: "phone", hairStyle: "short" },
    "nina-lore": { skin: "#f0c39d", hair: "#7a2846", accent: "#ff9fcb", accessory: "scarf", prop: "clipboard", hairStyle: "wave" },
    "maya-stage": { skin: "#f1c39f", hair: "#182339", accent: "#74f1ff", accessory: "cap", prop: "folder", hairStyle: "short" },
    "ravi-economy": { skin: "#f2c39a", hair: "#5b2c18", accent: "#ffd166", accessory: "tie", prop: "phone", hairStyle: "swept" },
    "luna-audio": { skin: "#efbc92", hair: "#f06ea8", accent: "#b392ff", accessory: "bow", prop: "phone", hairStyle: "bob" },
    "pixo-fx": { skin: "#f0bb92", hair: "#f59e0b", accent: "#a78bfa", accessory: "visor", prop: "wand", hairStyle: "spiky" },
    "nika-render": { skin: "#efbc92", hair: "#1f243e", accent: "#ff6fbe", accessory: "glasses", prop: "stylus", hairStyle: "wave" },
    "otto-physics": { skin: "#efc39d", hair: "#1a1f2f", accent: "#74f1ff", accessory: "headset", prop: "toolkit", hairStyle: "short" },
    "gabi-avatar": { skin: "#f2c39e", hair: "#7f3a2d", accent: "#ffb86b", accessory: "glasses", prop: "book", hairStyle: "wave" },
    "tami-qa": { skin: "#f2c198", hair: "#d8d4f8", accent: "#78e08f", accessory: "glasses", prop: "clipboard", hairStyle: "bun" },
    "zed-engine": { skin: "#f0c4a2", hair: "#ffffff", accent: "#74f1ff", accessory: "headset", prop: "toolkit", hairStyle: "short" }
  }
};
