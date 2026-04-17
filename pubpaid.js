(function () {
  const STORAGE_KEY = "pubpaid_arcade_state_v3";
  const TUTORIAL_SESSION_KEY = "pubpaid_demo_tutorial_seen_v1";
  const STARTER_COINS = 100;
  const DEMO_STAKES = [2, 5, 10, 20, 30, 40, 50, 100];
  const HISTORY_LIMIT = 12;
  const WORLD = { width: 960, height: 640 };
  const SCENE_HINTS = {
    exterior: "na frente do pub",
    interior: "dentro do salao"
  };

  const PALETTES = {
    neon: {
      label: "Neon hacker",
      skin: "#f8c79c",
      hair: "#66ecff",
      shirt: "#ff67b5",
      jacket: "#2f244d",
      pants: "#181522",
      accent: "#fff4d6",
      background: "#120d24"
    },
    cowboy: {
      label: "Cowboy digital",
      skin: "#f4c59f",
      hair: "#f5c96b",
      shirt: "#72d8ff",
      jacket: "#48301d",
      pants: "#121118",
      accent: "#fff4d6",
      background: "#20130d"
    },
    lounge: {
      label: "Lounge futurista",
      skin: "#ffd4b3",
      hair: "#80e092",
      shirt: "#7f81ff",
      jacket: "#1a243f",
      pants: "#15111f",
      accent: "#effcff",
      background: "#0f1929"
    },
    street: {
      label: "Street glitch",
      skin: "#f6c09f",
      hair: "#ff7a6a",
      shirt: "#70ebff",
      jacket: "#32161f",
      pants: "#140f17",
      accent: "#fff1dc",
      background: "#1a1019"
    }
  };

  const TABLE_META = {
    pool: {
      label: "Sinuca Real",
      shortLabel: "sinuca",
      description: "A mesa clássica para quem gosta de precisão, calma e uma boa disputa.",
      sceneCopy: "A mesa está livre. Mire com calma e veja se a noite começa bem por aqui.",
      stakes: DEMO_STAKES
    },
    checkers: {
      label: "Damas Pixel",
      shortLabel: "damas",
      description: "Uma disputa mais estratégica, daquelas que prendem atenção em silêncio.",
      sceneCopy: "O tabuleiro está pronto. Escolha suas jogadas e leia o ritmo da casa.",
      stakes: DEMO_STAKES
    },
    cards21: {
      label: "21 do Bar",
      shortLabel: "21",
      description: "Cartas, leitura de risco e aquela dúvida entre pedir mais uma ou parar.",
      sceneCopy: "As cartas já estão na mesa. Agora é você quem decide até onde vai.",
      stakes: DEMO_STAKES
    },
    poker: {
      label: "Poker da Mesa Redonda",
      shortLabel: "poker",
      description: "Draw poker em rodada curta: segure as cartas certas, troque o resto e veja quem fechou a melhor mão.",
      sceneCopy: "A mesa de poker está pronta. Escolha o que segurar, puxe novas cartas e dispute a melhor combinação.",
      stakes: DEMO_STAKES
    },
    dicecups: {
      label: "Copos e Dados",
      shortLabel: "copos",
      description: "Uma mesa para blefe, leitura de clima e um pouco de ousadia.",
      sceneCopy: "Os copos escondem a resposta. Confie no seu palpite e veja no que dá.",
      stakes: DEMO_STAKES
    },
    slots: {
      label: "Caça-Níqueis Neon",
      shortLabel: "maquina",
      description: "Uma maquina solo com alavanca, tres rolos e série curta de giros para quem quer arrancar mais de uma rodada da noite.",
      sceneCopy: "A cabine está piscando. Agora a aposta abre uma série curta, não só um giro isolado.",
      stakes: DEMO_STAKES,
      isSolo: true
    },
    roulette: {
      label: "Roleta Alta",
      shortLabel: "roleta",
      description: "Cada lado gira em série curta. Quem vencer mais giros leva a mesa.",
      sceneCopy: "A roleta está pronta para uma melhor de 3. O maior placar fecha a noite.",
      stakes: DEMO_STAKES
    }
  };

  const HOUSE_OPPONENTS = {
    pool: {
      name: "Nina Cue",
      archetype: "lounge",
      bio: "Lê a mesa com calma e costuma decidir tudo no detalhe."
    },
    checkers: {
      name: "Rex Square",
      archetype: "street",
      bio: "Vê a jogada antes e raramente entrega espaço fácil."
    },
    cards21: {
      name: "Luna Deck",
      archetype: "cowboy",
      bio: "Sabe a hora de pedir mais uma e a hora de parar."
    },
    poker: {
      name: "Otto River",
      archetype: "street",
      bio: "Joga fechado, segura cartas fortes e quase nunca entrega a leitura da mão."
    },
    dicecups: {
      name: "Maya Cups",
      archetype: "neon",
      bio: "Gosta de blefar pouco e acertar por margem curta."
    },
    slots: {
      name: "Maquina 8-Bit",
      archetype: "neon",
      bio: "Uma cabine da casa que paga rápido quando os simbolos se alinham."
    },
    roulette: {
      name: "Dante Giro",
      archetype: "lounge",
      bio: "Gosta de confiar em uma rodada so e levar no numero mais alto."
    }
  };

  const DRINK_CATALOG = [
    {
      id: "cafe-do-corredor",
      name: "Cafe do Corredor",
      price: 8,
      goodChance: 0.04,
      badChance: 0.02,
      flavor: "Ligado no 220. Quase nao muda a rodada, mas as vezes devolve o foco."
    },
    {
      id: "neon-fizz",
      name: "Neon Fizz",
      price: 16,
      goodChance: 0.06,
      badChance: 0.02,
      flavor: "Refresco brilhante com sorte curta. Bom para tentar uma respirada da casa."
    },
    {
      id: "whisky-8bit",
      name: "Whisky 8-Bit",
      price: 28,
      goodChance: 0.09,
      badChance: 0.03,
      flavor: "Madeira, gelo e um pouco mais de fe no detalhe final."
    },
    {
      id: "ouro-da-casa",
      name: "Ouro da Casa",
      price: 48,
      goodChance: 0.12,
      badChance: 0.03,
      flavor: "O gole premium do salao. Ainda sutil, mas puxa a aleatoriedade mais para o seu lado."
    },
    {
      id: "constelacao-reserva",
      name: "Constelacao Reserva",
      price: 78,
      goodChance: 0.15,
      badChance: 0.04,
      flavor: "A garrafa cara da noite: chance pequena, mas a melhor do cardapio para cair em boa sorte."
    }
  ];

  const VISUAL_UPGRADES = [
    {
      id: "neon-outline",
      name: "Contorno Neon",
      price: 22,
      description: "Adiciona um brilho ciano em volta do personagem dentro do salao."
    },
    {
      id: "gold-jacket",
      name: "Jaqueta Dourada",
      price: 36,
      description: "Troca detalhes do figurino por acentos dourados mais chamativos."
    },
    {
      id: "vip-title",
      name: "Tag VIP",
      price: 52,
      description: "Mostra uma plaquinha VIP no nome do personagem e deixa a presenca mais premium."
    },
    {
      id: "arcade-shades",
      name: "Oculos Arcade",
      price: 26,
      description: "Coloca um visor escuro no avatar para deixar a entrada mais estilosa."
    },
    {
      id: "lucky-hat",
      name: "Chapeu Lucky",
      price: 31,
      description: "Adiciona um chapeu claro no sprite e reforca o visual de jogador da noite."
    }
  ];

  const INTERIOR_NPC_BLUEPRINTS = [
    {
      id: "bia-lounge",
      name: "Bia Lounge",
      archetype: "lounge",
      x: 360,
      y: 248,
      zone: { x: 344, y: 236, w: 32, h: 24 },
      behavior: "fixed",
      facing: "down",
      prop: "drink",
      lines: [
        "No 21, pare no 18 se a mao vier limpa.",
        "A cantora ajuda mais quem ja perdeu uma rodada.",
        "Blefe curto funciona melhor nos copos.",
        "Nao gaste tudo cedo. O pub vira depois."
      ]
    },
    {
      id: "duda-check",
      name: "Duda Check",
      archetype: "neon",
      x: 434,
      y: 520,
      zone: { x: 420, y: 508, w: 30, h: 22 },
      behavior: "fixed",
      facing: "down",
      prop: "drink",
      lines: [
        "Damas premia paciencia. Nao corra para virar dama.",
        "Aposta baixa compra mais leitura de mesa.",
        "Revanche boa nasce depois de derrota curta."
      ]
    },
    {
      id: "tito-copo",
      name: "Tito Copo",
      archetype: "cowboy",
      x: 824,
      y: 330,
      zone: { x: 808, y: 316, w: 28, h: 24 },
      behavior: "fixed",
      facing: "left",
      prop: "drink",
      lines: [
        "Nos copos, o centro costuma mentir menos.",
        "Bebida ajuda pouco. Palpite ruim continua ruim.",
        "Se a rodada alongar, a casa entrega sinais.",
        "Olhe o ritmo antes de subir a entrada."
      ]
    },
    {
      id: "rex-barra",
      name: "Rex Barra",
      archetype: "street",
      x: 318,
      y: 518,
      zone: { x: 280, y: 490, w: 86, h: 46 },
      behavior: "wander",
      facing: "right",
      prop: "drink",
      lines: [
        "O poker cresce quando voce segura so o necessario.",
        "Slot paga mais quando voce aguenta a serie curta.",
        "Entrada alta sem leitura vira presente pra casa."
      ]
    },
    {
      id: "garcom-vito",
      name: "Vito Garcom",
      archetype: "cowboy",
      x: 706,
      y: 186,
      zone: { x: 700, y: 178, w: 16, h: 14 },
      behavior: "fixed",
      facing: "down",
      prop: "bottle",
      role: "bartender",
      lines: [
        "Bebida da sorte existe, mas so muda detalhe.",
        "Se equipar visual, o salao sente sua presenca.",
        "Quer lobby rapido? Eu abro qualquer mesa daqui."
      ]
    },
    {
      id: "lito-copos",
      name: "Lito Copos",
      archetype: "lounge",
      x: 764,
      y: 186,
      zone: { x: 756, y: 180, w: 14, h: 12 },
      behavior: "fixed",
      facing: "down",
      prop: "glasses",
      role: "tips",
      lines: [
        "Sinuca pede forca menor. Mesa cheia espalha melhor.",
        "No caca-niqueis, fruta repetida vale mais que sino solto.",
        "Poker forte troca no maximo tres. Ganancia desmonta a mao.",
        "Roleta boa e serie. Nao trate um giro como final."
      ]
    },
    {
      id: "nina-bar",
      name: "Nina Bar",
      archetype: "lounge",
      x: 658,
      y: 214,
      zone: { x: 636, y: 206, w: 54, h: 22 },
      behavior: "wander",
      facing: "right",
      prop: "drink",
      lines: [
        "A jukebox nao ganha por voce, mas muda seu ritmo.",
        "Se o pub acalmar, aproveite para subir a aposta."
      ]
    }
  ];

  const INTERIOR_DANCE_COUPLES = [
    {
      id: "dance-couple-a",
      x: 742,
      y: 154,
      left: "lounge",
      right: "cowboy",
      glow: "#ff62bd"
    },
    {
      id: "dance-couple-b",
      x: 794,
      y: 188,
      left: "neon",
      right: "street",
      glow: "#70ebff"
    }
  ];

  const EXTERIOR_WALK_ZONES = [
    { x: 0, y: 500, w: 960, h: 140 },
    { x: 392, y: 396, w: 176, h: 118 }
  ];

  const INTERIOR_BLOCKS = [
    { x: 24, y: 76, w: 196, h: 146 },
    { x: 242, y: 72, w: 348, h: 132 },
    { x: 624, y: 72, w: 194, h: 132 },
    { x: 776, y: 74, w: 168, h: 152 },
    { x: 22, y: 220, w: 228, h: 164 },
    { x: 412, y: 190, w: 220, h: 178 },
    { x: 736, y: 260, w: 208, h: 152 },
    { x: 18, y: 398, w: 230, h: 166 },
    { x: 296, y: 418, w: 92, h: 154 },
    { x: 552, y: 418, w: 24, h: 154 },
    { x: 680, y: 462, w: 170, h: 112 },
    { x: 840, y: 420, w: 104, h: 170 }
  ];

  const INTERACTIONS = {
    exterior: [
      {
        id: "front-door",
        type: "door",
        label: "Entrada principal",
        venueKey: "door",
        x: 480,
        y: 430,
        radius: 86
      }
    ],
    interior: [
      {
        id: "pool",
        type: "game",
        gameId: "pool",
        label: TABLE_META.pool.label,
        venueKey: "pool",
        x: 126,
        y: 170,
        radius: 78
      },
      {
        id: "checkers",
        type: "game",
        gameId: "checkers",
        label: TABLE_META.checkers.label,
        venueKey: "checkers",
        x: 118,
        y: 292,
        radius: 82
      },
      {
        id: "cards21",
        type: "game",
        gameId: "cards21",
        label: TABLE_META.cards21.label,
        venueKey: "cards21",
        x: 424,
        y: 495,
        radius: 86
      },
      {
        id: "poker",
        type: "game",
        gameId: "poker",
        label: TABLE_META.poker.label,
        venueKey: "poker",
        x: 306,
        y: 494,
        radius: 82
      },
      {
        id: "dicecups",
        type: "game",
        gameId: "dicecups",
        label: TABLE_META.dicecups.label,
        venueKey: "dicecups",
        x: 836,
        y: 320,
        radius: 84
      },
      {
        id: "slots",
        type: "game",
        gameId: "slots",
        label: TABLE_META.slots.label,
        venueKey: "slots",
        x: 648,
        y: 330,
        radius: 80
      },
      {
        id: "roulette",
        type: "game",
        gameId: "roulette",
        label: TABLE_META.roulette.label,
        venueKey: "roulette",
        x: 560,
        y: 494,
        radius: 82
      },
      {
        id: "stage",
        type: "stage",
        label: "Cantora do palco",
        venueKey: "stage",
        x: 860,
        y: 150,
        radius: 92
      },
      {
        id: "bartender-shop",
        type: "shop",
        label: "Garcom do bar",
        venueKey: "shop",
        x: 708,
        y: 186,
        radius: 98
      },
      {
        id: "waiter-tips",
        type: "tips",
        label: "Garcom dos copos",
        venueKey: "waiter",
        x: 764,
        y: 186,
        radius: 84
      },
      {
        id: "jukebox",
        type: "jukebox",
        label: "Jukebox",
        venueKey: "jukebox",
        x: 854,
        y: 506,
        radius: 80
      },
      {
        id: "back-door",
        type: "exit",
        label: "Porta do salao",
        venueKey: "door",
        x: 480,
        y: 592,
        radius: 78
      }
    ]
  };

  const refs = {
    sceneCanvas: document.querySelector("[data-scene-canvas]"),
    sceneTitle: document.querySelector("[data-scene-title]"),
    sceneHint: document.querySelector("[data-scene-hint]"),
    sceneNearby: document.querySelector("[data-scene-nearby]"),
    sceneNearbyNote: document.querySelector("[data-scene-nearby-note]"),
    scenePrompt: document.querySelector("[data-scene-prompt]"),
    sceneDescription: document.querySelector("[data-scene-description]"),
    hudCoins: document.querySelector("[data-hud-coins]"),
    avatarCanvas: document.querySelector("[data-avatar-canvas]"),
    profileName: document.querySelector("[data-profile-name]"),
    profileRole: document.querySelector("[data-profile-role]"),
    profileMotto: document.querySelector("[data-profile-motto]"),
    statCoins: document.querySelector("[data-stat-coins]"),
    statWins: document.querySelector("[data-stat-wins]"),
    statLosses: document.querySelector("[data-stat-losses]"),
    statBest: document.querySelector("[data-stat-best]"),
    profileUpgrades: document.querySelector("[data-profile-upgrades]"),
    focusTitle: document.querySelector("[data-focus-title]"),
    focusCopy: document.querySelector("[data-focus-copy]"),
    focusMeta: document.querySelector("[data-focus-meta]"),
    focusScene: document.querySelector("[data-focus-scene]"),
    focusStakes: document.querySelector("[data-focus-stakes]"),
    focusAction: document.querySelector("[data-focus-action]"),
    historyList: document.querySelector("[data-history-list]"),
    audioButtons: Array.from(document.querySelectorAll("[data-audio-toggle]")),
    openTutorialButtons: Array.from(document.querySelectorAll("[data-open-tutorial]")),
    openProfileButtons: Array.from(document.querySelectorAll("[data-open-profile]")),
    resetButtons: Array.from(document.querySelectorAll("[data-reset-demo]")),
    touchMoveButtons: Array.from(document.querySelectorAll("[data-touch-move]")),
    touchActionButtons: Array.from(document.querySelectorAll("[data-touch-action]")),
    venueCards: Array.from(document.querySelectorAll("[data-venue-card]")),
    profileModal: document.querySelector("[data-profile-modal]"),
    profileForm: document.querySelector("[data-profile-form]"),
    profileFeedback: document.querySelector("[data-profile-feedback]"),
    doorModal: document.querySelector("[data-door-modal]"),
    doorChoiceButtons: Array.from(document.querySelectorAll("[data-door-choice]")),
    badEndingModal: document.querySelector("[data-bad-ending-modal]"),
    badEndingCanvas: document.querySelector("[data-bad-ending-canvas]"),
    restartBadEndingButton: document.querySelector("[data-restart-bad-ending]"),
    tutorialModal: document.querySelector("[data-tutorial-modal]"),
    tutorialCanvas: document.querySelector("[data-tutorial-canvas]"),
    gameModal: document.querySelector("[data-game-modal]"),
    gameKicker: document.querySelector("[data-game-kicker]"),
    gameTitle: document.querySelector("[data-game-title]"),
    gameSubtitle: document.querySelector("[data-game-subtitle]"),
    gameHost: document.querySelector("[data-game-host]"),
    shopModal: document.querySelector("[data-shop-modal]"),
    shopHost: document.querySelector("[data-shop-host]")
  };

  const sceneCtx = refs.sceneCanvas?.getContext("2d");
  if (sceneCtx) sceneCtx.imageSmoothingEnabled = false;
  const badEndingCtx = refs.badEndingCanvas?.getContext("2d");
  if (badEndingCtx) badEndingCtx.imageSmoothingEnabled = false;
  const tutorialCtx = refs.tutorialCanvas?.getContext("2d");
  if (tutorialCtx) tutorialCtx.imageSmoothingEnabled = false;

  const images = {
    exterior: new Image(),
    interior: new Image()
  };

  const runtime = {
    scene: "exterior",
    prompt: null,
    notes: [],
    noteTimer: 0,
    npcs: [],
    npcBubbleTimer: 0,
    npcBubbles: [],
    singerBursts: [],
    activeGame: null,
    keys: new Set(),
    touchMove: "",
    lastFrame: performance.now(),
    rafId: 0,
    message: {
      text: "",
      expiresAt: 0
    },
    badEndingStartedAt: 0,
    badEndingGame: {
      active: false,
      status: "idle",
      lane: 1,
      targetLane: 1,
      speed: 160,
      boost: 0,
      distance: 0,
      obstacleTimer: 0,
      obstacles: [],
      catchMeter: 0.22,
      hitFlash: 0,
      lastCreditLossAt: 0
    },
    tutorialStartedAt: 0,
    gameTimer: null,
    profileEntryMode: false,
    poolRefs: {
      canvas: null,
      ctx: null,
      meter: null,
      pointerInside: false
    },
    player: {
      x: 480,
      y: 596,
      facing: "up",
      walkFrame: 0,
      walkClock: 0,
      moving: false,
      path: [],
      pendingInteraction: null
    },
    audio: {
      enabled: false,
      ctx: null,
      timer: null,
      step: 0
    }
  };

  let state = loadState();

  function createInitialState() {
    return {
      profile: {
        registered: false,
        name: "",
        archetype: "neon",
        motto: "",
        favorite: "pool",
        bonusClaimed: false
      },
      wallet: {
        coins: 0,
        wins: 0,
        losses: 0,
        bestWin: 0
      },
      shop: {
        activeDrinkId: "",
        drinkInventory: {},
        ownedUpgrades: []
      },
      secrets: {
        singerCharm: 0
      },
      history: []
    };
  }

  function loadState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return createInitialState();
      const parsed = JSON.parse(raw);
      return {
        profile: {
          ...createInitialState().profile,
          ...(parsed?.profile || {})
        },
        wallet: {
          ...createInitialState().wallet,
          ...(parsed?.wallet || {})
        },
        shop: {
          ...createInitialState().shop,
          ...(parsed?.shop || {}),
          drinkInventory: {
            ...createInitialState().shop.drinkInventory,
            ...(parsed?.shop?.drinkInventory || {})
          },
          ownedUpgrades: Array.isArray(parsed?.shop?.ownedUpgrades) ? parsed.shop.ownedUpgrades.slice(0, 12) : []
        },
        secrets: {
          ...createInitialState().secrets,
          ...(parsed?.secrets || {})
        },
        history: Array.isArray(parsed?.history) ? parsed.history.slice(0, HISTORY_LIMIT) : []
      };
    } catch (error) {
      return createInitialState();
    }
  }

  function saveState() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function init() {
    preloadImages().then(() => {
      runtime.npcs = createInteriorNpcs();
      resetScenePosition();
      fillProfileForm();
      renderAll();
      bindEvents();
      runtime.lastFrame = performance.now();
      runtime.rafId = window.requestAnimationFrame(loop);
      scheduleTutorialIntro();
    });
  }

  function scheduleTutorialIntro() {
    if (!shouldAutoOpenTutorial()) return;
    window.setTimeout(() => {
      if (
        refs.tutorialModal?.hidden === false ||
        refs.profileModal.hidden === false ||
        refs.doorModal.hidden === false ||
        refs.badEndingModal.hidden === false ||
        refs.gameModal.hidden === false ||
        refs.shopModal?.hidden === false
      ) {
        return;
      }
      openTutorialModal();
    }, 260);
  }

  function shouldAutoOpenTutorial() {
    try {
      return window.sessionStorage.getItem(TUTORIAL_SESSION_KEY) !== "1";
    } catch (_error) {
      return true;
    }
  }

  function rememberTutorialSeen() {
    try {
      window.sessionStorage.setItem(TUTORIAL_SESSION_KEY, "1");
    } catch (_error) {
      // ignore storage failures
    }
  }

  function preloadImages() {
    return Promise.all([
      loadImage(images.exterior, "./assets/pubpaid-exterior-v2.png"),
      loadImage(images.interior, "./assets/pubpaid-interior-v2.png")
    ]);
  }

  function loadImage(image, src) {
    return new Promise((resolve) => {
      image.onload = resolve;
      image.onerror = resolve;
      image.src = src;
    });
  }

  function bindEvents() {
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    document.addEventListener("click", handleClick);
    window.addEventListener("blur", clearPressedDirections);
    refs.profileForm?.addEventListener("submit", handleProfileSubmit);

    refs.touchMoveButtons.forEach((button) => {
      const direction = button.dataset.touchMove;
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        runtime.touchMove = direction || "";
      });
      button.addEventListener("pointerup", () => {
        runtime.touchMove = "";
      });
      button.addEventListener("pointercancel", () => {
        runtime.touchMove = "";
      });
      button.addEventListener("pointerleave", () => {
        runtime.touchMove = "";
      });
    });

    refs.touchActionButtons.forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        triggerInteraction();
      });
    });

    refs.sceneCanvas?.addEventListener("click", handleSceneCanvasClick);
  }

  function handleKeyDown(event) {
    if (event.repeat) return;

    if (refs.badEndingModal?.hidden === false) {
      if (handleBadEndingKey(event.key)) {
        event.preventDefault();
        return;
      }
    }

    if (event.key === "Escape") {
      if (refs.tutorialModal?.hidden === false) {
        closeModal("tutorial");
      } else if (!refs.profileModal.hidden) {
        closeModal("profile");
      } else if (!refs.doorModal.hidden) {
        closeModal("door");
      } else if (!refs.badEndingModal.hidden) {
        closeModal("bad-ending");
      } else if (!refs.gameModal.hidden) {
        closeGameModal();
      } else if (refs.shopModal?.hidden === false) {
        closeShopModal();
      }
      return;
    }

    if (
      refs.tutorialModal?.hidden === false ||
      refs.profileModal.hidden === false ||
      refs.doorModal.hidden === false ||
      refs.badEndingModal.hidden === false ||
      refs.gameModal.hidden === false ||
      refs.shopModal?.hidden === false
    ) {
      if (event.key === " " && activeGameNeedsSpace()) {
        event.preventDefault();
      }
    }

    if (event.key === "e" || event.key === "E" || event.key === "Enter") {
      if (
        !refs.tutorialModal.hidden ||
        !refs.profileModal.hidden ||
        !refs.doorModal.hidden ||
        !refs.badEndingModal.hidden ||
        !refs.gameModal.hidden ||
        refs.shopModal?.hidden === false
      ) return;
      event.preventDefault();
      triggerInteraction();
      return;
    }

    if (event.key === " " && activeGameNeedsSpace()) {
      event.preventDefault();
      if (runtime.activeGame?.id === "cards21" && runtime.activeGame.screen === "playing") {
        handleCardsAction("hit");
      }
      return;
    }

    const direction = keyToDirection(event.key);
    if (direction) {
      runtime.keys.add(direction);
      event.preventDefault();
    }
  }

  function handleKeyUp(event) {
    const direction = keyToDirection(event.key);
    if (direction) {
      runtime.keys.delete(direction);
      event.preventDefault();
    }
  }

  function handleClick(event) {
    const profileTrigger = event.target.closest("[data-open-profile]");
    if (profileTrigger) {
      openProfileModal();
      return;
    }

    const audioTrigger = event.target.closest("[data-audio-toggle]");
    if (audioTrigger) {
      toggleMusic();
      return;
    }

    const tutorialTrigger = event.target.closest("[data-open-tutorial]");
    if (tutorialTrigger) {
      openTutorialModal();
      return;
    }

    const resetTrigger = event.target.closest("[data-reset-demo]");
    if (resetTrigger) {
      resetDemo();
      return;
    }

    const closeModalTrigger = event.target.closest("[data-close-modal]");
    if (closeModalTrigger) {
      const name = closeModalTrigger.dataset.closeModal;
      if (name === "profile") closeModal("profile");
      if (name === "door") closeModal("door");
      if (name === "bad-ending") closeModal("bad-ending");
      if (name === "tutorial") closeModal("tutorial");
      if (name === "game") closeGameModal();
      if (name === "shop") closeShopModal();
      return;
    }

    const doorChoice = event.target.closest("[data-door-choice]");
    if (doorChoice) {
      handleDoorChoice(doorChoice.dataset.doorChoice || "");
      return;
    }

    if (event.target.closest("[data-restart-bad-ending]")) {
      resetBadEndingGame();
      runtime.badEndingStartedAt = performance.now();
      return;
    }

    const focusAction = event.target.closest("[data-focus-action]");
    if (focusAction) {
      triggerInteraction();
      return;
    }

    const venueCard = event.target.closest("[data-venue-card]");
    if (venueCard) {
      handleVenueShortcut(venueCard.dataset.venueCard || "");
      return;
    }

    const stakeButton = event.target.closest("[data-game-stake]");
    if (stakeButton && runtime.activeGame?.screen === "lobby") {
      runtime.activeGame.stake = clampMoney(stakeButton.dataset.gameStake);
      renderGameModal();
      return;
    }

    if (event.target.closest("[data-start-game]")) {
      startActiveGame();
      return;
    }

    if (event.target.closest("[data-close-finished]")) {
      closeGameModal(true);
      return;
    }

    if (event.target.closest("[data-rematch-game]")) {
      rematchCurrentGame();
      return;
    }

    if (event.target.closest("[data-abandon-game]")) {
      abandonActiveGame();
      return;
    }

    const shopBuy = event.target.closest("[data-shop-buy]");
    if (shopBuy) {
      handleShopBuy(shopBuy.dataset.shopBuy, shopBuy.dataset.shopType || "");
      return;
    }

    const shopDrink = event.target.closest("[data-shop-drink]");
    if (shopDrink) {
      activateDrink(shopDrink.dataset.shopDrink || "");
      return;
    }

    const quickTable = event.target.closest("[data-open-table]");
    if (quickTable) {
      openTableFromShop(quickTable.dataset.openTable || "");
      return;
    }

    const checkersCell = event.target.closest("[data-checkers-cell]");
    if (checkersCell) {
      handleCheckersClick(
        clampInteger(checkersCell.dataset.row),
        clampInteger(checkersCell.dataset.col)
      );
      return;
    }

    if (event.target.closest("[data-cards-action='hit']")) {
      handleCardsAction("hit");
      return;
    }

    if (event.target.closest("[data-cards-action='stand']")) {
      handleCardsAction("stand");
      return;
    }

    const pokerToggle = event.target.closest("[data-poker-toggle]");
    if (pokerToggle) {
      handlePokerToggle(clampInteger(pokerToggle.dataset.pokerToggle));
      return;
    }

    if (event.target.closest("[data-poker-draw]")) {
      handlePokerDraw();
      return;
    }

    const diceButton = event.target.closest("[data-dice-guess]");
    if (diceButton) {
      handleDiceGuess(clampInteger(diceButton.dataset.diceGuess));
      return;
    }

    if (event.target.closest("[data-dice-next]")) {
      advanceDiceRound();
      return;
    }

    if (event.target.closest("[data-slot-spin]")) {
      handleSlotsSpin();
      return;
    }

    if (event.target.closest("[data-slot-next]")) {
      advanceSlotsRound();
      return;
    }

    if (event.target.closest("[data-roulette-spin]")) {
      handleRouletteSpin();
      return;
    }

    if (event.target.closest("[data-roulette-next]")) {
      advanceRouletteRound();
      return;
    }
  }

  function handleBadEndingKey(key) {
    if (!runtime.badEndingGame.active || runtime.badEndingGame.status !== "running") {
      if ((key === "Enter" || key === " ") && refs.badEndingModal?.hidden === false) {
        resetBadEndingGame();
        runtime.badEndingStartedAt = performance.now();
        return true;
      }
      return false;
    }

    if (key === "ArrowLeft" || key === "a" || key === "A") {
      runtime.badEndingGame.targetLane = Math.max(0, runtime.badEndingGame.targetLane - 1);
      return true;
    }
    if (key === "ArrowRight" || key === "d" || key === "D") {
      runtime.badEndingGame.targetLane = Math.min(3, runtime.badEndingGame.targetLane + 1);
      return true;
    }
    if (key === "ArrowUp" || key === "w" || key === "W" || key === " ") {
      runtime.badEndingGame.boost = Math.min(0.9, runtime.badEndingGame.boost + 0.45);
      runtime.badEndingGame.speed = Math.min(220, runtime.badEndingGame.speed + 18);
      return true;
    }
    return false;
  }

  function handleSceneCanvasClick(event) {
    if (
      refs.tutorialModal.hidden === false ||
      refs.profileModal.hidden === false ||
      refs.doorModal.hidden === false ||
      refs.badEndingModal.hidden === false ||
      refs.gameModal.hidden === false ||
      refs.shopModal?.hidden === false
    ) {
      return;
    }

    const point = getCanvasPoint(event, refs.sceneCanvas);
    const interaction = getInteractionAtCanvasPoint(point.x, point.y);
    if (!interaction) {
      queuePlayerWalk(point.x, point.y);
      return;
    }

    if (runtime.scene === "interior") {
      const standPoint = getInteractionStandPoint(interaction);
      if (!standPoint || !queuePlayerWalk(standPoint.x, standPoint.y, interaction)) {
        return;
      }
      runtime.prompt = interaction;
      renderSceneHud();
      return;
    }

    runtime.prompt = interaction;
    renderSceneHud();
    triggerInteraction(interaction);
  }

  function activeGameNeedsSpace() {
    return runtime.activeGame?.id === "cards21" && runtime.activeGame?.screen === "playing";
  }

  function clearPressedDirections() {
    runtime.keys.clear();
    runtime.touchMove = "";
  }

  function keyToDirection(key) {
    if (key === "ArrowUp" || key === "w" || key === "W") return "up";
    if (key === "ArrowDown" || key === "s" || key === "S") return "down";
    if (key === "ArrowLeft" || key === "a" || key === "A") return "left";
    if (key === "ArrowRight" || key === "d" || key === "D") return "right";
    return "";
  }

  function loop(now) {
    const delta = Math.min((now - runtime.lastFrame) / 1000, 0.033);
    runtime.lastFrame = now;

    updateScene(delta, now);
    renderScene(now);
    renderSceneHud();

    if (runtime.activeGame?.id === "pool" && runtime.activeGame.screen === "playing") {
      updatePoolGame(delta);
      drawPoolTable();
      updatePoolHud();
    }

    if (!refs.badEndingModal.hidden) {
      updateBadEndingGame(delta, now);
      renderBadEndingScene(now);
    }

    if (refs.tutorialModal?.hidden === false) {
      renderTutorialScene(now);
    }

    runtime.rafId = window.requestAnimationFrame(loop);
  }

  function updateScene(delta, now) {
    updateStageNotes(delta);
    updateInteriorNpcs(delta);
    updateNpcBubbles(delta);
    updateSingerBursts(delta);

    if (
      !refs.tutorialModal.hidden ||
      !refs.profileModal.hidden ||
      !refs.doorModal.hidden ||
      !refs.badEndingModal.hidden ||
      !refs.gameModal.hidden ||
      refs.shopModal?.hidden === false
    ) {
      runtime.player.moving = false;
      return;
    }

    const move = getMoveVector();
    const speed = runtime.scene === "exterior" ? 128 : 134;
    const usingManualMove = move.x !== 0 || move.y !== 0;
    runtime.player.moving = usingManualMove;

    if (usingManualMove) {
      clearPlayerWalkPath();
      const velocityX = (move.x * speed * delta);
      const velocityY = (move.y * speed * delta);
      tryMovePlayer(velocityX, velocityY);
      runtime.player.walkClock += delta;
      if (runtime.player.walkClock >= 0.12) {
        runtime.player.walkClock = 0;
        runtime.player.walkFrame = (runtime.player.walkFrame + 1) % 2;
      }
    } else if (updatePlayerWalkPath(delta, speed)) {
      runtime.player.moving = true;
      runtime.player.walkClock += delta;
      if (runtime.player.walkClock >= 0.12) {
        runtime.player.walkClock = 0;
        runtime.player.walkFrame = (runtime.player.walkFrame + 1) % 2;
      }
    } else {
      runtime.player.walkClock = 0;
      runtime.player.walkFrame = 0;
    }

    runtime.prompt = runtime.player.pendingInteraction || getNearestInteraction();

    if (runtime.message.expiresAt && now >= runtime.message.expiresAt) {
      runtime.message.text = "";
      runtime.message.expiresAt = 0;
    }
  }

  function updateStageNotes(delta) {
    if (runtime.scene !== "interior") {
      runtime.notes = [];
      runtime.noteTimer = 0;
      return;
    }

    runtime.noteTimer -= delta;
    if (runtime.noteTimer <= 0) {
      runtime.noteTimer = 0.32;
      runtime.notes.push({
        x: 834 + Math.random() * 46,
        y: 135 + Math.random() * 24,
        vy: 22 + Math.random() * 10,
        drift: (Math.random() - 0.5) * 14,
        life: 1.2,
        color: Math.random() > 0.5 ? "#70ebff" : "#ffca6b"
      });
    }

    runtime.notes = runtime.notes
      .map((note) => ({
        ...note,
        x: note.x + note.drift * delta,
        y: note.y - note.vy * delta,
        life: note.life - delta
      }))
      .filter((note) => note.life > 0);
  }

  function getMoveVector() {
    const source = runtime.touchMove || Array.from(runtime.keys).join(",");
    const vector = { x: 0, y: 0 };

    if (source.includes("up")) {
      vector.y -= 1;
      runtime.player.facing = "up";
    }
    if (source.includes("down")) {
      vector.y += 1;
      runtime.player.facing = "down";
    }
    if (source.includes("left")) {
      vector.x -= 1;
      runtime.player.facing = "left";
    }
    if (source.includes("right")) {
      vector.x += 1;
      runtime.player.facing = "right";
    }

    if (vector.x !== 0 && vector.y !== 0) {
      const scale = Math.SQRT1_2;
      vector.x *= scale;
      vector.y *= scale;
    }

    return vector;
  }

  function tryMovePlayer(deltaX, deltaY) {
    const nextX = runtime.player.x + deltaX;
    if (canStandAt(nextX, runtime.player.y)) runtime.player.x = nextX;

    const nextY = runtime.player.y + deltaY;
    if (canStandAt(runtime.player.x, nextY)) runtime.player.y = nextY;
  }

  function canStandAt(x, y) {
    const feet = getFeetRect(x, y);
    if (runtime.scene === "exterior") {
      return EXTERIOR_WALK_ZONES.some((zone) => rectInside(feet, zone));
    }

    if (feet.x < 32 || feet.x + feet.w > 928 || feet.y < 88 || feet.y + feet.h > 620) {
      return false;
    }

    return !INTERIOR_BLOCKS.some((block) => rectsOverlap(feet, softenInteriorBlock(block)));
  }

  function softenInteriorBlock(block) {
    const insetX = Math.max(3, Math.min(14, Math.floor(block.w * 0.16)));
    const insetTop = Math.max(4, Math.min(12, Math.floor(block.h * 0.12)));
    const insetBottom = Math.max(3, Math.min(10, Math.floor(block.h * 0.08)));
    const safeWidth = Math.max(10, block.w - insetX * 2);
    const safeHeight = Math.max(10, block.h - insetTop - insetBottom);

    return {
      x: block.x + insetX,
      y: block.y + insetTop,
      w: safeWidth,
      h: safeHeight
    };
  }

  function findNearestWalkablePoint(x, y) {
    const clampedX = Math.max(44, Math.min(916, x));
    const clampedY = Math.max(102, Math.min(606, y));
    if (canStandAt(clampedX, clampedY)) return { x: clampedX, y: clampedY };

    for (let radius = 12; radius <= 180; radius += 12) {
      for (let step = 0; step < 16; step += 1) {
        const angle = (Math.PI * 2 * step) / 16;
        const tryX = clampedX + Math.cos(angle) * radius;
        const tryY = clampedY + Math.sin(angle) * radius;
        if (canStandAt(tryX, tryY)) {
          return { x: tryX, y: tryY };
        }
      }
    }

    return null;
  }

  function getSceneWalkBounds() {
    if (runtime.scene === "exterior") {
      return {
        minX: 36,
        maxX: WORLD.width - 36,
        minY: 84,
        maxY: WORLD.height - 36
      };
    }

    return {
      minX: 44,
      maxX: 916,
      minY: 102,
      maxY: 606
    };
  }

  function hasWalkLine(fromX, fromY, toX, toY) {
    const distance = Math.hypot(toX - fromX, toY - fromY);
    const steps = Math.max(1, Math.ceil(distance / 10));
    for (let index = 1; index <= steps; index += 1) {
      const progress = index / steps;
      const sampleX = fromX + (toX - fromX) * progress;
      const sampleY = fromY + (toY - fromY) * progress;
      if (!canStandAt(sampleX, sampleY)) {
        return false;
      }
    }
    return true;
  }

  function findNearestGridWalkablePoint(x, y, step = 24) {
    const bounds = getSceneWalkBounds();
    const baseX = Math.round(x / step) * step;
    const baseY = Math.round(y / step) * step;

    for (let radius = 0; radius <= 6; radius += 1) {
      for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
        for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
          if (Math.max(Math.abs(offsetX), Math.abs(offsetY)) !== radius) continue;
          const candidateX = Math.max(bounds.minX, Math.min(bounds.maxX, baseX + offsetX * step));
          const candidateY = Math.max(bounds.minY, Math.min(bounds.maxY, baseY + offsetY * step));
          if (canStandAt(candidateX, candidateY)) {
            return { x: candidateX, y: candidateY };
          }
        }
      }
    }

    return null;
  }

  function buildWalkPath(targetX, targetY) {
    const target = findNearestWalkablePoint(targetX, targetY);
    if (!target) return [];

    const start = {
      x: runtime.player.x,
      y: runtime.player.y
    };
    if (Math.hypot(target.x - start.x, target.y - start.y) <= 6) {
      return [];
    }

    if (hasWalkLine(start.x, start.y, target.x, target.y)) {
      return [target];
    }

    const step = 24;
    const startNode = findNearestGridWalkablePoint(start.x, start.y, step);
    const targetNode = findNearestGridWalkablePoint(target.x, target.y, step);
    if (!startNode || !targetNode) {
      return [target];
    }

    const open = [startNode];
    const keyOf = (point) => `${Math.round(point.x)}:${Math.round(point.y)}`;
    const startKey = keyOf(startNode);
    const targetKey = keyOf(targetNode);
    const cameFrom = new Map();
    const gScore = new Map([[startKey, 0]]);
    const fScore = new Map([[startKey, Math.hypot(targetNode.x - startNode.x, targetNode.y - startNode.y)]]);
    const queued = new Set([startKey]);
    const directions = [
      { x: step, y: 0, cost: step },
      { x: -step, y: 0, cost: step },
      { x: 0, y: step, cost: step },
      { x: 0, y: -step, cost: step },
      { x: step, y: step, cost: step * Math.SQRT2 },
      { x: step, y: -step, cost: step * Math.SQRT2 },
      { x: -step, y: step, cost: step * Math.SQRT2 },
      { x: -step, y: -step, cost: step * Math.SQRT2 }
    ];
    const bounds = getSceneWalkBounds();

    while (open.length) {
      open.sort(
        (left, right) => (fScore.get(keyOf(left)) ?? Infinity) - (fScore.get(keyOf(right)) ?? Infinity)
      );
      const current = open.shift();
      const currentKey = keyOf(current);
      queued.delete(currentKey);

      if (currentKey === targetKey) {
        const reversed = [];
        let traceKey = currentKey;
        while (traceKey && traceKey !== startKey) {
          const [traceX, traceY] = traceKey.split(":").map(Number);
          reversed.push({ x: traceX, y: traceY });
          traceKey = cameFrom.get(traceKey) || "";
        }

        const path = reversed.reverse();
        if (!path.length || path[path.length - 1].x !== target.x || path[path.length - 1].y !== target.y) {
          path.push(target);
        }
        return smoothWalkPath(path, start);
      }

      for (const direction of directions) {
        const nextX = current.x + direction.x;
        const nextY = current.y + direction.y;
        if (nextX < bounds.minX || nextX > bounds.maxX || nextY < bounds.minY || nextY > bounds.maxY) {
          continue;
        }
        if (!canStandAt(nextX, nextY) || !hasWalkLine(current.x, current.y, nextX, nextY)) {
          continue;
        }

        const neighbor = { x: nextX, y: nextY };
        const neighborKey = keyOf(neighbor);
        const tentativeG = (gScore.get(currentKey) ?? Infinity) + direction.cost;
        if (tentativeG >= (gScore.get(neighborKey) ?? Infinity)) {
          continue;
        }

        cameFrom.set(neighborKey, currentKey);
        gScore.set(neighborKey, tentativeG);
        fScore.set(
          neighborKey,
          tentativeG + Math.hypot(targetNode.x - neighbor.x, targetNode.y - neighbor.y)
        );
        if (!queued.has(neighborKey)) {
          open.push(neighbor);
          queued.add(neighborKey);
        }
      }
    }

    return [target];
  }

  function smoothWalkPath(path, origin) {
    if (!path.length) return [];

    const smooth = [];
    let anchor = origin;
    let index = 0;
    while (index < path.length) {
      let farthest = index;
      for (let probe = index; probe < path.length; probe += 1) {
        if (!hasWalkLine(anchor.x, anchor.y, path[probe].x, path[probe].y)) {
          break;
        }
        farthest = probe;
      }

      smooth.push(path[farthest]);
      anchor = path[farthest];
      index = farthest + 1;
    }

    return smooth;
  }

  function clearPlayerWalkPath() {
    runtime.player.path = [];
    runtime.player.pendingInteraction = null;
  }

  function queuePlayerWalk(targetX, targetY, pendingInteraction = null) {
    const path = buildWalkPath(targetX, targetY);
    if (!path.length) {
      runtime.player.pendingInteraction = null;
      if (pendingInteraction) {
        runtime.prompt = pendingInteraction;
        triggerInteraction(pendingInteraction);
      }
      return true;
    }

    runtime.player.path = path;
    runtime.player.pendingInteraction = pendingInteraction;
    return true;
  }

  function updatePlayerWalkPath(delta, speed) {
    if (!runtime.player.path.length) {
      return false;
    }

    while (runtime.player.path.length) {
      const waypoint = runtime.player.path[0];
      const dx = waypoint.x - runtime.player.x;
      const dy = waypoint.y - runtime.player.y;
      const distance = Math.hypot(dx, dy);

      if (distance <= 5) {
        runtime.player.x = waypoint.x;
        runtime.player.y = waypoint.y;
        runtime.player.path.shift();
        continue;
      }

      if (Math.abs(dx) >= Math.abs(dy)) {
        runtime.player.facing = dx >= 0 ? "right" : "left";
      } else {
        runtime.player.facing = dy >= 0 ? "down" : "up";
      }

      const step = Math.min(distance, speed * delta);
      const beforeX = runtime.player.x;
      const beforeY = runtime.player.y;
      tryMovePlayer((dx / distance) * step, (dy / distance) * step);
      const movedDistance = Math.hypot(runtime.player.x - beforeX, runtime.player.y - beforeY);
      if (movedDistance <= 0.2) {
        clearPlayerWalkPath();
        return false;
      }
      return true;
    }

    const pendingInteraction = runtime.player.pendingInteraction;
    clearPlayerWalkPath();
    if (pendingInteraction) {
      runtime.prompt = pendingInteraction;
      triggerInteraction(pendingInteraction);
    }
    return false;
  }

  function getInteractionStandPoint(interaction) {
    const offsets = {
      pool: { x: 0, y: 56 },
      checkers: { x: 0, y: 58 },
      cards21: { x: 0, y: 62 },
      poker: { x: 0, y: 62 },
      dicecups: { x: 0, y: 58 },
      slots: { x: 0, y: 58 },
      roulette: { x: 0, y: 58 },
      stage: { x: -54, y: 36 },
      "bartender-shop": { x: -18, y: 46 },
      "waiter-tips": { x: -22, y: 46 },
      jukebox: { x: -40, y: 34 },
      exit: { x: 0, y: 44 }
    };
    const offset = offsets[interaction.id] || { x: 0, y: 54 };
    return findNearestWalkablePoint(interaction.x + offset.x, interaction.y + offset.y);
  }

  function getFeetRect(x, y) {
    return {
      x: x - 9,
      y: y - 10,
      w: 18,
      h: 10
    };
  }

  function rectInside(a, b) {
    return a.x >= b.x && a.y >= b.y && a.x + a.w <= b.x + b.w && a.y + a.h <= b.y + b.h;
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function getNearestInteraction() {
    const list = INTERACTIONS[runtime.scene] || [];
    let nearest = null;
    let nearestDistance = Infinity;

    list.forEach((interaction) => {
      const distance = Math.hypot(runtime.player.x - interaction.x, runtime.player.y - interaction.y);
      if (distance <= interaction.radius && distance < nearestDistance) {
        nearest = interaction;
        nearestDistance = distance;
      }
    });

    return nearest;
  }

  function getInteractionAtCanvasPoint(x, y) {
    const list = INTERACTIONS[runtime.scene] || [];
    let nearest = null;
    let nearestDistance = Infinity;

    list.forEach((interaction) => {
      const distance = Math.hypot(x - interaction.x, y - interaction.y);
      if (distance <= interaction.radius + 46 && distance < nearestDistance) {
        nearest = interaction;
        nearestDistance = distance;
      }
    });

    return nearest;
  }

  function renderScene(now) {
    if (!sceneCtx || !refs.sceneCanvas) return;

    sceneCtx.clearRect(0, 0, WORLD.width, WORLD.height);

    const background = images[runtime.scene];
    if (background?.naturalWidth) {
      sceneCtx.drawImage(background, 0, 0, WORLD.width, WORLD.height);
    } else {
      sceneCtx.fillStyle = "#05040b";
      sceneCtx.fillRect(0, 0, WORLD.width, WORLD.height);
    }

    drawInteriorLights(now);
    drawDanceCouples(now);
    drawInteractionMarkers(now);
    drawInteriorNpcs();
    drawStageNotes();
    drawNpcBubbles();
    drawSingerBursts();
    drawPlayerLabel();
    drawPlayerSprite(sceneCtx, runtime.player.x - 14, runtime.player.y - 42, 2, runtime.player.facing, runtime.player.walkFrame, getPlayerPalette(), true);
  }

  function drawInteriorLights(now) {
    if (runtime.scene !== "interior") return;

    const pulseA = 0.18 + (Math.sin(now / 240) + 1) * 0.08;
    const pulseB = 0.14 + (Math.sin(now / 320 + 1.4) + 1) * 0.08;
    const pulseC = 0.12 + (Math.sin(now / 270 + 3.1) + 1) * 0.07;

    sceneCtx.save();

    sceneCtx.fillStyle = `rgba(255, 98, 189, ${pulseA.toFixed(3)})`;
    sceneCtx.beginPath();
    sceneCtx.moveTo(720, 92);
    sceneCtx.lineTo(648, 308);
    sceneCtx.lineTo(792, 308);
    sceneCtx.closePath();
    sceneCtx.fill();

    sceneCtx.fillStyle = `rgba(112, 235, 255, ${pulseB.toFixed(3)})`;
    sceneCtx.beginPath();
    sceneCtx.moveTo(824, 96);
    sceneCtx.lineTo(742, 332);
    sceneCtx.lineTo(894, 332);
    sceneCtx.closePath();
    sceneCtx.fill();

    sceneCtx.fillStyle = `rgba(128, 224, 146, ${pulseC.toFixed(3)})`;
    sceneCtx.beginPath();
    sceneCtx.moveTo(894, 102);
    sceneCtx.lineTo(782, 356);
    sceneCtx.lineTo(940, 356);
    sceneCtx.closePath();
    sceneCtx.fill();

    const leds = [
      { x: 650, y: 88, color: "#ff62bd", wave: 0 },
      { x: 690, y: 90, color: "#70ebff", wave: 0.8 },
      { x: 730, y: 86, color: "#80e092", wave: 1.6 },
      { x: 770, y: 90, color: "#ffca6b", wave: 2.4 },
      { x: 810, y: 86, color: "#ff62bd", wave: 3.2 },
      { x: 850, y: 90, color: "#70ebff", wave: 4.0 },
      { x: 890, y: 88, color: "#80e092", wave: 4.8 }
    ];

    leds.forEach((led) => {
      const alpha = 0.45 + (Math.sin(now / 180 + led.wave) + 1) * 0.2;
      sceneCtx.fillStyle = led.color;
      sceneCtx.globalAlpha = alpha;
      sceneCtx.fillRect(led.x, led.y, 12, 4);
      sceneCtx.fillRect(led.x + 2, led.y + 4, 8, 2);
    });

    sceneCtx.globalAlpha = 0.12;
    sceneCtx.fillStyle = "#fff6d8";
    sceneCtx.fillRect(620, 84, 302, 10);
    sceneCtx.restore();
  }

  function drawDanceCouples(now) {
    if (runtime.scene !== "interior") return;

    INTERIOR_DANCE_COUPLES.forEach((couple, index) => {
      const sway = Math.sin(now / 220 + index * 1.7);
      const step = Math.sin(now / 110 + index) > 0 ? 1 : 0;
      const leftX = couple.x - 14 + sway * 4;
      const rightX = couple.x + 14 - sway * 4;
      const baseY = couple.y + Math.cos(now / 260 + index) * 3;

      sceneCtx.save();
      sceneCtx.globalAlpha = 0.24 + (Math.sin(now / 210 + index) + 1) * 0.08;
      sceneCtx.fillStyle = couple.glow;
      sceneCtx.beginPath();
      sceneCtx.ellipse(couple.x, baseY + 6, 38, 16, 0, 0, Math.PI * 2);
      sceneCtx.fill();
      sceneCtx.restore();

      drawPlayerSprite(
        sceneCtx,
        leftX - 14,
        baseY - 42,
        2,
        "right",
        step,
        PALETTES[couple.left] || PALETTES.neon,
        false
      );
      drawPlayerSprite(
        sceneCtx,
        rightX - 14,
        baseY - 42,
        2,
        "left",
        step === 1 ? 0 : 1,
        PALETTES[couple.right] || PALETTES.lounge,
        false
      );

      sceneCtx.save();
      sceneCtx.strokeStyle = "rgba(255, 246, 216, 0.3)";
      sceneCtx.lineWidth = 2;
      sceneCtx.beginPath();
      sceneCtx.moveTo(leftX + 6, baseY - 12);
      sceneCtx.lineTo(rightX - 6, baseY - 12);
      sceneCtx.stroke();
      sceneCtx.restore();
    });
  }

  function drawInteractionMarkers(now) {
    const list = INTERACTIONS[runtime.scene] || [];

    list.forEach((interaction) => {
      const pulse = 1 + Math.sin(now / 180 + interaction.x * 0.01) * 0.12;
      const isFocus = runtime.prompt?.id === interaction.id;
      const color =
        interaction.type === "game"
          ? "#70ebff"
          : interaction.type === "stage"
            ? "#ffca6b"
            : interaction.type === "shop"
              ? "#80e092"
              : interaction.type === "tips"
                ? "#fff0a6"
              : interaction.type === "jukebox"
                ? "#ff62bd"
                : "#effcff";

      sceneCtx.save();
      sceneCtx.translate(interaction.x, interaction.y - 34);
      sceneCtx.scale(pulse, pulse);
      sceneCtx.strokeStyle = color;
      sceneCtx.fillStyle = isFocus ? color : "rgba(0,0,0,0.55)";
      sceneCtx.lineWidth = isFocus ? 3 : 2;
      sceneCtx.beginPath();
      sceneCtx.moveTo(0, -12);
      sceneCtx.lineTo(11, 0);
      sceneCtx.lineTo(0, 12);
      sceneCtx.lineTo(-11, 0);
      sceneCtx.closePath();
      sceneCtx.fill();
      sceneCtx.stroke();
      sceneCtx.restore();

      if (isFocus) {
        const label = interaction.label;
        sceneCtx.save();
        sceneCtx.font = "12px Chakra Petch";
        const width = Math.ceil(sceneCtx.measureText(label).width) + 18;
        sceneCtx.fillStyle = "rgba(12, 9, 23, 0.85)";
        sceneCtx.fillRect(interaction.x - width / 2, interaction.y - 76, width, 24);
        sceneCtx.strokeStyle = color;
        sceneCtx.strokeRect(interaction.x - width / 2, interaction.y - 76, width, 24);
        sceneCtx.fillStyle = "#f7f2d5";
        sceneCtx.fillText(label, interaction.x - width / 2 + 9, interaction.y - 59);
        sceneCtx.restore();
      }
    });
  }

  function drawStageNotes() {
    if (runtime.scene !== "interior" || !runtime.notes.length) return;

    runtime.notes.forEach((note) => {
      const alpha = Math.max(0, Math.min(1, note.life));
      sceneCtx.save();
      sceneCtx.globalAlpha = alpha;
      sceneCtx.fillStyle = note.color;
      sceneCtx.fillRect(note.x, note.y, 6, 6);
      sceneCtx.fillRect(note.x + 4, note.y - 10, 4, 12);
      sceneCtx.fillRect(note.x + 8, note.y - 12, 6, 4);
      sceneCtx.restore();
    });
  }

  function drawPlayerLabel() {
    const label = state.profile.registered
      ? `${state.profile.name}${hasUpgrade("vip-title") ? " VIP" : ""}`
      : "visitante";
    sceneCtx.save();
    sceneCtx.font = "12px Chakra Petch";
    const width = Math.ceil(sceneCtx.measureText(label).width) + 16;
    sceneCtx.fillStyle = "rgba(10, 8, 18, 0.82)";
    sceneCtx.fillRect(runtime.player.x - width / 2, runtime.player.y - 56, width, 20);
    sceneCtx.fillStyle = "#f7f2d5";
    sceneCtx.fillText(label, runtime.player.x - width / 2 + 8, runtime.player.y - 41);
    sceneCtx.restore();
  }

  function getPlayerPalette() {
    const base = PALETTES[state.profile.archetype] || PALETTES.neon;
    if (!hasUpgrade("gold-jacket")) return base;
    return {
      ...base,
      jacket: "#7b5b12",
      accent: "#ffd66b"
    };
  }

  function drawPlayerSprite(ctx, x, y, scale, facing, walkFrame, palette, isPlayer) {
    const pixels = [];

    for (let row = 0; row < 2; row += 1) {
      for (let col = 3; col < 9; col += 1) {
        pixels.push({ x: col, y: row, color: palette.hair });
      }
    }

    if (isPlayer && hasUpgrade("lucky-hat")) {
      for (let col = 2; col < 10; col += 1) {
        pixels.push({ x: col, y: 0, color: "#f7f2d5" });
      }
      for (let col = 4; col < 8; col += 1) {
        pixels.push({ x: col, y: -1, color: "#f0cf6d" });
      }
    }

    for (let row = 2; row < 6; row += 1) {
      for (let col = 3; col < 9; col += 1) {
        pixels.push({ x: col, y: row, color: palette.skin });
      }
    }

    pixels.push({ x: 4, y: 3, color: palette.accent });
    pixels.push({ x: 7, y: 3, color: palette.accent });

    if (isPlayer && hasUpgrade("arcade-shades")) {
      pixels.push({ x: 4, y: 3, color: "#0d0d14" });
      pixels.push({ x: 5, y: 3, color: "#0d0d14" });
      pixels.push({ x: 6, y: 3, color: "#0d0d14" });
      pixels.push({ x: 7, y: 3, color: "#0d0d14" });
    }

    for (let row = 6; row < 11; row += 1) {
      for (let col = 2; col < 10; col += 1) {
        pixels.push({ x: col, y: row, color: palette.shirt });
      }
    }

    for (let row = 7; row < 11; row += 1) {
      pixels.push({ x: 1, y: row, color: palette.jacket });
      pixels.push({ x: 10, y: row, color: palette.jacket });
    }

    pixels.push({ x: 4, y: 9, color: palette.accent });
    pixels.push({ x: 7, y: 9, color: palette.accent });

    if (isPlayer && hasUpgrade("vip-title")) {
      pixels.push({ x: 5, y: 7, color: "#ffd66b" });
      pixels.push({ x: 6, y: 7, color: "#ffd66b" });
      pixels.push({ x: 5, y: 8, color: "#ff62bd" });
      pixels.push({ x: 6, y: 8, color: "#ff62bd" });
    }

    for (let row = 11; row < 16; row += 1) {
      for (let col = 3; col < 6; col += 1) {
        pixels.push({ x: col, y: row, color: palette.pants });
      }
      for (let col = 6; col < 9; col += 1) {
        pixels.push({ x: col, y: row, color: palette.pants });
      }
    }

    const feetOffset = walkFrame === 0 ? 0 : 1;
    pixels.push({ x: 3 - feetOffset, y: 16, color: "#0b0a10" });
    pixels.push({ x: 4 - feetOffset, y: 16, color: "#0b0a10" });
    pixels.push({ x: 7 + feetOffset, y: 16, color: "#0b0a10" });
    pixels.push({ x: 8 + feetOffset, y: 16, color: "#0b0a10" });

    ctx.save();
    if (isPlayer && hasUpgrade("neon-outline")) {
      ctx.shadowColor = "rgba(112, 235, 255, 0.55)";
      ctx.shadowBlur = 16;
    }
    ctx.fillStyle = "rgba(0,0,0,0.38)";
    ctx.fillRect(x + 4 * scale, y + 34, 14 * scale, 4);

    pixels.forEach((pixel) => {
      let shiftX = 0;
      if (facing === "left") shiftX = -1;
      if (facing === "right") shiftX = 1;
      ctx.fillStyle = pixel.color;
      ctx.fillRect((x + pixel.x * scale) + shiftX, y + pixel.y * scale, scale, scale);
    });

    if (isPlayer && hasUpgrade("vip-title")) {
      const badgeX = x + 20 * scale;
      const badgeY = y + 10 * scale;
      ctx.fillStyle = "#ff62bd";
      ctx.fillRect(badgeX, badgeY, 10, 6);
      ctx.fillStyle = "#ffd66b";
      ctx.fillRect(badgeX + 2, badgeY + 2, 6, 2);
    }
    ctx.restore();
  }

  function createInteriorNpcs() {
    return INTERIOR_NPC_BLUEPRINTS.map((blueprint) => ({
      ...blueprint,
      targetX: blueprint.x,
      targetY: blueprint.y,
      facing: blueprint.facing || "down",
      walkFrame: 0,
      walkClock: 0,
      pause: randomBetween(0.4, 1.4),
      speed: randomBetween(24, 38)
    }));
  }

  function findNpcById(npcId) {
    return runtime.npcs.find((npc) => npc.id === npcId) || null;
  }

  function pushNpcBubble(npcId, text, life = 4.2) {
    if (!text) return;
    runtime.npcBubbles.push({
      id: `${npcId}-${Date.now()}-${Math.round(Math.random() * 999)}`,
      npcId,
      text,
      life
    });
    runtime.npcBubbles = runtime.npcBubbles.slice(-4);
  }

  function pickNpcLine(npc) {
    if (!npc || !Array.isArray(npc.lines) || !npc.lines.length) return "";
    return npc.lines[Math.floor(Math.random() * npc.lines.length)] || "";
  }

  function primeNpcBubbles() {
    if (runtime.scene !== "interior" || !runtime.npcs.length) return;
    runtime.npcBubbles = [];
    ["lito-copos", "bia-lounge"].forEach((npcId) => {
      const npc = findNpcById(npcId);
      const text = pickNpcLine(npc);
      if (text) pushNpcBubble(npcId, text, 4.8);
    });
  }

  function updateInteriorNpcs(delta) {
    if (runtime.scene !== "interior" || !runtime.npcs.length) return;

    runtime.npcBubbleTimer -= delta;

    runtime.npcs.forEach((npc) => {
      if (npc.behavior === "fixed") {
        npc.walkFrame = 0;
        npc.walkClock = 0;
        return;
      }

      npc.pause -= delta;
      if (npc.pause <= 0 && Math.hypot(npc.targetX - npc.x, npc.targetY - npc.y) < 6) {
        npc.targetX = randomBetween(npc.zone.x, npc.zone.x + npc.zone.w);
        npc.targetY = randomBetween(npc.zone.y, npc.zone.y + npc.zone.h);
        npc.pause = randomBetween(1.1, 2.8);
      }

      const dx = npc.targetX - npc.x;
      const dy = npc.targetY - npc.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 2) {
        const step = Math.min(distance, npc.speed * delta);
        npc.x += (dx / distance) * step;
        npc.y += (dy / distance) * step;
        npc.walkClock += delta;
        npc.walkFrame = npc.walkClock >= 0.18 ? (npc.walkFrame + 1) % 2 : npc.walkFrame;
        if (npc.walkClock >= 0.18) npc.walkClock = 0;

        if (Math.abs(dx) > Math.abs(dy)) {
          npc.facing = dx > 0 ? "right" : "left";
        } else {
          npc.facing = dy > 0 ? "down" : "up";
        }
      } else {
        npc.walkFrame = 0;
        npc.walkClock = 0;
      }
    });

    if (runtime.npcBubbleTimer <= 0) {
      runtime.npcBubbleTimer = randomBetween(2.6, 4.8);
      spawnNpcBubble();
    }
  }

  function spawnNpcBubble() {
    if (!runtime.npcs.length || runtime.scene !== "interior") return;
    const npc = runtime.npcs[Math.floor(Math.random() * runtime.npcs.length)];
    const text = pickNpcLine(npc);
    if (!text) return;
    pushNpcBubble(npc.id, text, 4.1);
  }

  function updateNpcBubbles(delta) {
    runtime.npcBubbles = runtime.npcBubbles
      .map((bubble) => ({
        ...bubble,
        life: bubble.life - delta
      }))
      .filter((bubble) => bubble.life > 0);
  }

  function drawInteriorNpcs() {
    if (runtime.scene !== "interior") return;

    runtime.npcs
      .slice()
      .sort((a, b) => a.y - b.y)
      .forEach((npc) => {
        drawPlayerSprite(
          sceneCtx,
          npc.x - 14,
          npc.y - 42,
          2,
          npc.facing,
          npc.walkFrame,
          PALETTES[npc.archetype] || PALETTES.neon,
          false
        );
        drawNpcProp(npc);
      });
  }

  function drawNpcProp(npc) {
    sceneCtx.save();
    const polishOffset = Math.sin(performance.now() / 180) * 2;
    if (npc.prop === "drink") {
      sceneCtx.fillStyle = "#fff1c8";
      sceneCtx.fillRect(npc.x + 8, npc.y - 18, 6, 10);
      sceneCtx.fillStyle = "#ff8f62";
      sceneCtx.fillRect(npc.x + 8, npc.y - 12, 6, 4);
      sceneCtx.fillStyle = "rgba(255,255,255,0.45)";
      sceneCtx.fillRect(npc.x + 9, npc.y - 17, 2, 2);
    } else if (npc.prop === "bottle") {
      sceneCtx.fillStyle = "#7de4b8";
      sceneCtx.fillRect(npc.x + 10, npc.y - 20, 4, 12);
      sceneCtx.fillStyle = "#d6f8ef";
      sceneCtx.fillRect(npc.x + 11, npc.y - 24, 2, 4);
    } else if (npc.prop === "glasses") {
      sceneCtx.fillStyle = "rgba(220, 248, 255, 0.65)";
      sceneCtx.fillRect(npc.x + 6, npc.y - 20, 5, 8);
      sceneCtx.fillRect(npc.x + 13, npc.y - 20, 5, 8);
      sceneCtx.fillStyle = "#d9f2ff";
      sceneCtx.fillRect(npc.x + 7, npc.y - 21, 3, 1);
      sceneCtx.fillRect(npc.x + 14, npc.y - 21, 3, 1);
      sceneCtx.fillStyle = "#ffca6b";
      sceneCtx.fillRect(npc.x + 10 + polishOffset, npc.y - 17, 6, 3);
      sceneCtx.fillStyle = "rgba(255,255,255,0.35)";
      sceneCtx.fillRect(npc.x + 8, npc.y - 18, 1, 4);
      sceneCtx.fillRect(npc.x + 15, npc.y - 18, 1, 4);
    }
    sceneCtx.restore();
  }

  function drawNpcBubbles() {
    if (runtime.scene !== "interior" || !runtime.npcBubbles.length) return;
    let stackY = -999;

    runtime.npcBubbles.forEach((bubble) => {
      const npc = runtime.npcs.find((entry) => entry.id === bubble.npcId);
      if (!npc) return;

      const alpha = Math.max(0, Math.min(1, bubble.life / 0.6, 1));
      sceneCtx.save();
      sceneCtx.globalAlpha = Math.min(0.96, bubble.life > 0.8 ? 0.96 : bubble.life / 0.8);
      sceneCtx.font = "12px Chakra Petch";
      const width = Math.min(210, Math.ceil(sceneCtx.measureText(bubble.text).width) + 18);
      let bubbleY = npc.y - 76;
      if (bubbleY > stackY - 24) bubbleY = stackY - 26;
      stackY = bubbleY;
      sceneCtx.fillStyle = "rgba(8, 7, 18, 0.88)";
      sceneCtx.strokeStyle = alpha > 0.4 ? "rgba(112, 235, 255, 0.55)" : "rgba(255,255,255,0.24)";
      sceneCtx.lineWidth = 1;
      sceneCtx.fillRect(npc.x - width / 2, bubbleY, width, 22);
      sceneCtx.strokeRect(npc.x - width / 2, bubbleY, width, 22);
      sceneCtx.fillStyle = "#f7f2d5";
      sceneCtx.fillText(bubble.text, npc.x - width / 2 + 9, bubbleY + 15);
      sceneCtx.restore();
    });
  }

  function updateSingerBursts(delta) {
    runtime.singerBursts = runtime.singerBursts
      .map((burst) => ({
        ...burst,
        y: burst.y - delta * 18,
        life: burst.life - delta
      }))
      .filter((burst) => burst.life > 0);
  }

  function drawSingerBursts() {
    if (!runtime.singerBursts.length) return;

    runtime.singerBursts.forEach((burst) => {
      const alpha = Math.max(0, Math.min(1, burst.life / 0.9));
      sceneCtx.save();
      sceneCtx.globalAlpha = alpha;
      sceneCtx.fillStyle = "#ff6fae";
      sceneCtx.fillRect(burst.x, burst.y, 8, 6);
      sceneCtx.fillRect(burst.x + 8, burst.y, 8, 6);
      sceneCtx.fillRect(burst.x + 2, burst.y + 4, 12, 6);
      sceneCtx.fillRect(burst.x + 4, burst.y + 8, 8, 4);
      sceneCtx.fillStyle = "#ffd8eb";
      sceneCtx.fillRect(burst.x + 3, burst.y + 1, 2, 2);
      sceneCtx.fillRect(burst.x + 11, burst.y + 1, 2, 2);
      sceneCtx.restore();
    });
  }

  function renderSceneHud() {
    const focus = runtime.prompt || getSceneFallbackFocus();
    const nearbyLabel = runtime.prompt ? runtime.prompt.label : "corredor livre";
    const nearbyNote = runtime.prompt ? getInteractionActionLabel(runtime.prompt) : "circule pelo pub";
    const bundle = getFocusBundle(focus);

    setText(refs.sceneTitle, SCENE_HINTS[runtime.scene]);
    setText(refs.sceneHint, runtime.scene === "exterior" ? "a entrada está logo à frente" : "o salão está aberto para você");
    setText(refs.sceneNearby, nearbyLabel);
    setText(refs.sceneNearbyNote, nearbyNote);
    setText(refs.scenePrompt, getWorldPromptText());
    setText(refs.sceneDescription, bundle.description);
    setText(refs.hudCoins, formatCoins(state.wallet.coins));

    setText(refs.focusTitle, bundle.title);
    setText(refs.focusCopy, bundle.copy);
    setText(refs.focusMeta, bundle.meta);
    setText(refs.focusScene, SCENE_HINTS[runtime.scene]);
    renderFocusStakes(focus);

    refs.focusAction.disabled = !runtime.prompt;
    refs.focusAction.textContent = runtime.prompt ? getInteractionButtonText(runtime.prompt) : "Chegue mais perto";

    refs.venueCards.forEach((card) => {
      const key = card.dataset.venueCard;
      card.classList.toggle("is-active", key === bundle.venueKey);
    });
  }

  function getSceneFallbackFocus() {
    if (runtime.scene === "exterior") {
      return {
        label: "Entrada principal",
        venueKey: "door",
        type: "door"
      };
    }

    return {
      label: "Salao principal",
      venueKey: "",
      type: "ambient"
    };
  }

  function getFocusBundle(focus) {
    if (!focus) {
      return {
        title: "Salao principal",
        copy: "Caminhe pelo pub e pare onde a noite parecer mais promissora.",
        meta: "ande pelo salão",
        description: "Mesas, palco e jukebox mudam o clima quando você chega perto.",
        venueKey: ""
      };
    }

    if (focus.type === "door") {
      return {
        title: "Entrada principal",
        copy: state.profile.registered
          ? "A porta está aberta. É só entrar e deixar a noite continuar."
          : "Aqui começa a sua noite no PubPaid, com personagem montado e créditos da casa.",
        meta: state.profile.registered ? "entre no pub" : "comece por aqui",
        description: state.profile.registered
          ? "Sempre que quiser, a entrada leva você de volta ao salão."
          : "Na primeira vez, você escolhe seu estilo e já entra no clima.",
        venueKey: "door"
      };
    }

    if (focus.type === "exit") {
      return {
        title: "Porta do salao",
        copy: "Daqui você volta para a calçada e vê o pub inteiro aceso outra vez.",
        meta: "voltar para fora",
        description: "Quando quiser respirar um pouco, a rua continua logo ali.",
        venueKey: "door"
      };
    }

    if (focus.type === "stage") {
      return {
        title: "Cantora do palco",
        copy: "O palco segura o clima do salão. Quando ela canta, o pub muda de tom.",
        meta: "chamar a cantora",
        description: "A trilha dancante do bar casa com a cantora e deixa a abertura da noite mais viva.",
        venueKey: "stage"
      };
    }

    if (focus.type === "shop") {
      const activeDrink = getActiveDrinkDefinition();
      return {
        title: "Garcom do bar",
        copy: activeDrink
          ? `${activeDrink.name} ja esta pronto para a proxima rodada demo.`
          : "Bebidas com sorte pequena, acessorios do avatar e lobbies das mesas saindo direto do balcao.",
        meta: activeDrink ? "bebida equipada" : "abrir catalogo",
        description: "As bebidas podem puxar um fiapo de sorte ou azar. Os acessorios visuais ficam com voce.",
        venueKey: "shop"
      };
    }

    if (focus.type === "tips") {
      return {
        title: "Garcom dos copos",
        copy: "Ele fica polindo os copos e soltando dicas curtas sobre os segredos do salao.",
        meta: "ouvir dica",
        description: "Boa parte das pistas de fisica, ritmo e leitura das mesas passa primeiro por esse balcao.",
        venueKey: "waiter"
      };
    }

    if (focus.type === "jukebox") {
      return {
        title: "Jukebox",
        copy: "A jukebox muda o clima da noite e deixa o salão mais vivo.",
        meta: runtime.audio.enabled ? "desligar a música" : "ligar a música",
        description: "Se preferir, você também pode controlar o som pelo topo da página.",
        venueKey: "jukebox"
      };
    }

    if (focus.type === "game" && TABLE_META[focus.gameId]) {
      return {
        title: TABLE_META[focus.gameId].label,
        copy: TABLE_META[focus.gameId].sceneCopy,
        meta: "abrir essa mesa",
        description: TABLE_META[focus.gameId].description,
        venueKey: focus.gameId
      };
    }

    return {
      title: focus.label || "Salao principal",
      copy: "Caminhe pelo pub e veja onde a sua noite combina mais.",
      meta: "explorar o salão",
      description: "O pub mistura música, conversa, palco e mesas para todos os ritmos.",
      venueKey: focus.venueKey || ""
    };
  }

  function renderFocusStakes(focus) {
    if (!refs.focusStakes) return;

    if (!focus || focus.type !== "game") {
      refs.focusStakes.innerHTML = "";
      return;
    }

    refs.focusStakes.innerHTML = TABLE_META[focus.gameId].stakes
      .map((stake) => `<span class="pubpaid-game-chip">${formatCoins(stake)} entrada</span>`)
      .join("");
  }

  function getWorldPromptText() {
    if (runtime.message.text) return runtime.message.text;
    if (!runtime.prompt) {
      return runtime.scene === "exterior"
        ? "chegue até a porta principal"
        : "circule pelo salão e escolha o seu próximo passo";
    }

    if (runtime.prompt.type === "door") {
      return state.profile.registered
        ? "pressione E para decidir se entra"
        : "pressione E para começar a sua noite";
    }
    if (runtime.prompt.type === "exit") return "pressione E para voltar para a calçada";
    if (runtime.prompt.type === "stage") return "pressione E para chamar a cantora";
    if (runtime.prompt.type === "shop") return "pressione E para abrir a loja premium";
    if (runtime.prompt.type === "jukebox") {
      return runtime.audio.enabled
        ? "pressione E para desligar a trilha"
        : "pressione E para ligar a trilha";
    }
    if (runtime.prompt.type === "game") return `pressione E para sentar na ${TABLE_META[runtime.prompt.gameId].shortLabel}`;
    return "pressione E para continuar";
  }

  function getInteractionActionLabel(interaction) {
    if (!interaction) return "";
    if (interaction.type === "game") return "mesa pronta";
    if (interaction.type === "stage") return "palco em destaque";
    if (interaction.type === "shop") return "catalogo premium";
    if (interaction.type === "jukebox") return runtime.audio.enabled ? "som no ar" : "som em pausa";
    if (interaction.type === "door") return "entrada";
    if (interaction.type === "exit") return "saída";
    return "por perto";
  }

  function getInteractionButtonText(interaction) {
    if (!interaction) return "Chegue mais perto";
    if (interaction.type === "game") return `Abrir ${TABLE_META[interaction.gameId].label}`;
    if (interaction.type === "stage") return "Chamar cantora";
    if (interaction.type === "shop") return "Abrir loja premium";
    if (interaction.type === "tips") return "Ouvir dica do garcom";
    if (interaction.type === "jukebox") return runtime.audio.enabled ? "Desligar musica" : "Ligar musica";
    if (interaction.type === "door") return state.profile.registered ? "Escolher na porta" : "Começar a noite";
    if (interaction.type === "exit") return "Voltar para fora";
    return "Interagir";
  }

  function setWorldMessage(text, durationMs) {
    runtime.message.text = text;
    runtime.message.expiresAt = performance.now() + durationMs;
  }

  function renderProfile() {
    const registered = state.profile.registered;
    const favorite = TABLE_META[state.profile.favorite];
    setText(refs.profileName, registered ? state.profile.name : "Visitante da calcada");
    setText(
      refs.profileRole,
      registered
        ? `${PALETTES[state.profile.archetype].label}${hasUpgrade("vip-title") ? " VIP" : ""} • ${favorite?.label || "PubPaid"}`
        : "Ainda do lado de fora"
    );
    setText(
      refs.profileMotto,
      registered
        ? state.profile.motto || "Entrou no pub, encontrou sua mesa e deixou a noite seguir."
        : "Chegue até a porta principal para criar seu personagem e começar a noite."
    );

    setText(refs.statCoins, formatCoins(state.wallet.coins));
    setText(refs.statWins, String(state.wallet.wins));
    setText(refs.statLosses, String(state.wallet.losses));
    setText(refs.statBest, formatCoins(state.wallet.bestWin));

    drawAvatarPreview();
    renderProfileLoadout();
  }

  function drawAvatarPreview() {
    const canvas = refs.avatarCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    const palette = getPlayerPalette();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = palette.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(8, 8, canvas.width - 16, canvas.height - 16);
    drawPlayerSprite(ctx, 34, 18, 4, "down", 0, palette, true);
    const activeDrink = getActiveDrinkDefinition();
    if (activeDrink) {
      drawInventorySprite(ctx, 80, 18, "drink", activeDrink.id);
    }
  }

  function renderProfileLoadout() {
    if (!refs.profileUpgrades) return;
    const owned = getOwnedUpgrades();
    const activeDrink = getActiveDrinkDefinition();

    if (!owned.length && !activeDrink) {
      refs.profileUpgrades.innerHTML =
        '<p class="pubpaid-loadout-empty">Nenhum acessorio comprado ainda. Fale com o garcom para liberar o visual do avatar.</p>';
      return;
    }

    const upgradeMarkup = owned
      .map(
        (upgrade) => `
          <article class="pubpaid-loadout-item">
            <span class="pubpaid-loadout-sprite">${renderInventorySpriteMarkup("upgrade", upgrade.id)}</span>
            <span class="pubpaid-loadout-copy">
              <strong>${escapeHtml(upgrade.name)}</strong>
              <small>acessório equipado</small>
            </span>
          </article>
        `
      )
      .join("");
    const activeDrinkMarkup = activeDrink
      ? `
          <article class="pubpaid-loadout-item is-drink">
            <span class="pubpaid-loadout-sprite">${renderInventorySpriteMarkup("drink", activeDrink.id)}</span>
            <span class="pubpaid-loadout-copy">
              <strong>${escapeHtml(activeDrink.name)}</strong>
              <small>bebida ativa da próxima mesa</small>
            </span>
          </article>
        `
      : "";

    refs.profileUpgrades.innerHTML = `
      <p class="pubpaid-loadout-title">avatar equipado</p>
      <div class="pubpaid-loadout-list">
        ${upgradeMarkup}
        ${activeDrinkMarkup}
      </div>
    `;
  }

  function renderHistory() {
    if (!refs.historyList) return;

    if (!state.history.length) {
      refs.historyList.innerHTML =
        '<p class="pubpaid-history-empty">Ainda não tem nenhuma rodada por aqui. Entre no pub e veja onde a sua noite começa.</p>';
      return;
    }

    refs.historyList.innerHTML = state.history
      .slice(0, HISTORY_LIMIT)
      .map((entry) => {
        const resultClass =
          entry.result === "win" ? "is-win" : entry.result === "loss" ? "is-loss" : "is-tie";
        return `
          <article class="pubpaid-history-item ${resultClass}">
            <header>
              <strong>${escapeHtml(entry.title)}</strong>
              <time>${escapeHtml(formatDate(entry.at))}</time>
            </header>
            <p>${escapeHtml(entry.summary)}</p>
            <small>${escapeHtml(entry.amount)} • ${escapeHtml(entry.opponent)}</small>
          </article>
        `;
      })
      .join("");
  }

  function renderShopModal(feedback) {
    if (!refs.shopHost) return;

    const activeDrink = getActiveDrinkDefinition();
    const ownedUpgrades = getOwnedUpgrades();
    const gamesMarkup = Object.entries(TABLE_META)
      .map(
        ([gameId, meta]) => `
          <article class="pubpaid-shop-card pubpaid-shop-shortcut">
            <div class="pubpaid-shop-line">
              <strong>${escapeHtml(meta.label)}</strong>
              <span>${escapeHtml(meta.shortLabel)}</span>
            </div>
            <p>${escapeHtml(meta.description)}</p>
            <div class="pubpaid-card-actions">
              <button class="pubpaid-card-button" type="button" data-open-table="${escapeHtml(gameId)}">
                Abrir lobby
              </button>
            </div>
          </article>
        `
      )
      .join("");

    const drinksMarkup = DRINK_CATALOG.map((drink) => {
      const owned = clampInteger(state.shop.drinkInventory[drink.id]);
      return `
        <article class="pubpaid-shop-card">
          <div class="pubpaid-shop-art">${renderInventorySpriteMarkup("drink", drink.id)}</div>
          <div class="pubpaid-shop-line">
            <strong>${escapeHtml(drink.name)}</strong>
            <span>${escapeHtml(formatCoins(drink.price))}</span>
          </div>
          <p>${escapeHtml(drink.flavor)}</p>
          <div class="pubpaid-shop-meta">
            <span class="pubpaid-game-chip">boa sorte ${Math.round(drink.goodChance * 100)}%</span>
            <span class="pubpaid-game-chip">azar ${Math.round(drink.badChance * 100)}%</span>
            <span class="pubpaid-game-chip">estoque ${owned}</span>
          </div>
          <div class="pubpaid-card-actions">
            <button class="pubpaid-card-button" type="button" data-shop-buy="${escapeHtml(drink.id)}" data-shop-type="drink">
              Comprar
            </button>
            <button class="pubpaid-card-button" type="button" data-shop-drink="${escapeHtml(drink.id)}" ${owned ? "" : "disabled"}>
              Beber agora
            </button>
          </div>
        </article>
      `;
    }).join("");

    const upgradesMarkup = VISUAL_UPGRADES.map((upgrade) => {
      const owned = hasUpgrade(upgrade.id);
      return `
        <article class="pubpaid-shop-card">
          <div class="pubpaid-shop-art">${renderInventorySpriteMarkup("upgrade", upgrade.id)}</div>
          <div class="pubpaid-shop-line">
            <strong>${escapeHtml(upgrade.name)}</strong>
            <span>${escapeHtml(formatCoins(upgrade.price))}</span>
          </div>
          <p>${escapeHtml(upgrade.description)}</p>
          <div class="pubpaid-shop-meta">
            <span class="pubpaid-game-chip">${owned ? "ativo no personagem" : "upgrade permanente"}</span>
          </div>
          <div class="pubpaid-card-actions">
            <button class="pubpaid-card-button" type="button" data-shop-buy="${escapeHtml(upgrade.id)}" data-shop-type="upgrade" ${owned ? "disabled" : ""}>
              ${owned ? "Comprado" : "Comprar upgrade"}
            </button>
          </div>
        </article>
      `;
    }).join("");

    refs.shopHost.innerHTML = `
      <section class="pubpaid-shop-panel">
        <article class="pubpaid-game-box">
          <span class="pubpaid-game-chip">garcom premium</span>
          <h3>Catalogo da loja</h3>
          <p>Bebidas para dar um leve empurrao na sorte da proxima partida, acessorios permanentes para o avatar e atalhos para cada mesa.</p>
          <ul>
            <li>As bebidas sao consumidas quando voce bebe e valem para a proxima partida.</li>
            <li>Quanto mais cara a bebida, maior a chance de bater uma boa sorte.</li>
            <li>Azar tambem existe, mas em impacto pequeno para nao desequilibrar a mesa.</li>
          </ul>
        </article>
        <article class="pubpaid-game-box">
          <div class="pubpaid-game-chip-row">
            <span class="pubpaid-game-chip">saldo ${escapeHtml(formatCoins(state.wallet.coins))}</span>
            <span class="pubpaid-game-chip">${activeDrink ? `na mesa: ${escapeHtml(activeDrink.name)}` : "nenhuma bebida ativa"}</span>
          </div>
          <p>${activeDrink ? "A proxima mesa ja vai carregar a bebida escolhida antes da partida." : "Escolha uma bebida para deixar a proxima rodada com uma pitada de aleatoriedade."}</p>
          <div class="pubpaid-shop-meta">
            ${
              ownedUpgrades.length
                ? ownedUpgrades
                    .map((upgrade) => `<span class="pubpaid-game-chip">${escapeHtml(upgrade.name)}</span>`)
                    .join("")
                : '<span class="pubpaid-game-chip">sem acessorios no avatar</span>'
            }
          </div>
          ${feedback ? `<p class="pubpaid-feedback">${escapeHtml(feedback)}</p>` : ""}
        </article>
      </section>

      <section class="pubpaid-shop-columns">
        <div>
          <p class="pubpaid-eyebrow">bebidas</p>
          <div class="pubpaid-shop-grid">${drinksMarkup}</div>
        </div>
        <div>
          <p class="pubpaid-eyebrow">acessorios de avatar</p>
          <div class="pubpaid-shop-grid">${upgradesMarkup}</div>
        </div>
      </section>

      <section>
        <p class="pubpaid-eyebrow">mesas do garcom</p>
        <div class="pubpaid-shop-grid pubpaid-shop-games-grid">${gamesMarkup}</div>
      </section>
    `;
  }

  function handleShopBuy(itemId, itemType) {
    if (itemType === "drink") {
      const drink = DRINK_CATALOG.find((entry) => entry.id === itemId);
      if (!drink) return;
      if (state.wallet.coins < drink.price) {
        renderShopModal(`Saldo insuficiente para ${drink.name}.`);
        return;
      }
      state.wallet.coins -= drink.price;
      state.shop.drinkInventory[drink.id] = clampInteger(state.shop.drinkInventory[drink.id]) + 1;
      saveState();
      renderAll();
      renderShopModal(`${drink.name} entrou no seu estoque da noite.`);
      return;
    }

    if (itemType === "upgrade") {
      const upgrade = VISUAL_UPGRADES.find((entry) => entry.id === itemId);
      if (!upgrade) return;
      if (hasUpgrade(upgrade.id)) {
        renderShopModal(`${upgrade.name} ja esta ativo no seu personagem.`);
        return;
      }
      if (state.wallet.coins < upgrade.price) {
        renderShopModal(`Saldo insuficiente para ${upgrade.name}.`);
        return;
      }
      state.wallet.coins -= upgrade.price;
      state.shop.ownedUpgrades.push(upgrade.id);
      saveState();
      renderAll();
      renderShopModal(`${upgrade.name} foi liberado e ja aparece no salao.`);
    }
  }

  function activateDrink(drinkId) {
    const drink = DRINK_CATALOG.find((entry) => entry.id === drinkId);
    if (!drink) return;
    const owned = clampInteger(state.shop.drinkInventory[drink.id]);
    if (!owned) {
      renderShopModal("Essa bebida nao esta no seu estoque.");
      return;
    }

    state.shop.drinkInventory[drink.id] = owned - 1;
    state.shop.activeDrinkId = drink.id;
    saveState();
    renderAll();
    renderShopModal(`${drink.name} foi servida. A proxima mesa demo ja vai carregar esse efeito.`);
  }

  function openTableFromShop(gameId) {
    closeShopModal();
    openGameLobby(gameId);
  }

  function renderAudioButtons() {
    refs.audioButtons.forEach((button) => {
      button.textContent = `${button.closest(".pubpaid-tutorial-stage-actions") ? "Musica dancante" : "Musica de bar"}: ${runtime.audio.enabled ? "on" : "off"}`;
    });
  }

  function renderAll() {
    renderProfile();
    renderHistory();
    renderAudioButtons();
    renderSceneHud();
    renderGameModal();
    if (refs.shopModal?.hidden === false) renderShopModal("");
  }

  function fillProfileForm() {
    if (!refs.profileForm) return;
    refs.profileForm.elements.namedItem("name").value = state.profile.name || "";
    refs.profileForm.elements.namedItem("archetype").value = state.profile.archetype || "neon";
    refs.profileForm.elements.namedItem("favorite").value = state.profile.favorite || "pool";
    refs.profileForm.elements.namedItem("motto").value = state.profile.motto || "";
  }

  function openProfileModal() {
    runtime.profileEntryMode = runtime.scene === "exterior" && !state.profile.registered;
    fillProfileForm();
    setText(refs.profileFeedback, "");
    refs.profileModal.hidden = false;
  }

  function openTutorialModal() {
    if (!refs.tutorialModal) return;
    refs.tutorialModal.hidden = false;
    runtime.tutorialStartedAt = performance.now();
    rememberTutorialSeen();
  }

  function closeModal(name) {
    if (name === "tutorial") {
      if (refs.tutorialModal) refs.tutorialModal.hidden = true;
      runtime.tutorialStartedAt = 0;
      return;
    }

    if (name === "profile") {
      refs.profileModal.hidden = true;
      runtime.profileEntryMode = false;
      return;
    }

    if (name === "door") {
      refs.doorModal.hidden = true;
      return;
    }

    if (name === "bad-ending") {
      refs.badEndingModal.hidden = true;
      runtime.badEndingStartedAt = 0;
      runtime.badEndingGame.active = false;
      runtime.badEndingGame.status = "idle";
      runtime.badEndingGame.obstacles = [];
      runtime.badEndingGame.boost = 0;
      return;
    }
  }

  function openShopModal() {
    renderShopModal("");
    if (refs.shopModal) refs.shopModal.hidden = false;
  }

  function closeShopModal() {
    if (refs.shopModal) refs.shopModal.hidden = true;
  }

  function handleProfileSubmit(event) {
    event.preventDefault();
    if (!refs.profileForm) return;

    const formData = new FormData(refs.profileForm);
    const name = String(formData.get("name") || "").trim();
    const archetype = normalizeArchetype(formData.get("archetype"));
    const favorite = normalizeGameId(formData.get("favorite"));
    const motto = String(formData.get("motto") || "").trim();

    if (name.length < 2) {
      setText(refs.profileFeedback, "Escolha um nome curto para entrar no clima da noite.");
      return;
    }

    const firstEntry = !state.profile.bonusClaimed;
    state.profile.registered = true;
    state.profile.name = name;
    state.profile.archetype = archetype;
    state.profile.favorite = favorite;
    state.profile.motto = motto;

    if (firstEntry) {
      state.profile.bonusClaimed = true;
      state.wallet.coins += STARTER_COINS;
    }

    saveState();
    closeModal("profile");
    renderAll();

    if (runtime.scene === "exterior") {
      enterInterior();
    }

    setWorldMessage(
      firstEntry
        ? `${STARTER_COINS} créditos chegaram. Agora a porta do pub está aberta para você.`
        : "Seu personagem foi atualizado e o salão já reconheceu você.",
      2800
    );
  }

  function resetScenePosition() {
    runtime.scene = "exterior";
    runtime.player.x = 480;
    runtime.player.y = 596;
    runtime.player.facing = "up";
    clearPlayerWalkPath();
    runtime.prompt = null;
    runtime.npcBubbles = [];
  }

  function enterInterior() {
    runtime.scene = "interior";
    runtime.player.x = 480;
    runtime.player.y = 604;
    runtime.player.facing = "up";
    clearPlayerWalkPath();
    runtime.prompt = null;
    if (!runtime.npcs.length) runtime.npcs = createInteriorNpcs();
    runtime.npcBubbleTimer = 1.1;
    primeNpcBubbles();
  }

  function enterExterior() {
    runtime.scene = "exterior";
    runtime.player.x = 480;
    runtime.player.y = 596;
    runtime.player.facing = "up";
    clearPlayerWalkPath();
    runtime.prompt = null;
    runtime.npcBubbles = [];
  }

  function openDoorDecision() {
    refs.doorModal.hidden = false;
  }

  function handleDoorChoice(choice) {
    closeModal("door");

    if (choice === "enter") {
      if (!state.profile.registered) {
        openProfileModal();
      } else {
        enterInterior();
        setWorldMessage("A porta abriu e o salão recebeu você.", 2200);
      }
      return;
    }

    if (choice === "retreat") {
      openBadEndingModal();
      setWorldMessage("Você arregou na porta e a vassoura chegou primeiro.", 2600);
    }
  }

  function openBadEndingModal() {
    runtime.badEndingStartedAt = performance.now();
    resetBadEndingGame();
    refs.badEndingModal.hidden = false;
  }

  function resetBadEndingGame() {
    runtime.badEndingGame = {
      active: true,
      status: "running",
      lane: 1,
      targetLane: 1,
      speed: 160,
      boost: 0,
      distance: 0,
      obstacleTimer: 0.6,
      obstacles: [],
      catchMeter: 0.22,
      hitFlash: 0,
      lastCreditLossAt: 0
    };
  }

  function triggerInteraction(forcedInteraction) {
    const interaction = forcedInteraction || runtime.prompt;
    if (!interaction) {
      setWorldMessage(
        runtime.scene === "exterior"
          ? "Chegue até a porta principal para começar."
          : "Chegue mais perto de uma mesa, do palco ou da jukebox.",
        1800
      );
      return;
    }

    if (interaction.type === "door") {
      openDoorDecision();
      return;
    }

    if (interaction.type === "exit") {
      enterExterior();
      setWorldMessage("Você voltou para a calçada e viu o pub inteiro aceso outra vez.", 2200);
      return;
    }

    if (interaction.type === "stage") {
      grantSingerCharm();
      if (!runtime.audio.enabled) toggleMusic(true);
      setWorldMessage("A cantora sorriu, mandou um beijinho e o salão ganhou outro clima.", 2400);
      return;
    }

    if (interaction.type === "shop") {
      if (!state.profile.registered) {
        setWorldMessage("Monte seu personagem primeiro e depois fale com o garcom.", 2200);
        return;
      }
      openShopModal();
      setWorldMessage("O garcom abriu a loja premium do salao.", 2200);
      return;
    }

    if (interaction.type === "tips") {
      const npc = findNpcById("lito-copos");
      const tip = pickNpcLine(npc) || "Mesa boa entrega pista antes de pagar.";
      pushNpcBubble("lito-copos", tip, 4.8);
      setWorldMessage(`Lito diz: ${tip}`, 2600);
      return;
    }

    if (interaction.type === "jukebox") {
      toggleMusic();
      setWorldMessage(
        runtime.audio.enabled
          ? "A jukebox ligou a trilha dancante do bar."
          : "A jukebox deixou o salao em silencio.",
        2200
      );
      return;
    }

    if (interaction.type === "game") {
      if (!state.profile.registered) {
        setWorldMessage("Passe primeiro pela porta e monte seu personagem antes de escolher uma mesa.", 2200);
        return;
      }
      openGameLobby(interaction.gameId);
    }
  }

  function handleVenueShortcut(venueKey) {
    const key = String(venueKey || "").trim();
    if (!key) return;

    if (key === "door") {
      if (runtime.scene === "interior") {
        enterExterior();
        setWorldMessage("Atalho rápido: você voltou para a calçada.", 2200);
      } else {
        openDoorDecision();
        setWorldMessage("Atalho rápido: a decisão da porta já está aberta.", 2200);
      }
      return;
    }

    if (runtime.scene === "exterior") {
      if (!state.profile.registered) {
        openDoorDecision();
        setWorldMessage("Primeiro passe pela porta para começar a noite.", 2200);
        return;
      }
      enterInterior();
    }

    const interaction = findInteractionByVenueKey(key);
    if (!interaction) {
      setWorldMessage("Esse atalho ainda não encontrou um destino dentro do pub.", 2200);
      return;
    }

    movePlayerToInteraction(interaction);
    runtime.prompt = interaction;
    renderSceneHud();

    if (interaction.type === "game") {
      openGameLobby(interaction.gameId);
      setWorldMessage(`Atalho rápido: ${TABLE_META[interaction.gameId].label} já está aberta.`, 2200);
      return;
    }

    if (interaction.type === "stage") {
      grantSingerCharm();
      if (!runtime.audio.enabled) toggleMusic(true);
      setWorldMessage("Atalho rapido: voce foi ao palco e a cantora respondeu com um beijinho.", 2200);
      return;
    }

    if (interaction.type === "shop") {
      openShopModal();
      setWorldMessage("Atalho rapido: o menu premium do garcom ja abriu.", 2200);
      return;
    }

    if (interaction.type === "tips") {
      const npc = findNpcById("lito-copos");
      const tip = pickNpcLine(npc) || "Mesa boa entrega pista antes de pagar.";
      pushNpcBubble("lito-copos", tip, 4.8);
      setWorldMessage(`Atalho rapido: Lito soltou a dica "${tip}"`, 2600);
      return;
    }

    if (interaction.type === "jukebox") {
      toggleMusic();
      setWorldMessage(
        runtime.audio.enabled
          ? "Atalho rápido: a música do bar entrou no ar."
          : "Atalho rápido: a jukebox ficou em silêncio.",
        2200
      );
    }
  }

  function findInteractionByVenueKey(venueKey) {
    const list = INTERACTIONS.interior || [];
    return list.find((interaction) => interaction.venueKey === venueKey) || null;
  }

  function movePlayerToInteraction(interaction) {
    const standPoint = getInteractionStandPoint(interaction);
    if (!standPoint) return;
    runtime.player.x = standPoint.x;
    runtime.player.y = standPoint.y;
    runtime.player.facing = "up";
  }

  function toggleMusic(forceOn) {
    if (forceOn === true && runtime.audio.enabled) return;
    if (!runtime.audio.enabled) {
      startMusic();
    } else if (forceOn !== true) {
      stopMusic();
    }
    renderAudioButtons();
  }

  function grantSingerCharm() {
    state.secrets.singerCharm = Math.min(2, clampInteger(state.secrets.singerCharm) + 1);
    runtime.singerBursts.push({
      x: 836 + Math.random() * 18,
      y: 108 + Math.random() * 12,
      life: 1.1
    });
    runtime.singerBursts = runtime.singerBursts.slice(-4);
    saveState();
  }

  function getBadEndingLaneX(lane) {
    return [142, 258, 382, 500][Math.max(0, Math.min(3, lane))];
  }

  function spawnBadEndingObstacle() {
    const lane = Math.floor(Math.random() * 4);
    const roadLane = lane === 1 || lane === 2;
    const kinds = roadLane ? ["car", "taxi", "cone"] : ["bench", "trash", "post"];
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    runtime.badEndingGame.obstacles.push({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      lane,
      kind,
      y: -60,
      speed: 0.85 + Math.random() * 0.2,
      width: roadLane ? 44 : 26,
      height: roadLane ? 66 : 42,
      hit: false
    });
  }

  function penalizeBadEndingCollision() {
    const game = runtime.badEndingGame;
    game.speed = Math.max(84, game.speed - 34);
    game.catchMeter = Math.min(1, game.catchMeter + 0.16);
    game.hitFlash = 0.55;
  }

  function finishBadEndingCatch() {
    const game = runtime.badEndingGame;
    if (game.status === "caught") return;
    game.status = "caught";
    game.active = false;
    if (game.lastCreditLossAt !== 1) {
      state.wallet.coins = Math.max(0, state.wallet.coins - 1);
      saveState();
      renderAll();
      game.lastCreditLossAt = 1;
    }
    setWorldMessage("A vassoura te acertou. Você perdeu 1 crédito nessa fuga.", 2600);
  }

  function updateBadEndingGame(delta) {
    const game = runtime.badEndingGame;
    if (!game.active || game.status !== "running") return;

    game.boost = Math.max(0, game.boost - delta * 0.85);
    game.speed = Math.min(206, game.speed + delta * (18 + game.boost * 24));
    game.speed = Math.max(82, game.speed - delta * 4);
    game.distance += game.speed * delta;
    game.lane += (game.targetLane - game.lane) * Math.min(1, delta * 10);
    game.obstacleTimer -= delta;
    game.hitFlash = Math.max(0, game.hitFlash - delta);

    if (game.obstacleTimer <= 0) {
      spawnBadEndingObstacle();
      game.obstacleTimer = Math.max(0.36, 1.08 - game.speed / 260);
    }

    const runnerY = 214;
    const runnerLane = Math.round(game.lane);
    game.obstacles.forEach((obstacle) => {
      obstacle.y += game.speed * delta * obstacle.speed;
      const sameLane = obstacle.lane === runnerLane;
      const verticalHit = obstacle.y + obstacle.height > runnerY && obstacle.y < runnerY + 52;
      if (!obstacle.hit && sameLane && verticalHit) {
        obstacle.hit = true;
        penalizeBadEndingCollision();
      }
    });
    game.obstacles = game.obstacles.filter((obstacle) => obstacle.y < 360);

    const pressure = 0.045 + Math.max(0, 142 - game.speed) * 0.0015;
    const relief = Math.max(0, game.speed - 150) * 0.0008;
    game.catchMeter = Math.max(0.08, Math.min(1, game.catchMeter + delta * pressure - delta * relief));

    if (game.catchMeter >= 1) {
      finishBadEndingCatch();
    }
  }

  function drawBadEndingBitmapBackdrop(ctx, canvas, scroll) {
    ctx.fillStyle = "#121826";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#1a2234";
    ctx.fillRect(0, 112, canvas.width, 188);

    for (let x = -((scroll * 0.18) % 68); x < canvas.width + 80; x += 68) {
      fillRect(ctx, x, 84, 22, 28, "#29344b");
      fillRect(ctx, x + 4, 70, 14, 14, "#1e283d");
      fillRect(ctx, x + 6, 92, 4, 6, "#ffe29a");
      fillRect(ctx, x + 14, 92, 4, 6, "#70ebff");
    }

    fillRect(ctx, 0, 188, canvas.width, 112, "#2a313e");
    fillRect(ctx, 110, 188, 64, 112, "#5c6069");
    fillRect(ctx, 470, 188, 64, 112, "#5c6069");
    fillRect(ctx, 174, 188, 296, 112, "#242b37");

    for (let y = -((scroll * 0.5) % 44); y < canvas.height + 44; y += 44) {
      fillRect(ctx, 318, y, 8, 22, "#fff4d6");
    }

    for (let y = -((scroll * 0.7) % 52); y < canvas.height + 52; y += 52) {
      fillRect(ctx, 148, y, 8, 22, "#c9d2df");
      fillRect(ctx, 494, y + 12, 8, 22, "#c9d2df");
    }
  }

  function drawBadEndingObstacle(ctx, obstacle) {
    const x = getBadEndingLaneX(obstacle.lane);
    if (obstacle.kind === "car" || obstacle.kind === "taxi") {
      fillRect(ctx, x - 20, obstacle.y, 40, 62, obstacle.kind === "taxi" ? "#ffca6b" : "#ff6b6b");
      fillRect(ctx, x - 16, obstacle.y + 8, 32, 20, "#70ebff");
      fillRect(ctx, x - 22, obstacle.y + 12, 4, 16, "#fff4d6");
      fillRect(ctx, x + 18, obstacle.y + 12, 4, 16, "#fff4d6");
      fillRect(ctx, x - 16, obstacle.y + 52, 10, 8, "#10131d");
      fillRect(ctx, x + 6, obstacle.y + 52, 10, 8, "#10131d");
      return;
    }

    if (obstacle.kind === "cone") {
      fillRect(ctx, x - 10, obstacle.y + 8, 20, 26, "#ff9f43");
      fillRect(ctx, x - 14, obstacle.y + 30, 28, 8, "#fff4d6");
      return;
    }

    if (obstacle.kind === "bench") {
      fillRect(ctx, x - 14, obstacle.y + 14, 28, 8, "#8b6236");
      fillRect(ctx, x - 12, obstacle.y + 22, 6, 18, "#5c3d24");
      fillRect(ctx, x + 6, obstacle.y + 22, 6, 18, "#5c3d24");
      return;
    }

    if (obstacle.kind === "trash") {
      fillRect(ctx, x - 10, obstacle.y + 8, 20, 24, "#6f86ff");
      fillRect(ctx, x - 12, obstacle.y + 4, 24, 6, "#c9d2df");
      return;
    }

    fillRect(ctx, x - 4, obstacle.y, 8, 36, "#9aa3b5");
    fillRect(ctx, x - 10, obstacle.y, 20, 6, "#ffca6b");
  }

  function drawBadEndingRunner(ctx, x, y, pace) {
    const arm = pace % 2 === 0 ? 0 : 4;
    const leg = pace >= 2 ? 4 : 0;
    fillRect(ctx, x - 14, y, 18, 14, "#f3c59f");
    fillRect(ctx, x - 18, y - 6, 26, 10, "#66ecff");
    fillRect(ctx, x - 18, y + 14, 30, 28, "#70ebff");
    fillRect(ctx, x - 24, y + 18 + arm, 8, 20, "#f3c59f");
    fillRect(ctx, x + 8, y + 14 - arm, 8, 20, "#f3c59f");
    fillRect(ctx, x - 14, y + 42, 8, 28 - leg, "#181522");
    fillRect(ctx, x + 2, y + 42 + leg, 8, 28 - leg, "#181522");
    fillRect(ctx, x - 30, y + 30 + arm, 16, 4, "#fff4d6");
    fillRect(ctx, x + 14, y + 18 - arm, 16, 4, "#fff4d6");
    fillRect(ctx, x - 14, y + 70, 28, 6, "#0b0a10");
  }

  function drawBadEndingWoman(ctx, x, y, swing) {
    fillRect(ctx, x - 12, y, 18, 14, "#f0c2a0");
    fillRect(ctx, x - 16, y - 4, 24, 8, "#6c4a2f");
    fillRect(ctx, x - 16, y + 14, 24, 28, "#ff62bd");
    fillRect(ctx, x - 22, y + 18, 8, 20, "#f0c2a0");
    fillRect(ctx, x + 8, y + 18, 8, 20, "#f0c2a0");
    fillRect(ctx, x - 12, y + 42, 6, 28, "#5f3c2d");
    fillRect(ctx, x + 2, y + 42, 6, 28, "#5f3c2d");
    ctx.save();
    ctx.translate(x + 16, y + 26);
    ctx.rotate(((46 + swing) * Math.PI) / 180);
    fillRect(ctx, 0, -2, 34, 4, "#c99858");
    fillRect(ctx, 26, -4, 14, 8, "#9d7144");
    ctx.restore();
    fillRect(ctx, x - 12, y + 70, 26, 6, "#0b0a10");
  }

  function drawBadEndingHud(ctx, game) {
    ctx.fillStyle = "rgba(8, 10, 18, 0.92)";
    ctx.fillRect(14, 14, 248, 72);
    ctx.fillStyle = "#ffca6b";
    ctx.font = "14px Chakra Petch";
    ctx.fillText("CORRIDA DA VASSOURA", 28, 34);
    ctx.fillStyle = "#f7f2d5";
    ctx.font = "12px Chakra Petch";
    ctx.fillText("Desvie dos carros e nao perca velocidade.", 28, 54);
    ctx.fillText(`Velocidade: ${Math.round(game.speed)}  |  Distancia: ${Math.round(game.distance / 10)}m`, 28, 72);

    ctx.fillStyle = "rgba(8, 10, 18, 0.92)";
    ctx.fillRect(390, 14, 236, 72);
    ctx.fillStyle = "#ff6b6b";
    ctx.fillText("PRESSAO DA VASSOURA", 404, 34);
    ctx.fillStyle = "#2a313e";
    ctx.fillRect(404, 48, 182, 12);
    ctx.fillStyle = game.catchMeter > 0.72 ? "#ff6b6b" : "#ffca6b";
    ctx.fillRect(404, 48, 182 * game.catchMeter, 12);
    ctx.fillStyle = "#f7f2d5";
    ctx.fillText(`Creditos em risco: 1`, 404, 76);
  }

  function drawBadEndingStatusOverlay(ctx, canvas, game) {
    if (game.status === "running") return;
    ctx.fillStyle = "rgba(8, 10, 18, 0.8)";
    ctx.fillRect(96, 102, canvas.width - 192, 96);
    ctx.fillStyle = "#ff6b6b";
    ctx.font = "20px 'Press Start 2P'";
    ctx.fillText("ELA TE ALCANCOU", 118, 138);
    ctx.fillStyle = "#f7f2d5";
    ctx.font = "14px Chakra Petch";
    ctx.fillText("A vassoura bateu e voce perdeu 1 credito nessa corrida.", 118, 168);
    ctx.fillText("Aperte Enter ou clique em correr de novo para reiniciar.", 118, 188);
  }

  function renderBadEndingScene(now) {
    if (!badEndingCtx || !refs.badEndingCanvas) return;

    const ctx = badEndingCtx;
    const canvas = refs.badEndingCanvas;
    const game = runtime.badEndingGame;
    const elapsed = runtime.badEndingStartedAt ? (now - runtime.badEndingStartedAt) / 1000 : 0;
    const scroll = game.distance * 0.9;
    const runnerX = getBadEndingLaneX(Math.round(game.lane));
    const pace = Math.floor(elapsed * Math.max(3.2, game.speed / 42)) % 4;
    const womanLane = Math.round(game.lane + (game.catchMeter > 0.78 ? 0 : -0.15));
    const womanX = getBadEndingLaneX(Math.max(0, Math.min(3, womanLane))) - 64 + game.catchMeter * 46;
    const womanY = 220 + game.catchMeter * 18;
    const swing = Math.sin(elapsed * 10) * 8;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBadEndingBitmapBackdrop(ctx, canvas, scroll);
    game.obstacles.forEach((obstacle) => drawBadEndingObstacle(ctx, obstacle));
    drawBadEndingWoman(ctx, womanX, womanY, swing);
    drawBadEndingRunner(ctx, runnerX, 170, pace);

    if (game.hitFlash > 0) {
      ctx.fillStyle = `rgba(255, 107, 107, ${Math.min(0.36, game.hitFlash * 0.45)})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    drawBadEndingHud(ctx, game);
    drawBadEndingStatusOverlay(ctx, canvas, game);
  }

  function renderTutorialScene(now) {
    if (!tutorialCtx || !refs.tutorialCanvas) return;

    const ctx = tutorialCtx;
    const canvas = refs.tutorialCanvas;
    const elapsed = runtime.tutorialStartedAt ? (now - runtime.tutorialStartedAt) / 1000 : 0;
    const sway = Math.sin(elapsed * 3.2) * 8;
    const spotlight = 0.18 + (Math.sin(elapsed * 2.4) + 1) * 0.1;
    const frame = Math.floor(elapsed * 5) % 4;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#08060f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = `rgba(255, 202, 107, ${spotlight.toFixed(3)})`;
    ctx.beginPath();
    ctx.moveTo(210, 28);
    ctx.lineTo(138, 230);
    ctx.lineTo(282, 230);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#160f24";
    ctx.fillRect(0, 226, canvas.width, 94);
    ctx.fillStyle = "#2d1540";
    for (let index = 0; index < canvas.width; index += 26) {
      ctx.fillRect(index, 238 + ((index / 26) % 2) * 10, 12, 42);
    }
    ctx.fillStyle = "#ff62bd";
    for (let index = 12; index < canvas.width; index += 42) {
      ctx.fillRect(index, 232, 18, 3);
    }

    drawTutorialDancer(ctx, 174, 112, sway, frame);
    drawTutorialSpeechBubble(ctx, elapsed);
  }

  function drawTutorialDancer(ctx, x, y, sway, frame) {
    const armOffset = frame % 2 === 0 ? 0 : 4;
    const legOffset = frame >= 2 ? 4 : 0;
    const hipSway = Math.round(Math.sin((frame + 1) * 0.9) * 2);

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(x + 10, y + 114, 52, 8);
    fillRect(ctx, x + 25, y, 20, 16, "#f4c59f");
    fillRect(ctx, x + 21, y - 7, 28, 10, "#ff62bd");
    fillRect(ctx, x + 18 + hipSway, y + 12, 34, 38, "#7f81ff");
    fillRect(ctx, x + 12, y + 18 + armOffset, 10, 28, "#f4c59f");
    fillRect(ctx, x + 50, y + 14 - armOffset, 10, 28, "#f4c59f");
    fillRect(ctx, x + 18 + hipSway, y + 50, 32, 18, "#ff62bd");
    fillRect(ctx, x + 22, y + 68, 10, 38 - legOffset, "#15111f");
    fillRect(ctx, x + 40, y + 68 + legOffset, 10, 38 - legOffset, "#15111f");
    fillRect(ctx, x + 19, y - 2, 10, 10, "#80e092");
    fillRect(ctx, x + 40, y + 18, 8, 8, "#fff4d6");
    fillRect(ctx, x + 12, y + 30 + armOffset, 10, 4, "#fff4d6");
    fillRect(ctx, x + 46, y + 24 - armOffset, 12, 4, "#fff4d6");
    ctx.restore();
  }

  function drawTutorialSpeechBubble(ctx, elapsed) {
    const pulse = 0.88 + Math.sin(elapsed * 2.4) * 0.06;
    const bubbleX = 22;
    const bubbleY = 18;
    const bubbleW = 206;
    const bubbleH = 72;

    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = "rgba(9, 8, 18, 0.92)";
    ctx.fillRect(bubbleX, bubbleY, bubbleW, bubbleH);
    ctx.fillStyle = "#ffca6b";
    ctx.fillRect(bubbleX, bubbleY, bubbleW, 4);
    ctx.fillStyle = "#f7f2d5";
    ctx.font = "12px Chakra Petch";
    ctx.fillText("Aqui voce aprende como funciona.", bubbleX + 12, bubbleY + 26);
    ctx.fillText("Leia do lado, entre no clima", bubbleX + 12, bubbleY + 46);
    ctx.fillText("e depois caia pra dentro do salao.", bubbleX + 12, bubbleY + 62);
    ctx.restore();
  }

  function drawPixelWoman(ctx, x, y, swing) {
    ctx.save();
    ctx.fillStyle = "#0b0a10";
    ctx.fillRect(x + 6, y + 70, 30, 6);
    fillRect(ctx, x + 10, y, 16, 14, "#f0c2a0");
    fillRect(ctx, x + 8, y - 4, 20, 8, "#6c4a2f");
    fillRect(ctx, x + 8, y + 14, 20, 28, "#ff62bd");
    fillRect(ctx, x + 4, y + 18, 8, 20, "#f0c2a0");
    fillRect(ctx, x + 26, y + 18, 8, 20, "#f0c2a0");
    fillRect(ctx, x + 12, y + 42, 6, 28, "#5f3c2d");
    fillRect(ctx, x + 20, y + 42, 6, 28, "#5f3c2d");
    ctx.translate(x + 30, y + 22);
    ctx.rotate(((54 + swing) * Math.PI) / 180);
    fillRect(ctx, 0, -2, 42, 4, "#c99858");
    fillRect(ctx, 34, -4, 16, 8, "#9d7144");
    ctx.restore();
  }

  function drawPixelRunner(ctx, x, y) {
    ctx.save();
    ctx.fillStyle = "#0b0a10";
    ctx.fillRect(x + 4, y + 70, 32, 6);
    fillRect(ctx, x + 10, y, 16, 14, "#f3c59f");
    fillRect(ctx, x + 8, y - 4, 20, 8, "#66ecff");
    fillRect(ctx, x + 8, y + 14, 22, 28, "#70ebff");
    fillRect(ctx, x + 2, y + 18, 8, 18, "#f3c59f");
    fillRect(ctx, x + 28, y + 18, 8, 18, "#f3c59f");
    fillRect(ctx, x + 10, y + 42, 6, 28, "#181522");
    fillRect(ctx, x + 24, y + 42, 6, 28, "#181522");
    fillRect(ctx, x - 8, y + 28, 18, 4, "#fff4d6");
    fillRect(ctx, x + 34, y + 12, 18, 4, "#fff4d6");
    ctx.restore();
  }

  function fillRect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  function getActiveDrinkDefinition() {
    return DRINK_CATALOG.find((entry) => entry.id === state.shop.activeDrinkId) || null;
  }

  function getOwnedUpgrades() {
    return VISUAL_UPGRADES.filter((upgrade) => hasUpgrade(upgrade.id));
  }

  function getDrinkSpriteSpec(drinkId) {
    const specs = {
      "cafe-do-corredor": { className: "is-coffee", icon: "CF", accent: "#f0cf6d" },
      "neon-fizz": { className: "is-fizz", icon: "NZ", accent: "#70ebff" },
      "whisky-8bit": { className: "is-whisky", icon: "WK", accent: "#ffbf66" },
      "ouro-da-casa": { className: "is-gold", icon: "GD", accent: "#ffd66b" },
      "constelacao-reserva": { className: "is-constellation", icon: "CR", accent: "#c7b2ff" }
    };
    return specs[drinkId] || specs["cafe-do-corredor"];
  }

  function getUpgradeSpriteSpec(upgradeId) {
    const specs = {
      "neon-outline": { className: "is-outline", icon: "NO", accent: "#70ebff" },
      "gold-jacket": { className: "is-jacket", icon: "GJ", accent: "#ffd66b" },
      "vip-title": { className: "is-vip", icon: "VIP", accent: "#ff62bd" },
      "arcade-shades": { className: "is-shades", icon: "AR", accent: "#d9e7ff" },
      "lucky-hat": { className: "is-hat", icon: "HT", accent: "#f0cf6d" }
    };
    return specs[upgradeId] || specs["neon-outline"];
  }

  function renderInventorySpriteMarkup(kind, id) {
    const spec = kind === "drink" ? getDrinkSpriteSpec(id) : getUpgradeSpriteSpec(id);
    return `<span class="pubpaid-item-sprite ${spec.className}" data-kind="${kind}"><span>${escapeHtml(spec.icon)}</span></span>`;
  }

  function drawInventorySprite(ctx, x, y, kind, id) {
    const spec = kind === "drink" ? getDrinkSpriteSpec(id) : getUpgradeSpriteSpec(id);
    ctx.save();
    ctx.fillStyle = "rgba(8, 7, 18, 0.72)";
    ctx.fillRect(x, y, 22, 22);
    ctx.strokeStyle = spec.accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, 20, 20);
    ctx.fillStyle = spec.accent;
    ctx.font = "bold 8px Chakra Petch";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(spec.icon, x + 11, y + 12);
    ctx.restore();
  }

  function hasUpgrade(upgradeId) {
    return state.shop.ownedUpgrades.includes(upgradeId);
  }

  function getSecretLuckBoost() {
    return {
      music: runtime.audio.enabled ? 0.04 : 0,
      singer: state.secrets.singerCharm > 0 ? 0.03 : 0
    };
  }

  function rollDrinkFortune(drink, stake, hiddenBoost) {
    const boost = hiddenBoost || { music: 0, singer: 0 };
    const baseGoodChance = drink ? drink.goodChance : 0.03;
    const baseBadChance = drink ? drink.badChance : 0.01;
    const goodChance = Math.min(0.26, baseGoodChance + boost.music + boost.singer);
    const badChance = Math.max(0.005, baseBadChance);
    const roll = Math.random();
    if (roll < badChance) {
      return {
        mood: "bad",
        type: Math.random() > 0.5 ? "house-edge" : "cold-hand",
        coinValue: Math.max(1, Math.round(stake * 0.1)),
        note: `${drink ? drink.name : "A noite"} pesou na mao e trouxe um azar leve.`
      };
    }
    if (roll < badChance + goodChance) {
      return {
        mood: "good",
        type: Math.random() > 0.45 ? "extra-round" : "bonus-pot",
        coinValue: Math.max(1, Math.round(stake * 0.15)),
        note: `${drink ? drink.name : "O clima do salao"} bateu bem e abriu uma sorte pequena para a mesa.`
      };
    }
    return {
      mood: "neutral",
      type: "steady",
      coinValue: 0,
      note: `${drink ? drink.name : "O clima do salao"} ficou so no clima. Nada mudou nessa rodada.`
    };
  }

  function announceFortune(fortune) {
    if (!fortune) return;
    if (fortune.mood === "good") {
      setWorldMessage("A bebida bateu com sorte. Talvez a mesa abra uma chance extra.", 2400);
      return;
    }
    if (fortune.mood === "bad") {
      setWorldMessage("A bebida bateu torto. O azar da noite pode aparecer em detalhe pequeno.", 2400);
    }
  }

  function resolveFortuneOutcome(game, result, summary) {
    if (!game.fortune) {
      return {
        result,
        summary,
        coinDelta: 0,
        fortuneNote: ""
      };
    }

    const fortune = game.fortune;
    if (result === "loss" && fortune.type === "extra-round") {
      return {
        result: "tie",
        summary: `${summary} A bebida segurou a queda e a casa devolveu sua entrada com uma rodada extra simbolica.`,
        coinDelta: 0,
        fortuneNote: `${fortune.note} A derrota virou empate.`
      };
    }

    if (result === "win" && fortune.type === "bonus-pot") {
      return {
        result,
        summary,
        coinDelta: fortune.coinValue,
        fortuneNote: `${fortune.note} A casa pingou ${formatCoins(fortune.coinValue)} no premio.`
      };
    }

    if (result === "win" && fortune.type === "house-edge") {
      return {
        result,
        summary,
        coinDelta: -fortune.coinValue,
        fortuneNote: `${fortune.note} A mesa comeu ${formatCoins(fortune.coinValue)} do premio.`
      };
    }

    if (result === "loss" && fortune.type === "cold-hand") {
      return {
        result,
        summary,
        coinDelta: -fortune.coinValue,
        fortuneNote: `${fortune.note} A casa puxou mais ${formatCoins(fortune.coinValue)} no fim da rodada.`
      };
    }

    return {
      result,
      summary,
      coinDelta: 0,
      fortuneNote: fortune.mood === "neutral" ? fortune.note : ""
    };
  }

  function startMusic() {
    ensureAudioContext();
    if (!runtime.audio.ctx) return;
    runtime.audio.enabled = true;
    runtime.audio.step = 0;
    if (runtime.audio.timer) window.clearInterval(runtime.audio.timer);
    runtime.audio.timer = window.setInterval(scheduleMusicStep, 360);
    scheduleMusicStep();
  }

  function stopMusic() {
    runtime.audio.enabled = false;
    if (runtime.audio.timer) {
      window.clearInterval(runtime.audio.timer);
      runtime.audio.timer = null;
    }
  }

  function ensureAudioContext() {
    if (runtime.audio.ctx) {
      if (runtime.audio.ctx.state === "suspended") runtime.audio.ctx.resume();
      return;
    }
    try {
      runtime.audio.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      runtime.audio.ctx = null;
    }
  }

  function scheduleMusicStep() {
    const ctx = runtime.audio.ctx;
    if (!ctx || !runtime.audio.enabled) return;
    if (ctx.state === "suspended") ctx.resume();

    const melody = [64, 67, 69, 71, 69, 67, 64, 62];
    const bass = [40, 40, 45, 45, 38, 38, 43, 43];
    const harmony = [52, null, 55, null, 50, null, 52, null];
    const twang = [76, null, 74, null, 72, null, 71, null];

    const when = ctx.currentTime + 0.03;
    const step = runtime.audio.step % melody.length;

    playNote(midiToFreq(bass[step]), 0.34, "triangle", 0.03, when);
    playNote(midiToFreq(melody[step]), 0.22, "sawtooth", 0.018, when + 0.02);
    if (harmony[step]) playNote(midiToFreq(harmony[step]), 0.2, "triangle", 0.014, when + 0.06);
    if (twang[step]) playNote(midiToFreq(twang[step]), 0.12, "sine", 0.01, when + 0.12);

    runtime.audio.step += 1;
  }

  function playNote(frequency, duration, type, volume, when) {
    const ctx = runtime.audio.ctx;
    if (!ctx) return;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, when);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(volume, when + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(when);
    oscillator.stop(when + duration + 0.03);
  }

  function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function openGameLobby(gameId) {
    const normalized = normalizeGameId(gameId);
    if (!TABLE_META[normalized]) return;

    clearGameTimer();
    runtime.activeGame = {
      id: normalized,
      mode: "demo",
      screen: "lobby",
      stake: TABLE_META[normalized].stakes[0],
      payout: 0,
      houseFee: 0,
      opponent: { ...HOUSE_OPPONENTS[normalized] },
      feedback: "",
      summary: "",
      result: "",
      resultAmount: "",
      activeDrink: getActiveDrinkDefinition(),
      fortune: null,
      tableState: null,
      startedAt: ""
    };

    refs.gameModal.hidden = false;
    renderGameModal();
  }

  function closeGameModal(forceClose) {
    if (!runtime.activeGame) {
      refs.gameModal.hidden = true;
      return;
    }

    if (!forceClose && runtime.activeGame.screen === "playing") {
      setWorldMessage("Use o botao de sair da mesa para abandonar a partida.", 2200);
      return;
    }

    clearGameTimer();
    runtime.activeGame = null;
    refs.gameModal.hidden = true;
    refs.gameHost.innerHTML = "";
    clearPoolRefs();
  }

  function renderGameModal() {
    if (!runtime.activeGame || !refs.gameHost) {
      refs.gameModal.hidden = true;
      return;
    }

    const game = runtime.activeGame;
    refs.gameModal.hidden = false;
    setText(refs.gameTitle, TABLE_META[game.id].label);
    setText(
      refs.gameSubtitle,
      game.screen === "lobby"
        ? TABLE_META[game.id].description
        : game.screen === "finished"
          ? game.summary
          : TABLE_META[game.id].sceneCopy
    );
    setText(
      refs.gameKicker,
      game.screen === "lobby"
        ? TABLE_META[game.id].isSolo
          ? "solo da casa"
          : "mesa aberta"
        : game.screen === "finished"
          ? "resultado"
          : "partida ao vivo"
    );

    if (game.screen === "lobby") {
      refs.gameHost.innerHTML = renderGameLobby(game);
      clearPoolRefs();
      return;
    }

    if (game.screen === "finished") {
      refs.gameHost.innerHTML = renderGameFinished(game);
      clearPoolRefs();
      return;
    }

    if (game.id === "pool") {
      refs.gameHost.innerHTML = renderPoolGame(game);
      syncPoolRefs();
      drawPoolTable();
      updatePoolHud();
      return;
    }

    if (game.id === "checkers") {
      refs.gameHost.innerHTML = renderCheckersGame(game);
      clearPoolRefs();
      return;
    }

    if (game.id === "cards21") {
      refs.gameHost.innerHTML = renderCardsGame(game);
      clearPoolRefs();
      return;
    }

    if (game.id === "poker") {
      refs.gameHost.innerHTML = renderPokerGame(game);
      clearPoolRefs();
      return;
    }

    if (game.id === "dicecups") {
      refs.gameHost.innerHTML = renderDiceGame(game);
      clearPoolRefs();
      return;
    }

    if (game.id === "slots") {
      refs.gameHost.innerHTML = renderSlotsGame(game);
      clearPoolRefs();
      return;
    }

    if (game.id === "roulette") {
      refs.gameHost.innerHTML = renderRouletteGame(game);
      clearPoolRefs();
    }
  }

  function renderGameLobby(game) {
    const stakes = TABLE_META[game.id].stakes
      .map(
        (stake) => `
          <button
            class="pubpaid-stake-button ${stake === game.stake ? "is-active" : ""}"
            type="button"
            data-game-stake="${stake}"
          >
            ${formatCoins(stake)}
          </button>
        `
      )
      .join("");

    const isSolo = Boolean(TABLE_META[game.id].isSolo);
    const startLabel = isSolo ? "Sentar na maquina" : "Encontrar rival";
    const flowLines = isSolo
      ? `
        <li>Voce joga sozinho contra a maquina e a aposta entra no instante em que a rodada começa.</li>
        <li>Puxe a alavanca para girar os tres rolos e tente montar vantagem em uma série curta.</li>
        <li>Apostas liberadas: ${DEMO_STAKES.map((stake) => formatCoins(stake)).join(", ")}.</li>
      `
      : `
        <li>Voce entra pela mesa, encontra um rival e joga na hora.</li>
        <li>Se ganhar a série, leva o pote. Se perder, deixa a aposta na mesa.</li>
        <li>Apostas liberadas: ${DEMO_STAKES.map((stake) => formatCoins(stake)).join(", ")}.</li>
      `;

    return `
      <div class="pubpaid-game-lobby">
        <article class="pubpaid-game-box">
          <span class="pubpaid-game-chip">${escapeHtml(TABLE_META[game.id].shortLabel)}</span>
          <h3>${escapeHtml(TABLE_META[game.id].label)}</h3>
          <p>${escapeHtml(TABLE_META[game.id].description)}</p>
          <ul>${flowLines}</ul>
        </article>

        <article class="pubpaid-game-box">
          <div class="pubpaid-game-chip-row">
            <span class="pubpaid-game-chip">saldo ${escapeHtml(formatCoins(state.wallet.coins))}</span>
            <span class="pubpaid-game-chip">${escapeHtml(isSolo ? "maquina solo" : "rival")} ${escapeHtml(game.opponent.name)}</span>
            <span class="pubpaid-game-chip">${game.activeDrink ? `bebida ${escapeHtml(game.activeDrink.name)}` : "sem bebida ativa"}</span>
          </div>
          <p>${escapeHtml(game.opponent.bio)}</p>
          ${game.activeDrink ? `<p class="pubpaid-feedback">A bebida pode dar boa sorte em ${Math.round(game.activeDrink.goodChance * 100)}% ou azar em ${Math.round(game.activeDrink.badChance * 100)}% da rodada.</p>` : ""}
          <div class="pubpaid-stake-row">${stakes}</div>
          <div class="pubpaid-card-actions">
            <button class="pubpaid-card-button" type="button" data-start-game>${escapeHtml(startLabel)}</button>
            <button class="pubpaid-card-button" type="button" data-close-finished>Voltar ao salao</button>
          </div>
          ${game.feedback ? `<p class="pubpaid-feedback">${escapeHtml(game.feedback)}</p>` : ""}
        </article>
      </div>
    `;
  }

  function renderGameFinished(game) {
    const bannerClass =
      game.result === "win" ? "is-win" : game.result === "loss" ? "is-loss" : "is-tie";
    const title =
      game.result === "win" ? "Voce venceu" : game.result === "loss" ? "Voce perdeu" : "Empate";

    return `
      <section class="pubpaid-result-banner ${bannerClass}">
        <span class="pubpaid-result-chip">${escapeHtml(TABLE_META[game.id].label)}</span>
        <strong>${escapeHtml(title)}</strong>
        <p>${escapeHtml(game.summary)}</p>
        ${game.fortuneNote ? `<p class="pubpaid-feedback">${escapeHtml(game.fortuneNote)}</p>` : ""}
        <div class="pubpaid-result-amount">${escapeHtml(game.resultAmount)}</div>
      </section>

      <section class="pubpaid-result-panel">
        <article>
          <span>rival</span>
          <strong>${escapeHtml(game.opponent.name)}</strong>
          <p>${escapeHtml(game.opponent.bio)}</p>
        </article>
        <article>
          <span>saldo atual</span>
          <strong>${escapeHtml(formatCoins(state.wallet.coins))}</strong>
          <p>O historico local ja guardou essa rodada.</p>
        </article>
      </section>

      <div class="pubpaid-result-actions">
        <button class="pubpaid-card-button" type="button" data-rematch-game>Mesma mesa de novo</button>
        <button class="pubpaid-card-button" type="button" data-close-finished>Fechar mesa</button>
      </div>
    `;
  }

  function startActiveGame() {
    const game = runtime.activeGame;
    if (!game || game.screen !== "lobby") return;

    if (state.wallet.coins < game.stake) {
      game.feedback = `Saldo insuficiente. Voce precisa de ${formatCoins(game.stake)}.`;
      renderGameModal();
      return;
    }

    game.feedback = "";
    game.startedAt = new Date().toISOString();
    game.houseFee = getHouseFee(game.stake);
    game.payout = game.stake * 2 - game.houseFee;
    game.fortune = rollDrinkFortune(game.activeDrink, game.stake, getSecretLuckBoost());
    game.screen = "playing";
    state.wallet.coins -= game.stake;
    state.shop.activeDrinkId = "";
    if (state.secrets.singerCharm > 0) state.secrets.singerCharm -= 1;

    if (game.id === "pool") {
      game.tableState = createPoolState();
    } else if (game.id === "checkers") {
      game.tableState = createCheckersState();
    } else if (game.id === "cards21") {
      game.tableState = createCardsState();
    } else if (game.id === "poker") {
      game.tableState = createPokerState();
    } else if (game.id === "dicecups") {
      game.tableState = createDiceState();
    } else if (game.id === "slots") {
      game.tableState = createSlotsState();
    } else if (game.id === "roulette") {
      game.tableState = createRouletteState();
    }

    saveState();
    renderAll();
    announceFortune(game.fortune);
  }

  function rematchCurrentGame() {
    const game = runtime.activeGame;
    if (!game) return;
    const sameId = game.id;
    closeGameModal(true);
    openGameLobby(sameId);
  }

  function abandonActiveGame() {
    if (!runtime.activeGame || runtime.activeGame.screen !== "playing") return;
    finalizeGame("loss", "Voce levantou da mesa antes do fim da rodada.");
  }

  function getHouseFee(stake) {
    return Math.max(1, Math.round(stake * 0.2));
  }

  function finalizeGame(result, summary) {
    const game = runtime.activeGame;
    if (!game || game.screen === "finished") return;

    clearGameTimer();
    clearPoolRefs(false);

    const resolved = resolveFortuneOutcome(game, result, summary);
    game.screen = "finished";
    game.result = resolved.result;
    game.summary = resolved.summary;
    game.fortuneNote = resolved.fortuneNote;

    if (resolved.result === "win") {
      const finalPayout = Math.max(0, game.payout + resolved.coinDelta);
      state.wallet.coins += finalPayout;
      state.wallet.wins += 1;
      state.wallet.bestWin = Math.max(state.wallet.bestWin, finalPayout);
      game.resultAmount = `+${formatCoins(finalPayout)}`;
    } else if (resolved.result === "loss") {
      state.wallet.losses += 1;
      const finalLoss = game.stake + Math.max(0, -resolved.coinDelta);
      if (resolved.coinDelta < 0) state.wallet.coins = Math.max(0, state.wallet.coins + resolved.coinDelta);
      game.resultAmount = `-${formatCoins(finalLoss)}`;
    } else {
      const refunded = game.stake + Math.max(0, resolved.coinDelta);
      state.wallet.coins += refunded;
      game.resultAmount = `+${formatCoins(refunded)}`;
    }

    state.history.unshift({
      id: `history-${Date.now()}`,
      title: TABLE_META[game.id].label,
      result: resolved.result,
      summary: resolved.summary,
      amount: game.resultAmount,
      opponent: game.opponent.name,
      at: new Date().toISOString()
    });
    state.history = state.history.slice(0, HISTORY_LIMIT);

    saveState();
    renderAll();
  }

  function renderPoolGame(game) {
    const pool = game.tableState;
    return `
      <div class="pubpaid-pool-layout">
        <section class="pubpaid-pool-stage">
          <canvas class="pubpaid-pool-canvas" data-pool-canvas width="760" height="430"></canvas>
          <div class="pubpaid-meter">
            <span data-pool-meter-fill></span>
          </div>
          <div class="pubpaid-meter-label">
            <span data-pool-status>${escapeHtml(pool.message)}</span>
            <span data-pool-turn>${escapeHtml(pool.turn === "player" ? "sua vez" : `${game.opponent.name} na tacada`)}</span>
          </div>
        </section>

        <section class="pubpaid-pool-side">
          <article>
            <span>pote</span>
            <strong>${escapeHtml(formatCoins(game.payout))}</strong>
            <p>Entrada ${escapeHtml(formatCoins(game.stake))} e casa ${escapeHtml(formatCoins(game.houseFee))}.</p>
          </article>
          <article>
            <span>mesa</span>
            <strong data-pool-remaining>${escapeHtml(String(countPoolColored(pool)))}</strong>
            <p>Bolas coloridas restantes antes da bola 8.</p>
          </article>
          <article>
            <span>placar</span>
            <strong data-pool-score>${escapeHtml(String(pool.playerPocketed))} x ${escapeHtml(String(pool.botPocketed))}</strong>
            <p>Quem limpar mais a mesa chega vivo na preta.</p>
          </article>
          <div class="pubpaid-card-actions">
            <button class="pubpaid-card-button" type="button" data-abandon-game>Sair da mesa</button>
          </div>
        </section>
      </div>
    `;
  }

  function createPoolState() {
    const ballRadius = 11;
    return {
      table: {
        x: 48,
        y: 34,
        w: 664,
        h: 352,
        pocketRadius: 20,
        ballRadius
      },
      turn: "player",
      phase: "aim",
      message: "Mova o mouse pela mesa, segure o clique para carregar e solte para bater.",
      physics: {
        cuePower: 320,
        rollingFriction: 0.984,
        railBounce: 0.92,
        ballBounce: 0.985,
        pocketPull: 56,
        stopSpeed: 4.5,
        substeps: 2
      },
      charge: 0,
      charging: false,
      chargeStartedAt: 0,
      aimX: 520,
      aimY: 210,
      cuePocketed: false,
      playerPocketed: 0,
      botPocketed: 0,
      shotPocketed: 0,
      shotOwner: "player",
      pockets: [
        { x: 48, y: 34 },
        { x: 380, y: 30 },
        { x: 712, y: 34 },
        { x: 48, y: 386 },
        { x: 380, y: 390 },
        { x: 712, y: 386 }
      ],
      balls: [
        createBall("cue", 176, 210, "#f5f5f5"),
        createBall("1", 518, 210, "#ff6666"),
        createBall("2", 540, 198, "#ffcf73"),
        createBall("3", 540, 222, "#70ebff"),
        createBall("4", 562, 186, "#7a7cff"),
        createBall("8", 562, 210, "#111111")
      ]
    };
  }

  function createBall(id, x, y, color) {
    return {
      id,
      x,
      y,
      vx: 0,
      vy: 0,
      color,
      pocketed: false
    };
  }

  function syncPoolRefs() {
    const canvas = refs.gameHost.querySelector("[data-pool-canvas]");
    runtime.poolRefs.canvas = canvas;
    runtime.poolRefs.ctx = canvas?.getContext("2d") || null;
    if (runtime.poolRefs.ctx) runtime.poolRefs.ctx.imageSmoothingEnabled = false;
    runtime.poolRefs.meter = refs.gameHost.querySelector("[data-pool-meter-fill]");

    if (!canvas) return;
    canvas.addEventListener("pointermove", handlePoolPointerMove);
    canvas.addEventListener("pointerdown", handlePoolPointerDown);
    canvas.addEventListener("pointerup", handlePoolPointerUp);
    canvas.addEventListener("pointerleave", handlePoolPointerLeave);
  }

  function clearPoolRefs(removeCanvasListeners) {
    if (removeCanvasListeners !== false && runtime.poolRefs.canvas) {
      runtime.poolRefs.canvas.removeEventListener("pointermove", handlePoolPointerMove);
      runtime.poolRefs.canvas.removeEventListener("pointerdown", handlePoolPointerDown);
      runtime.poolRefs.canvas.removeEventListener("pointerup", handlePoolPointerUp);
      runtime.poolRefs.canvas.removeEventListener("pointerleave", handlePoolPointerLeave);
    }

    runtime.poolRefs.canvas = null;
    runtime.poolRefs.ctx = null;
    runtime.poolRefs.meter = null;
    runtime.poolRefs.pointerInside = false;
  }

  function handlePoolPointerMove(event) {
    const game = runtime.activeGame;
    if (!game || game.id !== "pool" || game.screen !== "playing") return;
    const pool = game.tableState;
    if (pool.turn !== "player" || pool.phase !== "aim") return;
    const point = getCanvasPoint(event, runtime.poolRefs.canvas);
    pool.aimX = point.x;
    pool.aimY = point.y;
  }

  function handlePoolPointerDown(event) {
    const game = runtime.activeGame;
    if (!game || game.id !== "pool" || game.screen !== "playing") return;
    const pool = game.tableState;
    if (pool.turn !== "player" || pool.phase !== "aim") return;
    const cue = getCueBall(pool);
    if (!cue || cue.pocketed) return;
    const point = getCanvasPoint(event, runtime.poolRefs.canvas);
    pool.aimX = point.x;
    pool.aimY = point.y;
    pool.charging = true;
    pool.chargeStartedAt = performance.now();
  }

  function handlePoolPointerUp(event) {
    const game = runtime.activeGame;
    if (!game || game.id !== "pool" || game.screen !== "playing") return;
    const pool = game.tableState;
    if (!pool.charging || pool.turn !== "player" || pool.phase !== "aim") return;
    const point = getCanvasPoint(event, runtime.poolRefs.canvas);
    pool.aimX = point.x;
    pool.aimY = point.y;
    shootPoolCue(pool, "player");
  }

  function handlePoolPointerLeave() {
    const game = runtime.activeGame;
    if (!game || game.id !== "pool" || game.screen !== "playing") return;
    const pool = game.tableState;
    if (pool.charging && pool.turn === "player" && pool.phase === "aim") {
      shootPoolCue(pool, "player");
    }
  }

  function getCanvasPoint(event, canvas) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  }

  function shootPoolCue(pool, shooter) {
    const cue = getCueBall(pool);
    if (!cue || cue.pocketed) return;
    const dx = pool.aimX - cue.x;
    const dy = pool.aimY - cue.y;
    const length = Math.hypot(dx, dy) || 1;
    const charge = shooter === "player"
      ? Math.max(0.18, Math.min(1, (performance.now() - pool.chargeStartedAt) / 850))
      : pool.charge;
    const aimDistance = Math.min(240, Math.hypot(dx, dy));
    const distanceBoost = 0.72 + aimDistance / 240;
    const power = pool.physics.cuePower * charge * distanceBoost;
    cue.vx = (dx / length) * power;
    cue.vy = (dy / length) * power;
    pool.shotOwner = shooter;
    pool.shotPocketed = 0;
    pool.cuePocketed = false;
    pool.phase = "rolling";
    pool.charge = 0;
    pool.charging = false;
    pool.message =
      shooter === "player"
        ? "A mesa esta rolando. Veja o caminho das bolas."
        : `${runtime.activeGame.opponent.name} bateu na branca.`;

    renderGameModal();
  }

  function updatePoolGame(delta) {
    const game = runtime.activeGame;
    if (!game || game.id !== "pool" || game.screen !== "playing") return;
    const pool = game.tableState;

    if (pool.turn === "bot" && pool.phase === "aim") {
      pool.charge = 0.58;
      pool.aimX = 530;
      pool.aimY = 210;
      pool.phase = "bot-thinking";
      pool.message = `${game.opponent.name} esta lendo a mesa.`;
      renderGameModal();
      runtime.gameTimer = window.setTimeout(() => runBotPoolShot(pool), 900);
      return;
    }

    if (pool.turn === "player" && pool.phase === "aim" && pool.charging) {
      pool.charge = Math.max(0.18, Math.min(1, (performance.now() - pool.chargeStartedAt) / 850));
    }

    if (pool.phase !== "rolling") return;

    stepPoolPhysics(pool, delta);

    if (!poolBallsMoving(pool)) {
      resolvePoolStop(pool);
    }
  }

  function runBotPoolShot(pool) {
    const game = runtime.activeGame;
    if (!game || game.id !== "pool" || game.screen !== "playing") return;
    const cue = getCueBall(pool);
    const target = getBotPoolTarget(pool);
    if (!cue || !target) {
      finalizeGame("loss", `${game.opponent.name} matou o ritmo da mesa e ficou com a vantagem.`);
      return;
    }

    const biasX = target.x + randomBetween(-10, 10);
    const biasY = target.y + randomBetween(-9, 9);
    pool.aimX = biasX;
    pool.aimY = biasY;
    const distance = cue ? Math.hypot(biasX - cue.x, biasY - cue.y) : 120;
    pool.charge = Math.max(0.46, Math.min(0.84, 0.42 + distance / 320));
    shootPoolCue(pool, "bot");
  }

  function getBotPoolTarget(pool) {
    const colored = pool.balls.filter((ball) => !ball.pocketed && ball.id !== "cue" && ball.id !== "8");
    if (colored.length) {
      return colored.sort((a, b) => distanceToCue(pool, a) - distanceToCue(pool, b))[0];
    }
    return pool.balls.find((ball) => ball.id === "8" && !ball.pocketed) || null;
  }

  function distanceToCue(pool, ball) {
    const cue = getCueBall(pool);
    return cue ? Math.hypot(ball.x - cue.x, ball.y - cue.y) : Infinity;
  }

  function stepPoolPhysics(pool, delta) {
    const { x, y, w, h, pocketRadius, ballRadius } = pool.table;
    const left = x + ballRadius;
    const right = x + w - ballRadius;
    const top = y + ballRadius;
    const bottom = y + h - ballRadius;
    const steps = Math.max(1, pool.physics.substeps || 1);
    const stepDelta = delta / steps;

    for (let step = 0; step < steps; step += 1) {
      const friction = Math.pow(pool.physics.rollingFriction, stepDelta * 60);

      pool.balls.forEach((ball) => {
        if (ball.pocketed) return;

        pool.pockets.forEach((pocket) => {
          const dxPocket = pocket.x - ball.x;
          const dyPocket = pocket.y - ball.y;
          const pocketDistance = Math.hypot(dxPocket, dyPocket) || 1;
          if (pocketDistance < pocketRadius * 2.25) {
            const pull = ((pocketRadius * 2.25 - pocketDistance) / (pocketRadius * 2.25)) * pool.physics.pocketPull;
            ball.vx += (dxPocket / pocketDistance) * pull * stepDelta;
            ball.vy += (dyPocket / pocketDistance) * pull * stepDelta;
          }
        });

        ball.x += ball.vx * stepDelta;
        ball.y += ball.vy * stepDelta;
        ball.vx *= friction;
        ball.vy *= friction;

        if (Math.abs(ball.vx) < pool.physics.stopSpeed) ball.vx = 0;
        if (Math.abs(ball.vy) < pool.physics.stopSpeed) ball.vy = 0;

        if (ball.x <= left) {
          ball.x = left;
          ball.vx *= -pool.physics.railBounce;
          ball.vy *= 0.992;
        }
        if (ball.x >= right) {
          ball.x = right;
          ball.vx *= -pool.physics.railBounce;
          ball.vy *= 0.992;
        }
        if (ball.y <= top) {
          ball.y = top;
          ball.vy *= -pool.physics.railBounce;
          ball.vx *= 0.992;
        }
        if (ball.y >= bottom) {
          ball.y = bottom;
          ball.vy *= -pool.physics.railBounce;
          ball.vx *= 0.992;
        }

        pool.pockets.forEach((pocket) => {
          if (ball.pocketed) return;
          if (Math.hypot(ball.x - pocket.x, ball.y - pocket.y) <= pocketRadius) {
            ball.pocketed = true;
            ball.vx = 0;
            ball.vy = 0;
            registerPocket(pool, ball);
          }
        });
      });

      for (let index = 0; index < pool.balls.length; index += 1) {
        const a = pool.balls[index];
        if (a.pocketed) continue;
        for (let inner = index + 1; inner < pool.balls.length; inner += 1) {
          const b = pool.balls[inner];
          if (b.pocketed) continue;
          resolveBallCollision(a, b, ballRadius * 2, pool.physics.ballBounce);
        }
      }
    }
  }

  function resolveBallCollision(a, b, minDistance, restitution = 1) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const distance = Math.hypot(dx, dy);
    if (!distance || distance >= minDistance) return;

    const overlap = (minDistance - distance) / 2;
    const nx = dx / distance;
    const ny = dy / distance;

    a.x -= nx * overlap;
    a.y -= ny * overlap;
    b.x += nx * overlap;
    b.y += ny * overlap;

    const relativeVelocity = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
    if (relativeVelocity > 0) return;

    const impulse = (-(1 + restitution) * relativeVelocity) / 2;
    a.vx += impulse * nx;
    a.vy += impulse * ny;
    b.vx -= impulse * nx;
    b.vy -= impulse * ny;
  }

  function registerPocket(pool, ball) {
    if (ball.id === "cue") {
      pool.cuePocketed = true;
      pool.message = "A branca caiu. A casa vai reposicionar a bola.";
      return;
    }

    if (ball.id === "8") {
      const coloredRemaining = countPoolColored(pool);
      const shooterIsPlayer = pool.shotOwner === "player";
      if (coloredRemaining === 0) {
        finalizeGame(
          shooterIsPlayer ? "win" : "loss",
          shooterIsPlayer
            ? `${state.profile.name || "Voce"} limpou a mesa e matou a bola 8.`
            : `${runtime.activeGame.opponent.name} limpou a mesa e matou a bola 8.`
        );
      } else {
        finalizeGame(
          shooterIsPlayer ? "loss" : "win",
          shooterIsPlayer
            ? "A bola 8 caiu cedo demais e a mesa escapou da sua mao."
            : `${runtime.activeGame.opponent.name} errou a bola 8 antes da hora.`
        );
      }
      return;
    }

    pool.shotPocketed += 1;
    if (pool.shotOwner === "player") {
      pool.playerPocketed += 1;
    } else {
      pool.botPocketed += 1;
    }
    pool.message =
      pool.shotOwner === "player"
        ? "Boa. A bola caiu e a mesa ainda esta viva."
        : `${runtime.activeGame.opponent.name} derrubou uma bola colorida.`;
  }

  function poolBallsMoving(pool) {
    return pool.balls.some((ball) => !ball.pocketed && (Math.abs(ball.vx) > 1 || Math.abs(ball.vy) > 1));
  }

  function countPoolColored(pool) {
    return pool.balls.filter((ball) => !ball.pocketed && ball.id !== "cue" && ball.id !== "8").length;
  }

  function getCueBall(pool) {
    return pool.balls.find((ball) => ball.id === "cue");
  }

  function resolvePoolStop(pool) {
    const cue = getCueBall(pool);

    if (cue && cue.pocketed) {
      cue.pocketed = false;
      cue.x = 176;
      cue.y = 210;
      cue.vx = 0;
      cue.vy = 0;
      pool.message = "A branca voltou para a marca e a mesa segue aberta.";
    }

    const shooterIsPlayer = pool.shotOwner === "player";
    const keepTurn = pool.shotPocketed > 0 && !pool.cuePocketed;
    pool.turn = keepTurn ? pool.shotOwner : shooterIsPlayer ? "bot" : "player";
    pool.phase = "aim";
    pool.charge = 0;
    pool.charging = false;
    pool.message = keepTurn
      ? shooterIsPlayer
        ? "Mesa aberta. Como voce matou bola, a tacada continua sua."
        : `${runtime.activeGame.opponent.name} matou bola e vai de novo.`
      : shooterIsPlayer
        ? `${runtime.activeGame.opponent.name} assumiu a tacada.`
        : "A casa errou o ritmo. Agora a mesa volta para voce.";

    renderGameModal();
  }

  function drawPoolTable() {
    const game = runtime.activeGame;
    const ctx = runtime.poolRefs.ctx;
    if (!game || game.id !== "pool" || game.screen !== "playing" || !ctx) return;
    const pool = game.tableState;
    const canvas = runtime.poolRefs.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#4c2d15";
    ctx.fillRect(20, 18, 720, 392);
    ctx.fillStyle = "#174425";
    ctx.fillRect(pool.table.x, pool.table.y, pool.table.w, pool.table.h);
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    ctx.strokeRect(pool.table.x + 26, pool.table.y + 26, pool.table.w - 52, pool.table.h - 52);
    ctx.strokeStyle = "#0d2615";
    ctx.lineWidth = 6;
    ctx.strokeRect(pool.table.x, pool.table.y, pool.table.w, pool.table.h);

    pool.pockets.forEach((pocket) => {
      ctx.fillStyle = "#050505";
      ctx.beginPath();
      ctx.arc(pocket.x, pocket.y, pool.table.pocketRadius, 0, Math.PI * 2);
      ctx.fill();
    });

    if (pool.turn === "player" && pool.phase === "aim") {
      const cue = getCueBall(pool);
      if (cue && !cue.pocketed) {
        const dx = pool.aimX - cue.x;
        const dy = pool.aimY - cue.y;
        const length = Math.hypot(dx, dy) || 1;
        const guideEndX = cue.x + (dx / length) * Math.min(160, length);
        const guideEndY = cue.y + (dy / length) * Math.min(160, length);
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.46)";
        ctx.setLineDash([10, 8]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cue.x, cue.y);
        ctx.lineTo(guideEndX, guideEndY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle = "rgba(255, 207, 107, 0.42)";
        ctx.beginPath();
        ctx.moveTo(cue.x - (dx / length) * (26 + 34 * pool.charge), cue.y - (dy / length) * (26 + 34 * pool.charge));
        ctx.lineTo(cue.x - (dx / length) * 12, cue.y - (dy / length) * 12);
        ctx.stroke();
        ctx.restore();
      }
    }

    pool.balls.forEach((ball) => {
      if (ball.pocketed) return;
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.beginPath();
      ctx.arc(ball.x + 2, ball.y + 2, pool.table.ballRadius + 1, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = ball.color;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, pool.table.ballRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = ball.id === "8" ? "#f5f5f5" : "rgba(255,255,255,0.92)";
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = ball.id === "8" ? "#111111" : "#1c1830";
      ctx.font = "9px Chakra Petch";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(ball.id === "cue" ? "" : ball.id, ball.x, ball.y + 0.5);
    });
  }

  function updatePoolHud() {
    const game = runtime.activeGame;
    if (!game || game.id !== "pool" || game.screen !== "playing") return;
    const pool = game.tableState;
    const status = refs.gameHost.querySelector("[data-pool-status]");
    const turn = refs.gameHost.querySelector("[data-pool-turn]");
    const remaining = refs.gameHost.querySelector("[data-pool-remaining]");
    const score = refs.gameHost.querySelector("[data-pool-score]");

    if (status) status.textContent = pool.message;
    if (turn) turn.textContent = pool.turn === "player" ? "sua vez" : `${game.opponent.name} na tacada`;
    if (remaining) remaining.textContent = String(countPoolColored(pool));
    if (score) score.textContent = `${pool.playerPocketed} x ${pool.botPocketed}`;
    if (runtime.poolRefs.meter) {
      runtime.poolRefs.meter.style.width = `${Math.round(pool.charge * 100)}%`;
    }
  }

  function createCheckersState() {
    const board = Array.from({ length: 8 }, () => Array(8).fill(""));
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        if ((row + col) % 2 === 1) board[row][col] = "o";
      }
    }
    for (let row = 5; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        if ((row + col) % 2 === 1) board[row][col] = "p";
      }
    }
    return {
      board,
      turn: "player",
      selected: null,
      validMoves: [],
      message: "Sua vez. Clique numa peca azul e depois no destino.",
      turnCount: 0
    };
  }

  function renderCheckersGame(game) {
    const stateCheckers = game.tableState;
    const validTargets = new Set(
      stateCheckers.validMoves.map((move) => `${move.to.row}-${move.to.col}`)
    );
    const selected = stateCheckers.selected
      ? `${stateCheckers.selected.row}-${stateCheckers.selected.col}`
      : "";
    const boardMarkup = stateCheckers.board
      .map((row, rowIndex) =>
        row
          .map((cell, colIndex) => {
            const dark = (rowIndex + colIndex) % 2 === 1;
            const key = `${rowIndex}-${colIndex}`;
            const isSelected = key === selected;
            const isValid = validTargets.has(key);
            const owner = getCheckersOwner(cell);
            const clickable = dark && (owner === "player" || isValid);
            return `
              <button
                type="button"
                class="pubpaid-checkers-cell${dark ? " is-dark" : ""}${isSelected ? " is-selected" : ""}${isValid ? " is-valid" : ""}"
                data-checkers-cell="1"
                data-row="${rowIndex}"
                data-col="${colIndex}"
                ${clickable ? "" : "disabled"}
              >
                ${cell ? `<span class="pubpaid-piece ${owner}${cell === cell.toUpperCase() ? " king" : ""}"></span>` : ""}
              </button>
            `;
          })
          .join("")
      )
      .join("");

    return `
      <div class="pubpaid-checkers-wrap">
        <div class="pubpaid-game-chip-row">
          <span class="pubpaid-turn-chip">${escapeHtml(stateCheckers.turn === "player" ? "sua vez" : `${game.opponent.name} pensa`)}</span>
          <span class="pubpaid-turn-chip">pote ${escapeHtml(formatCoins(game.payout))}</span>
        </div>
        <section class="pubpaid-checkers-stage pubpaid-minigame-frame">
          <div class="pubpaid-minigame-head">
            <strong>Damas Pixel</strong>
            <span>Capture em diagonal e feche a ultima linha.</span>
          </div>
          <div class="pubpaid-checkers-board-wrap">
            <div class="pubpaid-checkers-axis pubpaid-checkers-axis-top">
              ${["A", "B", "C", "D", "E", "F", "G", "H"].map((label) => `<span>${label}</span>`).join("")}
            </div>
            <div class="pubpaid-checkers-stage-row">
              <div class="pubpaid-checkers-axis pubpaid-checkers-axis-side">
                ${Array.from({ length: 8 }, (_, index) => `<span>${8 - index}</span>`).join("")}
              </div>
              <div class="pubpaid-checkers-board">${boardMarkup}</div>
            </div>
          </div>
        </section>
        <section class="pubpaid-pool-side">
          <article>
            <span>status</span>
            <strong>${escapeHtml(stateCheckers.message)}</strong>
            <p>Azul move primeiro. Captura continua quando a mesma peca mantem o salto.</p>
          </article>
          <article>
            <span>pecas vivas</span>
            <strong>${escapeHtml(String(countCheckersPieces(stateCheckers.board, "player")))} x ${escapeHtml(String(countCheckersPieces(stateCheckers.board, "opponent")))}</strong>
            <p>Seu lado contra o rival da casa.</p>
          </article>
        </section>
        <div class="pubpaid-card-actions">
          <button class="pubpaid-card-button" type="button" data-abandon-game>Sair da mesa</button>
        </div>
      </div>
    `;
  }

  function getCheckersOwner(piece) {
    if (!piece) return "";
    return piece.toLowerCase() === "p" ? "player" : "opponent";
  }

  function getCheckersDirections(piece) {
    if (!piece) return [];
    if (piece === piece.toUpperCase()) return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    return piece.toLowerCase() === "p" ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
  }

  function inCheckersBounds(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  }

  function crownCheckersPiece(piece, row) {
    if (piece === "p" && row === 0) return "P";
    if (piece === "o" && row === 7) return "O";
    return piece;
  }

  function cloneCheckersBoard(board) {
    return board.map((row) => row.slice());
  }

  function getMovesForCheckersPiece(board, row, col) {
    const piece = board[row][col];
    if (!piece) return [];
    const owner = getCheckersOwner(piece);
    const enemy = owner === "player" ? "opponent" : "player";
    const moves = [];

    getCheckersDirections(piece).forEach(([rowStep, colStep]) => {
      const nextRow = row + rowStep;
      const nextCol = col + colStep;
      if (!inCheckersBounds(nextRow, nextCol)) return;

      if (!board[nextRow][nextCol]) {
        moves.push({
          from: { row, col },
          to: { row: nextRow, col: nextCol },
          capture: null
        });
        return;
      }

      if (getCheckersOwner(board[nextRow][nextCol]) !== enemy) return;
      const jumpRow = nextRow + rowStep;
      const jumpCol = nextCol + colStep;
      if (!inCheckersBounds(jumpRow, jumpCol) || board[jumpRow][jumpCol]) return;
      moves.push({
        from: { row, col },
        to: { row: jumpRow, col: jumpCol },
        capture: { row: nextRow, col: nextCol }
      });
    });

    return moves;
  }

  function getAllCheckersMoves(board, owner) {
    const moves = [];
    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        if (getCheckersOwner(board[row][col]) !== owner) continue;
        moves.push(...getMovesForCheckersPiece(board, row, col));
      }
    }
    const captures = moves.filter((move) => move.capture);
    return captures.length ? captures : moves;
  }

  function applyCheckersMove(board, move) {
    const next = cloneCheckersBoard(board);
    const piece = next[move.from.row][move.from.col];
    next[move.from.row][move.from.col] = "";
    if (move.capture) next[move.capture.row][move.capture.col] = "";
    next[move.to.row][move.to.col] = crownCheckersPiece(piece, move.to.row);
    return next;
  }

  function countCheckersPieces(board, owner) {
    let count = 0;
    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        if (getCheckersOwner(board[row][col]) === owner) count += 1;
      }
    }
    return count;
  }

  function checkCheckersOutcome(board) {
    const playerPieces = countCheckersPieces(board, "player");
    const botPieces = countCheckersPieces(board, "opponent");
    if (!playerPieces) return "loss";
    if (!botPieces) return "win";
    if (!getAllCheckersMoves(board, "player").length) return "loss";
    if (!getAllCheckersMoves(board, "opponent").length) return "win";
    return "";
  }

  function handleCheckersClick(row, col) {
    const game = runtime.activeGame;
    if (!game || game.id !== "checkers" || game.screen !== "playing") return;
    const checkers = game.tableState;
    if (checkers.turn !== "player") return;

    const cell = checkers.board[row][col];
    const owner = getCheckersOwner(cell);
    const allMoves = getAllCheckersMoves(checkers.board, "player");

    if (owner === "player") {
      const moves = allMoves.filter((move) => move.from.row === row && move.from.col === col);
      checkers.selected = { row, col };
      checkers.validMoves = moves;
      checkers.message = moves.length
        ? "Destino marcado. Feche a jogada."
        : "Essa peca nao tem rota agora.";
      renderGameModal();
      return;
    }

    const chosenMove = checkers.validMoves.find((move) => move.to.row === row && move.to.col === col);
    if (!chosenMove) return;

    checkers.board = applyCheckersMove(checkers.board, chosenMove);
    checkers.turnCount += 1;
    const outcome = checkCheckersOutcome(checkers.board);
    if (outcome === "win") {
      finalizeGame("win", `${state.profile.name || "Voce"} fechou a diagonal e levou a mesa de damas.`);
      return;
    }
    if (outcome === "loss") {
      finalizeGame("loss", `${game.opponent.name} travou o tabuleiro e ficou com a mesa.`);
      return;
    }

    if (chosenMove.capture) {
      const followCaptures = getMovesForCheckersPiece(checkers.board, chosenMove.to.row, chosenMove.to.col).filter(
        (move) => move.capture
      );
      if (followCaptures.length) {
        checkers.selected = { row: chosenMove.to.row, col: chosenMove.to.col };
        checkers.validMoves = followCaptures;
        checkers.message = "A captura continua com a mesma peca.";
        renderGameModal();
        return;
      }
    }

    checkers.turn = "opponent";
    checkers.selected = null;
    checkers.validMoves = [];
    checkers.message = `${game.opponent.name} esta lendo o tabuleiro.`;
    renderGameModal();
    runtime.gameTimer = window.setTimeout(runCheckersBotTurn, 620);
  }

  function runCheckersBotTurn() {
    const game = runtime.activeGame;
    if (!game || game.id !== "checkers" || game.screen !== "playing") return;
    const checkers = game.tableState;
    const moves = getAllCheckersMoves(checkers.board, "opponent");

    if (!moves.length) {
      finalizeGame("win", `${state.profile.name || "Voce"} cercou a casa e fechou a mesa.`);
      return;
    }

    const move = moves[Math.floor(Math.random() * moves.length)];
    checkers.board = applyCheckersMove(checkers.board, move);
    checkers.turnCount += 1;

    let follow = move;
    while (follow.capture) {
      const nextCaptures = getMovesForCheckersPiece(checkers.board, follow.to.row, follow.to.col).filter(
        (item) => item.capture
      );
      if (!nextCaptures.length) break;
      follow = nextCaptures[Math.floor(Math.random() * nextCaptures.length)];
      checkers.board = applyCheckersMove(checkers.board, follow);
      checkers.turnCount += 1;
    }

    const outcome = checkCheckersOutcome(checkers.board);
    if (outcome === "win") {
      finalizeGame("win", `${state.profile.name || "Voce"} segurou o tabuleiro melhor e venceu.`);
      return;
    }
    if (outcome === "loss") {
      finalizeGame("loss", `${game.opponent.name} dominou a ultima diagonal e venceu.`);
      return;
    }

    if (checkers.turnCount >= 60) {
      const playerPieces = countCheckersPieces(checkers.board, "player");
      const botPieces = countCheckersPieces(checkers.board, "opponent");
      if (playerPieces > botPieces) {
        finalizeGame("win", `${state.profile.name || "Voce"} terminou com mais pecas vivas e levou a mesa.`);
      } else if (botPieces > playerPieces) {
        finalizeGame("loss", `${game.opponent.name} sobrou com mais pecas e segurou o fim da mesa.`);
      } else {
        finalizeGame("tie", "A mesa de damas travou em equilibrio e a entrada voltou.");
      }
      return;
    }

    checkers.turn = "player";
    checkers.selected = null;
    checkers.validMoves = [];
    checkers.message = "Sua vez de novo. Clique numa peca azul.";
    renderGameModal();
  }

  function createCardsState() {
    const stateCards = {
      phase: "player",
      playerCards: [],
      botCards: [],
      drawCount: 0,
      message: "Compre ou pare. O alvo continua sendo 21 sem estourar."
    };
    stateCards.playerCards.push(drawCardsValue(stateCards));
    stateCards.playerCards.push(drawCardsValue(stateCards));
    stateCards.botCards.push(drawCardsValue(stateCards));
    stateCards.botCards.push(drawCardsValue(stateCards));
    return stateCards;
  }

  function createPokerState() {
    const deck = createPokerDeck();
    return {
      phase: "draw",
      deck,
      playerCards: drawPokerCards(deck, 5),
      botCards: drawPokerCards(deck, 5),
      held: [false, false, false, false, false],
      drawUsed: false,
      message: "Clique nas cartas que quer segurar e depois troque o resto."
    };
  }

  function createPokerDeck() {
    const suits = ["hearts", "diamonds", "clubs", "spades"];
    const ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
    const deck = [];
    suits.forEach((suit) => {
      ranks.forEach((rank) => deck.push({ suit, rank }));
    });
    for (let index = deck.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      const temp = deck[index];
      deck[index] = deck[swapIndex];
      deck[swapIndex] = temp;
    }
    return deck;
  }

  function drawPokerCards(deck, count) {
    const cards = [];
    for (let index = 0; index < count; index += 1) {
      const card = deck.pop();
      if (card) cards.push(card);
    }
    return cards;
  }

  function drawCardsValue(cardsState) {
    const deck = [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 11];
    const value = deck[Math.floor(Math.random() * deck.length)];
    cardsState.drawCount += 1;
    return value;
  }

  function sumCards(cards) {
    let total = cards.reduce((sum, card) => sum + card, 0);
    let aces = cards.filter((card) => card === 11).length;
    while (total > 21 && aces > 0) {
      total -= 10;
      aces -= 1;
    }
    return total;
  }

  function renderCardsGame(game) {
    const cards = game.tableState;
    const hideSecond = cards.phase === "player";
    const botTotal = sumCards(cards.botCards);
    const playerTotal = sumCards(cards.playerCards);

    return `
      <div class="pubpaid-cards-layout">
        <section class="pubpaid-cards-table pubpaid-minigame-frame">
          <div class="pubpaid-minigame-head">
            <strong>21 do Bar</strong>
            <span>Chegue o mais perto possivel de 21 sem estourar.</span>
          </div>
          <article class="pubpaid-card-hand">
            <strong>Mao da casa</strong>
            <div class="pubpaid-card-row">
              ${cards.botCards
                .map(
                  (card, index) =>
                    renderCardChip(card, hideSecond && index > 0)
                )
                .join("")}
            </div>
          </article>

          <article class="pubpaid-card-hand">
            <strong>Sua mao</strong>
            <div class="pubpaid-card-row">
              ${cards.playerCards.map((card) => renderCardChip(card, false)).join("")}
            </div>
          </article>
        </section>

        <section class="pubpaid-cards-info">
          <article>
            <span>status</span>
            <strong>${escapeHtml(cards.message)}</strong>
          </article>
          <article>
            <span>placar da mesa</span>
            <strong>${escapeHtml(String(playerTotal))} x ${escapeHtml(hideSecond ? `${cards.botCards[0]} + ?` : String(botTotal))}</strong>
          </article>
          <article>
            <span>pote</span>
            <strong>${escapeHtml(formatCoins(game.payout))}</strong>
          </article>
          <div class="pubpaid-card-actions">
            <button class="pubpaid-card-button" type="button" data-cards-action="hit" ${cards.phase !== "player" ? "disabled" : ""}>Comprar</button>
            <button class="pubpaid-card-button" type="button" data-cards-action="stand" ${cards.phase !== "player" ? "disabled" : ""}>Parar</button>
            <button class="pubpaid-card-button" type="button" data-abandon-game>Sair da mesa</button>
          </div>
        </section>
      </div>
    `;
  }

  function renderPokerGame(game) {
    const poker = game.tableState;
    const reveal = poker.phase === "showdown";
    const playerHand = evaluatePokerHand(poker.playerCards);
    const botHand = reveal ? evaluatePokerHand(poker.botCards) : null;

    return `
      <div class="pubpaid-poker-layout">
        <section class="pubpaid-cards-table pubpaid-minigame-frame">
          <div class="pubpaid-minigame-head">
            <strong>Poker da Mesa Redonda</strong>
            <span>Segure cartas, troque uma vez e feche a melhor mão.</span>
          </div>
          <article class="pubpaid-card-hand">
            <strong>Mao da casa</strong>
            <div class="pubpaid-card-row">
              ${poker.botCards.map((card, index) => renderPokerCard(card, !reveal, false, index, false)).join("")}
            </div>
          </article>
          <article class="pubpaid-card-hand">
            <strong>Sua mao</strong>
            <div class="pubpaid-card-row">
              ${poker.playerCards
                .map((card, index) => renderPokerCard(card, false, poker.held[index], index, poker.phase === "draw" && !poker.drawUsed))
                .join("")}
            </div>
          </article>
        </section>

        <section class="pubpaid-cards-info">
          <article>
            <span>status</span>
            <strong>${escapeHtml(poker.message)}</strong>
          </article>
          <article>
            <span>sua mão</span>
            <strong>${escapeHtml(playerHand.label)}</strong>
          </article>
          <article>
            <span>mesa</span>
            <strong>${escapeHtml(reveal && botHand ? `${playerHand.label} x ${botHand.label}` : "aguardando revelação")}</strong>
          </article>
          <div class="pubpaid-card-actions">
            <button class="pubpaid-card-button" type="button" data-poker-draw ${poker.phase !== "draw" || poker.drawUsed ? "disabled" : ""}>Trocar cartas</button>
            <button class="pubpaid-card-button" type="button" data-abandon-game>Sair da mesa</button>
          </div>
        </section>
      </div>
    `;
  }

  function renderPokerCard(card, hidden, held, index, interactive) {
    if (hidden) {
      return `
        <button class="pubpaid-poker-card is-hidden" type="button" disabled>
          <small>bar</small>
          <strong>?</strong>
          <small>sealed</small>
        </button>
      `;
    }

    const suitLabel = getPokerSuitSymbol(card.suit);
    const rankLabel = getPokerRankLabel(card.rank);
    const redSuit = card.suit === "hearts" || card.suit === "diamonds";

    return `
      <button
        class="pubpaid-poker-card ${held ? "is-held" : ""} ${redSuit ? "is-red" : ""}"
        type="button"
        ${interactive ? `data-poker-toggle="${index}"` : "disabled"}
      >
        <small>${escapeHtml(suitLabel)}</small>
        <strong>${escapeHtml(rankLabel)}</strong>
        <small>${held ? "segura" : escapeHtml(suitLabel)}</small>
      </button>
    `;
  }

  function handleCardsAction(action) {
    const game = runtime.activeGame;
    if (!game || game.id !== "cards21" || game.screen !== "playing") return;
    const cards = game.tableState;
    if (cards.phase !== "player") return;

    if (action === "hit") {
      cards.playerCards.push(drawCardsValue(cards));
      const total = sumCards(cards.playerCards);
      if (total > 21) {
        finalizeGame("loss", `${state.profile.name || "Voce"} estourou no 21 e soltou a mesa.`);
        return;
      }
      if (total === 21) {
        finalizeGame("win", `${state.profile.name || "Voce"} fechou 21 antes da banca.`);
        return;
      }
      cards.message = `Voce puxou mais uma carta e foi para ${total}.`;
      renderGameModal();
      return;
    }

    if (action === "stand") {
      cards.phase = "bot";
      cards.message = `${game.opponent.name} esta comprando a resposta.`;
      renderGameModal();
      runtime.gameTimer = window.setTimeout(runCardsBotTurn, 800);
    }
  }

  function runCardsBotTurn() {
    const game = runtime.activeGame;
    if (!game || game.id !== "cards21" || game.screen !== "playing") return;
    const cards = game.tableState;
    const playerTotal = sumCards(cards.playerCards);
    let botTotal = sumCards(cards.botCards);

    while (botTotal < 17 || (botTotal < playerTotal && playerTotal <= 21)) {
      cards.botCards.push(drawCardsValue(cards));
      botTotal = sumCards(cards.botCards);
      if (botTotal >= 21) break;
    }

    if (botTotal > 21) {
      finalizeGame("win", `${game.opponent.name} estourou e entregou a mesa do 21.`);
      return;
    }
    if (botTotal > playerTotal) {
      finalizeGame("loss", `${game.opponent.name} segurou cartas melhores e venceu no 21.`);
      return;
    }
    if (playerTotal > botTotal) {
      finalizeGame("win", `${state.profile.name || "Voce"} parou melhor e levou o 21 do bar.`);
      return;
    }
    finalizeGame("tie", "As duas maos fecharam no mesmo total e a entrada voltou.");
  }

  function handlePokerToggle(index) {
    const game = runtime.activeGame;
    if (!game || game.id !== "poker" || game.screen !== "playing") return;
    const poker = game.tableState;
    if (poker.phase !== "draw" || poker.drawUsed) return;
    if (index < 0 || index >= poker.held.length) return;
    poker.held[index] = !poker.held[index];
    poker.message = poker.held[index]
      ? "Carta marcada para ficar na mão."
      : "Carta liberada para troca.";
    renderGameModal();
  }

  function handlePokerDraw() {
    const game = runtime.activeGame;
    if (!game || game.id !== "poker" || game.screen !== "playing") return;
    const poker = game.tableState;
    if (poker.phase !== "draw" || poker.drawUsed) return;

    poker.playerCards = poker.playerCards.map((card, index) => (poker.held[index] ? card : drawPokerCards(poker.deck, 1)[0] || card));
    runPokerBotDraw(poker);
    poker.drawUsed = true;
    poker.phase = "showdown";

    const playerHand = evaluatePokerHand(poker.playerCards);
    const botHand = evaluatePokerHand(poker.botCards);
    poker.message = `${state.profile.name || "Voce"} fechou ${playerHand.label}. ${game.opponent.name} mostrou ${botHand.label}.`;
    renderGameModal();

    const result = comparePokerHands(playerHand, botHand);
    if (result > 0) {
      finalizeGame("win", `${state.profile.name || "Voce"} levou o poker com ${playerHand.label.toLowerCase()}.`);
      return;
    }
    if (result < 0) {
      finalizeGame("loss", `${game.opponent.name} segurou a mesa com ${botHand.label.toLowerCase()}.`);
      return;
    }
    finalizeGame("tie", `A mesa de poker empatou em ${playerHand.label.toLowerCase()}.`);
  }

  function runPokerBotDraw(poker) {
    const counts = countPokerRanks(poker.botCards);
    poker.botCards = poker.botCards.map((card) => (counts.get(card.rank) >= 2 ? card : drawPokerCards(poker.deck, 1)[0] || card));
  }

  function countPokerRanks(cards) {
    const counts = new Map();
    cards.forEach((card) => counts.set(card.rank, (counts.get(card.rank) || 0) + 1));
    return counts;
  }

  function evaluatePokerHand(cards) {
    const sorted = cards.slice().sort((a, b) => b.rank - a.rank);
    const ranks = sorted.map((card) => card.rank);
    const suits = sorted.map((card) => card.suit);
    const counts = Array.from(countPokerRanks(sorted).entries()).sort((a, b) => b[1] - a[1] || b[0] - a[0]);
    const uniqueRanks = Array.from(new Set(ranks)).sort((a, b) => b - a);
    const flush = suits.every((suit) => suit === suits[0]);
    const straight = isPokerStraight(uniqueRanks);

    if (flush && straight) {
      return { score: 8, label: "straight flush", tiebreak: [uniqueRanks[0] === 14 && uniqueRanks[1] === 5 ? 5 : uniqueRanks[0]] };
    }
    if (counts[0][1] === 4) {
      return { score: 7, label: "quadra", tiebreak: [counts[0][0], counts[1][0]] };
    }
    if (counts[0][1] === 3 && counts[1]?.[1] === 2) {
      return { score: 6, label: "full house", tiebreak: [counts[0][0], counts[1][0]] };
    }
    if (flush) {
      return { score: 5, label: "flush", tiebreak: uniqueRanks };
    }
    if (straight) {
      return { score: 4, label: "sequência", tiebreak: [uniqueRanks[0] === 14 && uniqueRanks[1] === 5 ? 5 : uniqueRanks[0]] };
    }
    if (counts[0][1] === 3) {
      return { score: 3, label: "trinca", tiebreak: [counts[0][0], ...uniqueRanks.filter((rank) => rank !== counts[0][0])] };
    }
    if (counts[0][1] === 2 && counts[1]?.[1] === 2) {
      const pairs = counts.filter((entry) => entry[1] === 2).map((entry) => entry[0]).sort((a, b) => b - a);
      const kicker = uniqueRanks.find((rank) => !pairs.includes(rank)) || 0;
      return { score: 2, label: "dois pares", tiebreak: [...pairs, kicker] };
    }
    if (counts[0][1] === 2) {
      return { score: 1, label: "par", tiebreak: [counts[0][0], ...uniqueRanks.filter((rank) => rank !== counts[0][0])] };
    }
    return { score: 0, label: "carta alta", tiebreak: uniqueRanks };
  }

  function isPokerStraight(uniqueRanks) {
    if (uniqueRanks.length !== 5) return false;
    for (let index = 0; index < uniqueRanks.length - 1; index += 1) {
      if (uniqueRanks[index] - 1 !== uniqueRanks[index + 1]) {
        return uniqueRanks.join(",") === "14,5,4,3,2";
      }
    }
    return true;
  }

  function comparePokerHands(a, b) {
    if (a.score !== b.score) return a.score > b.score ? 1 : -1;
    const maxLength = Math.max(a.tiebreak.length, b.tiebreak.length);
    for (let index = 0; index < maxLength; index += 1) {
      const left = a.tiebreak[index] || 0;
      const right = b.tiebreak[index] || 0;
      if (left !== right) return left > right ? 1 : -1;
    }
    return 0;
  }

  function getPokerRankLabel(rank) {
    if (rank === 14) return "A";
    if (rank === 13) return "K";
    if (rank === 12) return "Q";
    if (rank === 11) return "J";
    return String(rank);
  }

  function getPokerSuitSymbol(suit) {
    const map = {
      hearts: "copas",
      diamonds: "ouros",
      clubs: "paus",
      spades: "espadas"
    };
    return map[suit] || "naipe";
  }

  function createDiceState() {
    return {
      round: 1,
      playerScore: 0,
      botScore: 0,
      phase: "guess",
      playerGuess: 0,
      botGuess: 0,
      dice: [0, 0],
      total: 0,
      message: "Escolha a soma escondida sob os copos."
    };
  }

  function renderDiceGame(game) {
    const dice = game.tableState;
    return `
      <div class="pubpaid-dice-layout">
        <section class="pubpaid-dice-stage pubpaid-minigame-frame">
          <div class="pubpaid-minigame-head">
            <strong>Copos e Dados</strong>
            <span>Escolha a soma e veja quem ficou mais perto do total escondido.</span>
          </div>
          <div class="pubpaid-dice-cups">
            <article class="pubpaid-dice-cup"><span>copo 1</span></article>
            <article class="pubpaid-dice-cup"><span>copo 2</span></article>
            <article class="pubpaid-dice-cup"><span>soma</span></article>
          </div>

          ${
            dice.phase === "reveal"
              ? `
                <div class="pubpaid-dice-reveal">
                  ${renderDieFace(dice.dice[0], "dado 1")}
                  ${renderDieFace(dice.dice[1], "dado 2")}
                  ${renderDieFace(dice.total > 6 ? 6 : dice.total, `soma ${dice.total}`)}
                </div>
              `
              : ""
          }
        </section>

        <section class="pubpaid-dice-scoreboard">
          <article>
            <span>rodada</span>
            <strong>${escapeHtml(String(dice.round))}/3</strong>
          </article>
          <article>
            <span>placar</span>
            <strong>${escapeHtml(String(dice.playerScore))} x ${escapeHtml(String(dice.botScore))}</strong>
          </article>
          <article>
            <span>status</span>
            <strong>${escapeHtml(dice.message)}</strong>
          </article>
          ${
            dice.phase === "guess"
              ? `
                <div class="pubpaid-dice-grid">
                  ${Array.from({ length: 11 }, (_, index) => index + 2)
                    .map(
                      (value) =>
                        `<button class="pubpaid-dice-button${dice.playerGuess === value ? " is-active" : ""}" type="button" data-dice-guess="${value}">${value}</button>`
                    )
                    .join("")}
                </div>
              `
              : `
                <div class="pubpaid-card-actions">
                  ${
                    dice.round < 3
                      ? '<button class="pubpaid-card-button" type="button" data-dice-next>Proxima rodada</button>'
                      : ""
                  }
                  <button class="pubpaid-card-button" type="button" data-abandon-game>Sair da mesa</button>
                </div>
              `
          }
        </section>
      </div>
    `;
  }

  function handleDiceGuess(guess) {
    const game = runtime.activeGame;
    if (!game || game.id !== "dicecups" || game.screen !== "playing") return;
    const dice = game.tableState;
    if (dice.phase !== "guess") return;

    dice.playerGuess = guess;
    dice.botGuess = pickBotDiceGuess(guess);
    dice.dice = [randomDie(), randomDie()];
    dice.total = dice.dice[0] + dice.dice[1];

    const playerDiff = Math.abs(dice.playerGuess - dice.total);
    const botDiff = Math.abs(dice.botGuess - dice.total);

    if (playerDiff < botDiff) {
      dice.playerScore += 1;
      dice.message = `${state.profile.name || "Voce"} ficou mais perto da soma ${dice.total}.`;
    } else if (botDiff < playerDiff) {
      dice.botScore += 1;
      dice.message = `${game.opponent.name} leu melhor os copos e pegou a rodada.`;
    } else {
      dice.message = `Os dois ficaram na mesma distancia da soma ${dice.total}.`;
    }

    dice.phase = "reveal";
    renderGameModal();

    if (dice.round === 3) {
      runtime.gameTimer = window.setTimeout(() => {
        if (!runtime.activeGame || runtime.activeGame.id !== "dicecups") return;
        if (dice.playerScore > dice.botScore) {
          finalizeGame("win", `${state.profile.name || "Voce"} leu melhor os copos e venceu a serie.`);
        } else if (dice.botScore > dice.playerScore) {
          finalizeGame("loss", `${game.opponent.name} ganhou mais leituras e fechou os copos.`);
        } else {
          finalizeGame("tie", "Os copos fecharam em igualdade e a entrada voltou.");
        }
      }, 1000);
    }
  }

  function advanceDiceRound() {
    const game = runtime.activeGame;
    if (!game || game.id !== "dicecups" || game.screen !== "playing") return;
    const dice = game.tableState;
    if (dice.phase !== "reveal" || dice.round >= 3) return;

    dice.round += 1;
    dice.phase = "guess";
    dice.playerGuess = 0;
    dice.botGuess = 0;
    dice.dice = [0, 0];
    dice.total = 0;
    dice.message = "Nova rodada. Escolha outra soma escondida.";
    renderGameModal();
  }

  function pickBotDiceGuess(playerGuess) {
    let guess = clampInteger(playerGuess + (Math.floor(Math.random() * 7) - 3));
    if (guess < 2) guess = 2;
    if (guess > 12) guess = 12;
    return guess;
  }

  function randomDie() {
    return 1 + Math.floor(Math.random() * 6);
  }

  function createSlotsState() {
    return {
      reels: ["star", "bar", "cherry"],
      phase: "ready",
      spins: 0,
      round: 1,
      maxRounds: 3,
      playerRounds: 0,
      houseRounds: 0,
      pushRounds: 0,
      message: "Puxe a alavanca para começar uma série de 3 giros.",
      payoutLabel: "Sem premio na ultima rodada.",
      lastMatch: "",
      lastRoundResult: ""
    };
  }

  function renderSlotsGame(game) {
    const slots = game.tableState;
    const spinDisabled = slots.phase === "spinning";
    const reelMarkup = slots.reels.map((symbol, index) => renderSlotReel(symbol, index)).join("");

    return `
      <div class="pubpaid-slots-layout">
        <section class="pubpaid-slots-stage pubpaid-minigame-frame">
          <div class="pubpaid-minigame-head">
            <strong>Caça-Níqueis Neon</strong>
            <span>Puxe a alavanca e alinhe simbolos iguais na linha central.</span>
          </div>
          <div class="pubpaid-slots-machine${slots.phase === "spinning" ? " is-spinning" : ""}">
            <div class="pubpaid-slots-top">
              <span>pixel jackpot</span>
              <strong>${escapeHtml(formatCoins(game.payout))}</strong>
            </div>
            <div class="pubpaid-slots-window">
              ${reelMarkup}
            </div>
            <div class="pubpaid-slots-bottom">
              <span class="pubpaid-slots-led">${escapeHtml(slots.lastMatch || "linha central")}</span>
              <button class="pubpaid-slots-lever" type="button" data-slot-spin ${spinDisabled ? "disabled" : ""}>
                <span></span>
                Puxar alavanca
              </button>
            </div>
          </div>
        </section>

        <section class="pubpaid-slots-side">
          <article>
            <span>status</span>
            <strong>${escapeHtml(slots.message)}</strong>
            <p>${escapeHtml(slots.payoutLabel)}</p>
          </article>
          <article>
            <span>série</span>
            <strong>${escapeHtml(`${slots.round}/${slots.maxRounds}`)}</strong>
            <p>Voce precisa vencer mais giros do que a maquina para fechar a cabine em alta.</p>
          </article>
          <article>
            <span>placar</span>
            <strong>${escapeHtml(`${slots.playerRounds} x ${slots.houseRounds}`)}</strong>
            <p>Trinca ou dupla forte contam ponto. Cereja segura empate no giro.</p>
          </article>
          <div class="pubpaid-card-actions">
            ${
              slots.phase === "settled" && slots.round < slots.maxRounds
                ? '<button class="pubpaid-card-button" type="button" data-slot-next>Próximo giro</button>'
                : `<button class="pubpaid-card-button" type="button" data-slot-spin ${spinDisabled ? "disabled" : ""}>Girar agora</button>`
            }
            <button class="pubpaid-card-button" type="button" data-abandon-game>Sair da maquina</button>
          </div>
        </section>
      </div>
    `;
  }

  function renderSlotReel(symbol, index) {
    const spec = getSlotSymbolSpec(symbol);
    return `
      <article class="pubpaid-slot-reel" data-slot-reel="${index}">
        <div class="pubpaid-slot-icon is-${escapeHtml(symbol)}">
          <span class="pubpaid-slot-fruit" aria-hidden="true">${escapeHtml(spec.icon)}</span>
        </div>
        <strong>${escapeHtml(spec.label)}</strong>
      </article>
    `;
  }

  function handleSlotsSpin() {
    const game = runtime.activeGame;
    if (!game || game.id !== "slots" || game.screen !== "playing") return;
    const slots = game.tableState;
    if (slots.phase === "spinning") return;

    slots.phase = "spinning";
    slots.message = "A alavanca desceu e a maquina esta correndo.";
    slots.payoutLabel = "Os rolos estao embaralhando a sorte da casa.";
    slots.spins += 1;
    renderGameModal();

    runtime.gameTimer = window.setTimeout(() => {
      const activeGame = runtime.activeGame;
      if (!activeGame || activeGame.id !== "slots" || activeGame.screen !== "playing") return;
      resolveSlotsSpin();
    }, 900);
  }

  function resolveSlotsSpin() {
    const game = runtime.activeGame;
    if (!game || game.id !== "slots" || game.screen !== "playing") return;
    const slots = game.tableState;
    const reels = createSlotRoll(game.fortune);
    const first = reels[0];
    const second = reels[1];
    const third = reels[2];
    let result = "loss";
    let summary = "A maquina girou seca e ficou com a aposta.";
    let payoutLabel = "Nenhuma linha premiada dessa vez.";
    let lastMatch = "sem combinacao";

    if (first === second && second === third) {
      result = "win";
      slots.playerRounds += 1;
      summary = `${state.profile.name || "Voce"} alinhou tres ${getSlotSymbolSpec(first).label.toLowerCase()} e estourou o jackpot curto da casa.`;
      payoutLabel = "Trinca premiada: giro vencido com força total.";
      lastMatch = `trinca de ${getSlotSymbolSpec(first).label.toLowerCase()}`;
    } else if (first === second || second === third || first === third) {
      result = "win";
      slots.playerRounds += 1;
      summary = `${state.profile.name || "Voce"} puxou uma dupla forte e arrancou um premio rapido da maquina.`;
      payoutLabel = "Dupla premiada: ponto seu na série.";
      lastMatch = "dupla acesa";
    } else if (reels.includes("cherry")) {
      result = "tie";
      slots.pushRounds += 1;
      summary = "Uma cereja apareceu no visor e a maquina devolveu sua entrada.";
      payoutLabel = "Cereja viva: giro empatado.";
      lastMatch = "cereja salvou";
    } else {
      slots.houseRounds += 1;
    }

    slots.reels = reels;
    slots.phase = "settled";
    slots.message = summary;
    slots.payoutLabel = payoutLabel;
    slots.lastMatch = lastMatch;
    slots.lastRoundResult = result;
    renderGameModal();

    if (slots.round >= slots.maxRounds) {
      if (slots.playerRounds > slots.houseRounds) {
        game.payout = Math.max(game.stake * 3 - Math.round(game.stake * 0.08), game.stake * 2);
        finalizeGame("win", `${state.profile.name || "Voce"} venceu a série da máquina por ${slots.playerRounds} a ${slots.houseRounds}.`);
      } else if (slots.houseRounds > slots.playerRounds) {
        game.payout = 0;
        finalizeGame("loss", `A máquina fechou a série por ${slots.houseRounds} a ${slots.playerRounds} e segurou a cabine.`);
      } else {
        game.payout = 0;
        finalizeGame("tie", `A série da máquina travou em ${slots.playerRounds} a ${slots.houseRounds} e a entrada voltou.`);
      }
    }
  }

  function advanceSlotsRound() {
    const game = runtime.activeGame;
    if (!game || game.id !== "slots" || game.screen !== "playing") return;
    const slots = game.tableState;
    if (slots.phase !== "settled" || slots.round >= slots.maxRounds) return;

    slots.round += 1;
    slots.phase = "ready";
    slots.reels = ["star", "bar", "cherry"];
    slots.message = `Giro ${slots.round} de ${slots.maxRounds}. A máquina abriu outra janela.`;
    slots.payoutLabel = `Placar atual: ${slots.playerRounds} x ${slots.houseRounds}.`;
    slots.lastMatch = "";
    renderGameModal();
  }

  function createSlotRoll(fortune) {
    const symbols = ["cherry", "bar", "star", "seven", "bell"];
    const reels = [
      pickSlotSymbol(symbols, fortune, 0),
      pickSlotSymbol(symbols, fortune, 1),
      pickSlotSymbol(symbols, fortune, 2)
    ];

    if (fortune?.mood === "good" && Math.random() < 0.45) {
      reels[1] = reels[0];
    }
    if (fortune?.mood === "good" && Math.random() < 0.22) {
      reels[2] = reels[1];
    }
    if (fortune?.mood === "bad" && reels[0] === reels[1] && Math.random() < 0.6) {
      reels[2] = symbols[(symbols.indexOf(reels[0]) + 2) % symbols.length];
    }

    return reels;
  }

  function pickSlotSymbol(symbols, fortune, reelIndex) {
    const weighted = [
      { id: "cherry", weight: 28 },
      { id: "bar", weight: 23 },
      { id: "star", weight: 19 },
      { id: "bell", weight: 16 },
      { id: "seven", weight: 14 }
    ];
    if (fortune?.mood === "good") {
      weighted[0].weight += 4;
      weighted[2].weight += 3;
      weighted[4].weight += 2;
    } else if (fortune?.mood === "bad") {
      weighted[1].weight += 3;
      weighted[3].weight += 2;
      weighted[4].weight -= 3;
    }

    let total = 0;
    weighted.forEach((entry) => {
      total += Math.max(1, entry.weight + (reelIndex === 2 && entry.id === "seven" ? -1 : 0));
    });
    let roll = Math.random() * total;
    for (const entry of weighted) {
      roll -= Math.max(1, entry.weight + (reelIndex === 2 && entry.id === "seven" ? -1 : 0));
      if (roll <= 0) return entry.id;
    }
    return symbols[0];
  }

  function getSlotSymbolSpec(symbol) {
    const specs = {
      cherry: { icon: "🍒", label: "Cereja" },
      bar: { icon: "🍋", label: "Limao" },
      star: { icon: "🍉", label: "Melancia" },
      seven: { icon: "🍇", label: "Uva" },
      bell: { icon: "🔔", label: "Sino" }
    };
    return specs[symbol] || specs.cherry;
  }

  function createRouletteState() {
    return {
      phase: "ready",
      round: 1,
      maxRounds: 3,
      playerRounds: 0,
      botRounds: 0,
      playerNumber: null,
      botNumber: null,
      pointerRotation: -28,
      message: "Gire a roleta. Agora a mesa fecha em melhor de 3.",
      resultLine: "Quem vencer mais giros leva a mesa."
    };
  }

  function renderRouletteGame(game) {
    const roulette = game.tableState;
    const canSpin = roulette.phase !== "spinning";
    const rotation = Number.isFinite(roulette.pointerRotation) ? roulette.pointerRotation : -28;

    return `
      <div class="pubpaid-roulette-layout">
        <section class="pubpaid-roulette-stage pubpaid-minigame-frame">
          <div class="pubpaid-minigame-head">
            <strong>Roleta Alta</strong>
            <span>Cada lado tira um numero de 0 a 36. O maior vence.</span>
          </div>
          <div class="pubpaid-roulette-table">
            <div class="pubpaid-roulette-wheel${roulette.phase === "spinning" ? " is-spinning" : ""}">
              <div class="pubpaid-roulette-ring"></div>
              <div class="pubpaid-roulette-pointer" style="transform: rotate(${rotation}deg)"></div>
              <div class="pubpaid-roulette-center">${escapeHtml(String(roulette.playerNumber ?? "?"))}</div>
            </div>
            <div class="pubpaid-roulette-track">
              ${Array.from({ length: 12 }, (_, index) => `<span>${escapeHtml(String(index * 3))}</span>`).join("")}
            </div>
          </div>
        </section>

        <section class="pubpaid-roulette-side">
          <article>
            <span>seu giro</span>
            <strong>${escapeHtml(roulette.playerNumber === null ? "?" : String(roulette.playerNumber))}</strong>
            <p>${escapeHtml(roulette.message)}</p>
          </article>
          <article>
            <span>giro da casa</span>
            <strong>${escapeHtml(roulette.botNumber === null ? "?" : String(roulette.botNumber))}</strong>
            <p>${escapeHtml(roulette.resultLine)}</p>
          </article>
          <article>
            <span>série</span>
            <strong>${escapeHtml(`${roulette.playerRounds} x ${roulette.botRounds}`)}</strong>
            <p>Giro ${escapeHtml(`${roulette.round}/${roulette.maxRounds}`)}. Quem fechar mais alto mais vezes leva a mesa.</p>
          </article>
          <div class="pubpaid-card-actions">
            ${
              roulette.phase === "settled" && roulette.round < roulette.maxRounds
                ? '<button class="pubpaid-card-button" type="button" data-roulette-next>Próximo giro</button>'
                : `<button class="pubpaid-card-button" type="button" data-roulette-spin ${canSpin ? "" : "disabled"}>Girar roleta</button>`
            }
            <button class="pubpaid-card-button" type="button" data-abandon-game>Sair da mesa</button>
          </div>
        </section>
      </div>
    `;
  }

  function handleRouletteSpin() {
    const game = runtime.activeGame;
    if (!game || game.id !== "roulette" || game.screen !== "playing") return;
    const roulette = game.tableState;
    if (roulette.phase === "spinning") return;

    roulette.phase = "spinning";
    roulette.message = "A bola correu na borda e esta procurando o seu numero.";
    roulette.resultLine = `${game.opponent.name} tambem entrou no giro.`;
    roulette.playerNumber = null;
    roulette.botNumber = null;
    roulette.pointerRotation = 240 + Math.random() * 520;
    renderGameModal();

    runtime.gameTimer = window.setTimeout(() => {
      const activeGame = runtime.activeGame;
      if (!activeGame || activeGame.id !== "roulette" || activeGame.screen !== "playing") return;
      resolveRouletteRound();
    }, 1150);
  }

  function resolveRouletteRound() {
    const game = runtime.activeGame;
    if (!game || game.id !== "roulette" || game.screen !== "playing") return;
    const roulette = game.tableState;
    const playerNumber = rollRouletteNumber(game.fortune, true);
    const botNumber = rollRouletteNumber(game.fortune, false);
    roulette.playerNumber = playerNumber;
    roulette.botNumber = botNumber;
    roulette.phase = "settled";
    roulette.pointerRotation = (playerNumber / 36) * 360 - 90;

    if (playerNumber > botNumber) {
      roulette.playerRounds += 1;
      roulette.message = `${state.profile.name || "Voce"} fechou ${playerNumber} e passou a casa.`;
      roulette.resultLine = `${game.opponent.name} ficou em ${botNumber}.`;
      renderGameModal();
      if (roulette.round >= roulette.maxRounds) {
        game.payout = Math.max(game.stake * 2.7 - Math.round(game.stake * 0.06), game.stake * 2);
        finalizeGame("win", `${state.profile.name || "Voce"} venceu a série da roleta por ${roulette.playerRounds} a ${roulette.botRounds}.`);
      }
      return;
    }

    if (botNumber > playerNumber) {
      roulette.botRounds += 1;
      roulette.message = `${game.opponent.name} tirou ${botNumber} e ficou acima do seu giro.`;
      roulette.resultLine = `${state.profile.name || "Voce"} parou em ${playerNumber}.`;
      renderGameModal();
      if (roulette.round >= roulette.maxRounds) {
        game.payout = 0;
        finalizeGame("loss", `${game.opponent.name} venceu a série da roleta por ${roulette.botRounds} a ${roulette.playerRounds}.`);
      }
      return;
    }

    roulette.message = `Os dois bateram ${playerNumber}.`;
    roulette.resultLine = "Empate seco neste giro. A série continua.";
    renderGameModal();
    if (roulette.round >= roulette.maxRounds) {
      if (roulette.playerRounds > roulette.botRounds) {
        game.payout = Math.max(game.stake * 2.7 - Math.round(game.stake * 0.06), game.stake * 2);
        finalizeGame("win", `${state.profile.name || "Voce"} venceu a série da roleta por ${roulette.playerRounds} a ${roulette.botRounds}.`);
      } else if (roulette.botRounds > roulette.playerRounds) {
        game.payout = 0;
        finalizeGame("loss", `${game.opponent.name} venceu a série da roleta por ${roulette.botRounds} a ${roulette.playerRounds}.`);
      } else {
        game.payout = 0;
        finalizeGame("tie", `A série da roleta empatou em ${roulette.playerRounds} a ${roulette.botRounds}.`);
      }
    }
  }

  function advanceRouletteRound() {
    const game = runtime.activeGame;
    if (!game || game.id !== "roulette" || game.screen !== "playing") return;
    const roulette = game.tableState;
    if (roulette.phase !== "settled" || roulette.round >= roulette.maxRounds) return;

    roulette.round += 1;
    roulette.phase = "ready";
    roulette.playerNumber = null;
    roulette.botNumber = null;
    roulette.pointerRotation = -28;
    roulette.message = `Novo giro aberto. Série em ${roulette.playerRounds} a ${roulette.botRounds}.`;
    roulette.resultLine = `${roulette.maxRounds - roulette.round + 1} giro(s) restante(s) para fechar a mesa.`;
    renderGameModal();
  }

  function rollRouletteNumber(fortune, isPlayer) {
    const base = Math.floor(Math.random() * 37);
    if (!fortune || fortune.mood === "neutral") return base;
    if (fortune.mood === "good" && isPlayer) {
      return Math.min(36, base + 3 + Math.floor(Math.random() * 7));
    }
    if (fortune.mood === "bad" && isPlayer) {
      return Math.max(0, base - (3 + Math.floor(Math.random() * 7)));
    }
    if (fortune.mood === "good" && !isPlayer) {
      return Math.max(0, base - (1 + Math.floor(Math.random() * 5)));
    }
    if (fortune.mood === "bad" && !isPlayer) {
      return Math.min(36, base + 1 + Math.floor(Math.random() * 5));
    }
    return base;
  }

  function clearGameTimer() {
    if (runtime.gameTimer) {
      window.clearTimeout(runtime.gameTimer);
      runtime.gameTimer = null;
    }
  }

  function resetDemo() {
    stopMusic();
    clearGameTimer();
    window.localStorage.removeItem(STORAGE_KEY);
    state = createInitialState();
    runtime.activeGame = null;
    refs.gameModal.hidden = true;
    if (refs.shopModal) refs.shopModal.hidden = true;
    if (refs.tutorialModal) refs.tutorialModal.hidden = true;
    refs.profileModal.hidden = true;
    clearPressedDirections();
    clearPoolRefs();
    resetScenePosition();
    renderAll();
    setWorldMessage("A ficha, o saldo e o historico voltaram ao zero.", 2600);
  }

  function normalizeArchetype(value) {
    const key = String(value || "").trim();
    return PALETTES[key] ? key : "neon";
  }

  function normalizeGameId(value) {
    const key = String(value || "").trim();
    return TABLE_META[key] ? key : "pool";
  }

  function clampMoney(value) {
    const amount = clampInteger(value);
    const normalized = DEMO_STAKES.find((stake) => stake === amount);
    return normalized || DEMO_STAKES[0];
  }

  function renderCardChip(value, hidden) {
    if (hidden) {
      return `
        <span class="pubpaid-card-chip is-hidden">
          <small>bar</small>
          <strong>?</strong>
          <small>sealed</small>
        </span>
      `;
    }

    return `
      <span class="pubpaid-card-chip">
        <small>${escapeHtml(getCardTone(value))}</small>
        <strong>${escapeHtml(getCardFace(value))}</strong>
        <small>${escapeHtml(String(value))}</small>
      </span>
    `;
  }

  function getCardFace(value) {
    if (value === 11) return "A";
    if (value === 10) return "K";
    return String(value);
  }

  function getCardTone(value) {
    if (value === 11) return "ace";
    if (value === 10) return "face";
    return "draw";
  }

  function renderDieFace(value, label) {
    const normalized = Math.max(1, Math.min(6, clampInteger(value)));
    const active = getDiePipMap(normalized);
    return `
      <span class="pubpaid-die" aria-label="${escapeHtml(label)}">
        <span class="pubpaid-die-grid">
          ${Array.from({ length: 9 }, (_, index) => `<i class="${active.includes(index) ? "is-on" : ""}"></i>`).join("")}
        </span>
        <small>${escapeHtml(label)}</small>
      </span>
    `;
  }

  function getDiePipMap(value) {
    const maps = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8]
    };
    return maps[value] || maps[1];
  }

  function clampInteger(value) {
    const number = Number.parseInt(String(value || "0"), 10);
    return Number.isFinite(number) ? number : 0;
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function formatCoins(value) {
    return `${clampInteger(value)} moedas`;
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function setText(node, value) {
    if (!node) return;
    const text = String(value || "");
    if (node.textContent !== text) node.textContent = text;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  init();
})();
