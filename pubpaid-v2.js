(function () {
  const canvas = document.querySelector("[data-ppv2-canvas]");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const modal = document.querySelector("[data-test-modal]");
  const prompt = document.querySelector("[data-prompt]");
  const sceneName = document.querySelector("[data-scene-name]");
  const modeName = document.querySelector("[data-mode-name]");
  const testCoins = document.querySelector("[data-test-coins]");
  const realCoins = document.querySelector("[data-real-coins]");
  const focusName = document.querySelector("[data-focus-name]");
  const microPanel = document.querySelector("[data-micro-panel]");
  const panelKicker = document.querySelector("[data-panel-kicker]");
  const panelTitle = document.querySelector("[data-panel-title]");
  const panelBody = document.querySelector("[data-panel-body]");
  const panelChips = document.querySelector("[data-panel-chips]");
  const panelActions = document.querySelector("[data-panel-actions]");

  ctx.imageSmoothingEnabled = false;

  const state = {
    scene: "street",
    mode: "teste seguro",
    testCoins: 100,
    realCoins: 0,
    player: { x: 176, y: 560, targetX: 176, targetY: 560, step: 0, facing: "right" },
    selectedTable: "darts",
    started: false,
    tick: 0,
    viewport: { width: 1280, height: 720, compactHud: false },
    focusLabel: "porta principal",
    interactionCooldownUntil: 0,
    activePanelId: null,
    stageEventActive: false,
    loungeQueue: null
  };

  const assets = {
    street: new Image(),
    interior: new Image()
  };

  assets.street.src = "./assets/pubpaid-v2-street-bg-v1.png";
  assets.interior.src = "./assets/pubpaid-interior-v5.png";

  const spriteCache = {
    player: createPlayerSpriteSheet(),
    npc: createNpcSprites(),
    cars: createCarSprites(),
    bartender: createBartenderSprite(),
    singer: createSingerSprite(),
    lounge: createLoungeSprites()
  };

  const tableCopy = {
    darts: "Dardos abre o teste real por ser rápido, competitivo e auditável por pontuação/hitbox.",
    checkers: "Dama é a mesa mais limpa para escrow: sem RNG, turno claro e abandono simples.",
    truco: "Truco entra depois do núcleo PvP: deck no servidor, manilha registrada e log de vazas.",
    poker: "Poker exige embaralhamento auditável e replay mínimo antes de usar saldo real."
  };

  const panelCopy = {
    bartender: {
      kicker: "balcão",
      title: "Bartender operacional",
      body:
        "O bartender vira hub de onboarding rápido: explica saldo de teste, sugere a mesa do momento e no futuro pode abrir drinks, mini buffs visuais e atalhos de tutorial.",
      chips: ["tutorial rápido", "drinks", "mesa sugerida"],
      actions: [
        { label: "Recarregar teste", action: "reset-test", primary: true },
        { label: "Sugerir mesa", action: "suggest-table" }
      ]
    },
    stage: {
      kicker: "palco",
      title: "Cantora ao vivo",
      body:
        "O palco pode comandar eventos do salão. Aqui entram shows, clima da noite, buffs visuais temporários e chamadas especiais para atrair o jogador para certas zonas.",
      chips: ["evento", "crowd mood", "buff visual"],
      actions: [
        { label: "Ativar evento", action: "toggle-stage-event", primary: true }
      ]
    },
    "lounge-west": {
      kicker: "lounge",
      title: "Mesa oeste",
      body:
        "A mesa oeste funciona bem como espaço de boatos, missões leves e dicas de navegação. É uma zona mais de descoberta do que de competição direta.",
      chips: ["dicas", "segredos", "missões leves"],
      actions: [
        { label: "Entrar na fila casual", action: "queue-casual", primary: true },
        { label: "Focar Dama", action: "pick-checkers" }
      ]
    },
    "lounge-east": {
      kicker: "premium",
      title: "Mesa leste",
      body:
        "A mesa leste é um bom núcleo para social premium, matchmaking diegético e leitura do salão. Também pode virar área de espera para partidas reais.",
      chips: ["matchmaking", "social", "espera de mesa"],
      actions: [
        { label: "Entrar na fila premium", action: "queue-premium", primary: true },
        { label: "Focar Poker", action: "pick-poker" }
      ]
    },
    "exit-street": {
      kicker: "saída",
      title: "Volta para a rua",
      body:
        "A saída rápida mantém a sensação de mundo conectado. No futuro ela liga a rua a outros prédios, becos, ranking, fast travel e novos minijogos.",
      chips: ["cidade viva", "atalhos", "loop urbano"]
    }
  };

  const interiorProps = [
    {
      id: "bartender",
      label: "balcão do bartender",
      x: 178,
      y: 248,
      radius: 90,
      hint: "Chegue perto do balcão e aperte Enter/OK para ouvir dicas.",
      action() {
        openPanel("bartender");
        setPrompt("Bartender: hoje a mesa de Dardos está mais rápida para teste e feedback.");
      }
    },
    {
      id: "stage",
      label: "palco da cantora",
      x: 1060,
      y: 248,
      radius: 88,
      hint: "A cantora pode virar evento, buff visual e gatilho social depois.",
      action() {
        openPanel("stage");
        setPrompt("Cantora: show ao vivo ligado. No futuro daqui saem eventos, sorte visual e crowd mood.");
      }
    },
    {
      id: "lounge-west",
      label: "mesa lounge oeste",
      x: 320,
      y: 488,
      radius: 84,
      hint: "Mesa casual para dicas, social e pequenos segredos.",
      action() {
        openPanel("lounge-west");
        setPrompt("Clientes da mesa oeste: falaram de atalhos, segredos do beco e missões leves para iniciantes.");
      }
    },
    {
      id: "lounge-east",
      label: "mesa lounge leste",
      x: 864,
      y: 474,
      radius: 86,
      hint: "Mesa premium pensada para social, matchmaking e leitura do salão.",
      action() {
        openPanel("lounge-east");
        setPrompt("Mesa leste: aqui pode nascer um matchmaking diegético entre jogadores reais e espectadores.");
      }
    },
    {
      id: "exit-street",
      label: "saída para rua",
      x: 640,
      y: 560,
      radius: 96,
      hint: "Volta rápida para a rua viva.",
      action() {
        goToStreet("De volta à rua. Futuramente ela fecha um círculo com outras áreas da cidade.");
      }
    }
  ];

  function drawPixelRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function createPixelCanvas(width, height, painter) {
    const spriteCanvas = document.createElement("canvas");
    spriteCanvas.width = width;
    spriteCanvas.height = height;
    const spriteCtx = spriteCanvas.getContext("2d");
    spriteCtx.imageSmoothingEnabled = false;
    painter(spriteCtx);
    return spriteCanvas;
  }

  function createPlayerSpriteSheet() {
    const frameWidth = 32;
    const frameHeight = 48;
    const framesPerDir = 3;
    const sheet = createPixelCanvas(frameWidth * 4 * framesPerDir, frameHeight * 2, (sheetCtx) => {
      const dirs = ["down", "left", "right", "up"];
      const bodyMap = {
        teste: "#5b5263",
        real: "#50efff"
      };

      function px(frameX, frameY, color, cells) {
        sheetCtx.fillStyle = color;
        cells.forEach(([x, y, w = 1, h = 1]) => {
          sheetCtx.fillRect(frameX + x * 2, frameY + y * 2, w * 2, h * 2);
        });
      }

      function drawFrame(frameIndex, rowIndex, facing, palette, strideIndex) {
        const originX = (frameIndex * framesPerDir + strideIndex) * frameWidth;
        const originY = rowIndex * frameHeight;
        const strideOffset = strideIndex === 1 ? 0 : strideIndex === 0 ? -1 : 1;
        px(originX, originY, "#00000055", [[11, 22, 6, 1]]);
        px(originX, originY, "#2b1a23", [[10, 1, 6, 1], [9, 2, 8, 1]]);
        px(originX, originY, "#d89a6d", [
          [10, 3, 6, 1],
          [9, 4, 8, 3],
          [10, 7, 6, 1]
        ]);
        px(originX, originY, "#f6d8b4", [[10, 4, 1, 1], [15, 4, 1, 1]]);
        px(originX, originY, bodyMap[palette], [
          [9, 8, 8, 1],
          [8, 9, 10, 4],
          [9, 13, 8, 2]
        ]);
        px(originX, originY, "#342d41", [[7, 9, 1, 5], [18, 9, 1, 5]]);
        px(originX, originY, "#1d2435", [
          [10 + Math.max(0, -strideOffset), 15, 3, 5],
          [14 + Math.max(0, strideOffset), 15, 3, 5]
        ]);
        px(originX, originY, "#0b0e16", [
          [10 + Math.max(0, -strideOffset), 20, 3, 1],
          [14 + Math.max(0, strideOffset), 20, 3, 1]
        ]);
        px(originX, originY, "#ffd06d", [[11, 10, 4, 1]]);
        if (facing === "left") {
          px(originX, originY, "#50efff", [[7, 11, 2, 1]]);
        } else if (facing === "right") {
          px(originX, originY, "#50efff", [[17, 11, 2, 1]]);
        } else if (facing === "up") {
          px(originX, originY, "#50efff", [[12, 2, 2, 1]]);
        } else {
          px(originX, originY, "#ff4fb8", [[11, 14, 4, 1]]);
        }
      }

      dirs.forEach((dir, index) => {
        for (let strideIndex = 0; strideIndex < framesPerDir; strideIndex += 1) {
          drawFrame(index, 0, dir, "teste", strideIndex);
          drawFrame(index, 1, dir, "real", strideIndex);
        }
      });
    });

    return {
      sheet,
      frameWidth,
      frameHeight,
      framesPerDir
    };
  }

  function createNpcSprites() {
    const palettes = [
      { shirt: "#8ef0a3", accent: "#e9fff0", hair: "#2f1c1c" },
      { shirt: "#ffcf6d", accent: "#fff2cb", hair: "#4d3320" },
      { shirt: "#ff6c7a", accent: "#ffe3e7", hair: "#271726" }
    ];

    return palettes.map((palette) =>
      createPixelCanvas(28, 44, (spriteCtx) => {
        spriteCtx.fillStyle = "#00000055";
        spriteCtx.fillRect(8, 38, 12, 2);
        spriteCtx.fillStyle = palette.hair;
        spriteCtx.fillRect(9, 2, 10, 4);
        spriteCtx.fillStyle = "#d89a6d";
        spriteCtx.fillRect(8, 6, 12, 10);
        spriteCtx.fillStyle = palette.accent;
        spriteCtx.fillRect(10, 9, 2, 2);
        spriteCtx.fillRect(16, 9, 2, 2);
        spriteCtx.fillStyle = palette.shirt;
        spriteCtx.fillRect(6, 16, 16, 14);
        spriteCtx.fillStyle = "#20283b";
        spriteCtx.fillRect(8, 30, 4, 8);
        spriteCtx.fillRect(16, 30, 4, 8);
        spriteCtx.fillStyle = "#fff6d8";
        spriteCtx.fillRect(22, 17, 3, 3);
      })
    );
  }

  function createCarSprites() {
    const carPalettes = [
      { body: "#ff4fb8", roof: "#1af2ff", bumper: "#5f1d48" },
      { body: "#50efff", roof: "#f8d36c", bumper: "#123849" }
    ];

    return carPalettes.map((palette) =>
      createPixelCanvas(144, 62, (spriteCtx) => {
        spriteCtx.fillStyle = "#00000066";
        spriteCtx.fillRect(18, 50, 98, 5);
        spriteCtx.fillStyle = palette.body;
        spriteCtx.fillRect(12, 22, 112, 22);
        spriteCtx.fillRect(24, 14, 70, 16);
        spriteCtx.fillStyle = palette.roof;
        spriteCtx.fillRect(34, 16, 48, 12);
        spriteCtx.fillStyle = palette.bumper;
        spriteCtx.fillRect(8, 28, 8, 12);
        spriteCtx.fillRect(124, 28, 8, 12);
        spriteCtx.fillStyle = "#080b12";
        spriteCtx.fillRect(24, 42, 20, 8);
        spriteCtx.fillRect(88, 42, 20, 8);
        spriteCtx.fillStyle = "#fff5b4";
        spriteCtx.fillRect(4, 28, 4, 8);
        spriteCtx.fillStyle = "#ff8b7b";
        spriteCtx.fillRect(132, 28, 4, 8);
      })
    );
  }

  function createBartenderSprite() {
    return createPixelCanvas(44, 60, (spriteCtx) => {
      spriteCtx.fillStyle = "#00000066";
      spriteCtx.fillRect(12, 52, 20, 4);
      spriteCtx.fillStyle = "#2f1a1f";
      spriteCtx.fillRect(13, 4, 18, 8);
      spriteCtx.fillStyle = "#d89a6d";
      spriteCtx.fillRect(12, 12, 20, 14);
      spriteCtx.fillStyle = "#ffffff";
      spriteCtx.fillRect(17, 18, 2, 2);
      spriteCtx.fillRect(25, 18, 2, 2);
      spriteCtx.fillStyle = "#301a1f";
      spriteCtx.fillRect(16, 22, 12, 2);
      spriteCtx.fillStyle = "#f4f0e1";
      spriteCtx.fillRect(10, 26, 24, 8);
      spriteCtx.fillStyle = "#111827";
      spriteCtx.fillRect(8, 34, 28, 12);
      spriteCtx.fillStyle = "#8ef0a3";
      spriteCtx.fillRect(18, 32, 8, 4);
      spriteCtx.fillStyle = "#20283b";
      spriteCtx.fillRect(13, 46, 6, 8);
      spriteCtx.fillRect(25, 46, 6, 8);
      spriteCtx.fillStyle = "#ffd06d";
      spriteCtx.fillRect(32, 28, 6, 10);
    });
  }

  function createSingerSprite() {
    return createPixelCanvas(40, 62, (spriteCtx) => {
      spriteCtx.fillStyle = "#00000066";
      spriteCtx.fillRect(10, 54, 18, 4);
      spriteCtx.fillStyle = "#5b2038";
      spriteCtx.fillRect(12, 4, 16, 10);
      spriteCtx.fillStyle = "#d89a6d";
      spriteCtx.fillRect(11, 14, 18, 14);
      spriteCtx.fillStyle = "#fff4d8";
      spriteCtx.fillRect(16, 20, 2, 2);
      spriteCtx.fillRect(22, 20, 2, 2);
      spriteCtx.fillStyle = "#ff4fb8";
      spriteCtx.fillRect(8, 28, 24, 18);
      spriteCtx.fillStyle = "#ffd06d";
      spriteCtx.fillRect(28, 22, 3, 18);
      spriteCtx.fillRect(29, 20, 1, 2);
      spriteCtx.fillStyle = "#20283b";
      spriteCtx.fillRect(13, 46, 5, 8);
      spriteCtx.fillRect(22, 46, 5, 8);
    });
  }

  function createLoungeSprites() {
    return {
      seated: createPixelCanvas(54, 42, (spriteCtx) => {
        spriteCtx.fillStyle = "#00000066";
        spriteCtx.fillRect(10, 34, 30, 4);
        spriteCtx.fillStyle = "#492c1f";
        spriteCtx.fillRect(4, 18, 46, 10);
        spriteCtx.fillStyle = "#8c4d31";
        spriteCtx.fillRect(2, 26, 50, 8);
        spriteCtx.fillStyle = "#d89a6d";
        spriteCtx.fillRect(16, 6, 12, 10);
        spriteCtx.fillStyle = "#50efff";
        spriteCtx.fillRect(14, 16, 16, 10);
        spriteCtx.fillStyle = "#20283b";
        spriteCtx.fillRect(18, 26, 4, 8);
        spriteCtx.fillRect(24, 26, 4, 8);
      }),
      table: createPixelCanvas(52, 34, (spriteCtx) => {
        spriteCtx.fillStyle = "#5b3121";
        spriteCtx.fillRect(4, 8, 44, 12);
        spriteCtx.fillStyle = "#3b1f17";
        spriteCtx.fillRect(22, 20, 8, 10);
        spriteCtx.fillStyle = "#50efff";
        spriteCtx.fillRect(10, 4, 4, 8);
        spriteCtx.fillStyle = "#ffd06d";
        spriteCtx.fillRect(36, 4, 4, 8);
      })
    };
  }

  function drawSprite(image, x, y, width, height) {
    ctx.drawImage(image, Math.round(x), Math.round(y), Math.round(width), Math.round(height));
  }

  function drawText(text, x, y, size, color, align = "left") {
    ctx.save();
    ctx.font = `700 ${size}px "Trebuchet MS", sans-serif`;
    ctx.textAlign = align;
    ctx.fillStyle = color;
    ctx.shadowColor = "rgba(0,0,0,.8)";
    ctx.shadowBlur = 4;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function drawInteractionBeacon(x, y, now, color = "#ffd06d") {
    const pulse = 1 + Math.sin(now / 180) * 0.18;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(pulse, pulse);
    drawPixelRect(-14, -14, 28, 28, `${color}cc`);
    drawPixelRect(-8, -8, 16, 16, "#08101c");
    drawPixelRect(-2, -2, 4, 4, color);
    ctx.restore();
  }

  function drawStreet(now) {
    const w = canvas.width;
    const h = canvas.height;
    const pulse = (Math.sin(now / 420) + 1) / 2;

    drawPixelRect(0, 0, w, h, "#071126");
    if (assets.street.complete && assets.street.naturalWidth) {
      ctx.drawImage(assets.street, 0, 0, w, h);
      drawPixelRect(0, 0, w, h, `rgba(3, 6, 18, ${0.08 + pulse * 0.04})`);
    } else {
      drawPixelRect(0, 0, w, 245, "#081a35");
      drawPixelRect(0, 245, w, 190, "#0b1026");
      drawPixelRect(0, 435, w, 285, "#111827");
      drawText("PUB PAID", 300, 236, 42, "#50efff", "center");
      drawText("preparando rua do PubPaid...", 640, 378, 26, "#ffd06d", "center");
    }

    drawCars(now);
    drawPedestrians(now);
    drawNeonOverlays(now);
    drawPlayer();
    drawStreetMarkers(now);
  }

  function drawInteriorActors(now) {
    const sway = Math.sin(now / 220);
    const singerBob = Math.sin(now / 180) * 3;
    const stageGlow = state.stageEventActive ? 0.32 + (Math.sin(now / 140) + 1) * 0.12 : 0;
    drawSprite(spriteCache.bartender, 146, 170, 66, 90);
    drawSprite(spriteCache.singer, 1030, 170 + singerBob, 60, 94);
    drawSprite(spriteCache.lounge.table, 826, 442, 84, 52);
    drawSprite(spriteCache.lounge.seated, 782 + sway * 2, 446, 76, 60);
    drawSprite(spriteCache.lounge.seated, 910 - sway * 2, 452, 76, 60);
    drawSprite(spriteCache.lounge.table, 276, 458, 84, 52);
    drawSprite(spriteCache.lounge.seated, 238, 462, 76, 60);
    drawSprite(spriteCache.lounge.seated, 334, 468, 76, 60);

    if (state.stageEventActive) {
      drawPixelRect(944, 144, 190, 170, `rgba(255, 79, 184, ${stageGlow})`);
      drawPixelRect(980, 162, 118, 8, "rgba(80, 239, 255, 0.46)");
    }

    if (Math.sin(now / 260) > 0.35) {
      drawText(state.stageEventActive ? "evento em destaque" : "show ao vivo", 1060, 160, 18, "#ffd06d", "center");
    }
    if (Math.sin(now / 310) > 0.1) {
      drawText("drinks & dicas", 184, 160, 16, "#8ef0a3", "center");
    }
  }

  function drawNeonOverlays(now) {
    const pulse = (Math.sin(now / 360) + 1) / 2;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    drawPixelRect(438, 196, 236, 8, `rgba(80, 239, 255, ${0.22 + pulse * 0.28})`);
    drawPixelRect(456, 212, 198, 6, `rgba(255, 79, 184, ${0.18 + pulse * 0.2})`);
    drawPixelRect(575, 382, 88, 10, `rgba(255, 208, 109, ${0.18 + pulse * 0.24})`);
    ctx.restore();
  }

  function drawCars(now) {
    const carA = 1280 - ((now / 5) % 1520);
    drawSprite(spriteCache.cars[0], carA - 8, 446, 132, 58);

    const carB = -160 + ((now / 7) % 1500);
    drawSprite(spriteCache.cars[1], carB - 4, 516, 144, 60);
  }

  function drawPedestrians(now) {
    const people = [
      { x: 470 + Math.sin(now / 900) * 18, y: 398, sprite: spriteCache.npc[0] },
      { x: 826 + Math.sin(now / 700) * 24, y: 408, sprite: spriteCache.npc[1] },
      { x: 1140 - ((now / 35) % 250), y: 404, sprite: spriteCache.npc[2] }
    ];
    people.forEach((person, index) => {
      drawSprite(person.sprite, person.x - 12, person.y - 34, 28, 44);
      if (index === 1) drawPixelRect(person.x + 14, person.y - 8, 14, 5, "#fff6d8");
    });
  }

  function drawPlayer() {
    const p = state.player;
    const { sheet, frameWidth, frameHeight, framesPerDir } = spriteCache.player;
    const frameByFacing = {
      down: 0,
      left: 1,
      right: 2,
      up: 3
    };
    const moving = Math.hypot(p.targetX - p.x, p.targetY - p.y) > 6;
    const strideIndex = moving ? Math.floor((p.step * 9) % framesPerDir) : 1;
    const frameX = ((frameByFacing[p.facing] || 0) * framesPerDir + strideIndex) * frameWidth;
    const row = state.mode === "PvP real" ? 1 : 0;
    const frameY = row * frameHeight;
    ctx.drawImage(
      sheet,
      frameX,
      frameY,
      frameWidth,
      frameHeight,
      Math.round(p.x - 24),
      Math.round(p.y - 52),
      48,
      72
    );
    drawPixelRect(p.x - 18, p.y + 44, 36, 5, "rgba(0,0,0,.45)");
  }

  function drawStreetMarkers(now) {
    const markerPulse = 1 + Math.sin(now / 220) * 0.08;
    ctx.save();
    ctx.translate(300, 486);
    ctx.scale(markerPulse, markerPulse);
    drawPixelRect(-16, -16, 32, 32, "rgba(255, 208, 109, 0.82)");
    drawPixelRect(-9, -9, 18, 18, "#07101c");
    ctx.restore();

    drawText("rua leste bloqueada", 1210, 422, 18, "#8193b2", "right");
    drawText("beco futuro", 70, 515, 16, "#8193b2", "left");
  }

  function drawInterior(now) {
    drawPixelRect(0, 0, canvas.width, canvas.height, "#080714");
    if (assets.interior.complete && assets.interior.naturalWidth) {
      ctx.drawImage(assets.interior, 0, 0, canvas.width, canvas.height);
      drawPixelRect(0, 0, canvas.width, canvas.height, "rgba(5, 8, 18, 0.14)");
    } else {
      drawPixelRect(70, 70, 1140, 560, "#111a2e");
      drawPixelRect(70, 70, 1140, 86, "#2b1630");
    }
    drawText("PUBPAID 2.0 - salão em construção", 640, 128, 34, "#50efff", "center");
    drawInteriorActors(now);
    drawTable(210, 270, "DARDOS", "#50efff");
    drawTable(480, 330, "DAMA", "#8ef0a3");
    drawTable(760, 300, "TRUCO", "#ffd06d");
    drawTable(1010, 350, "POKER", "#ff4fb8");
    interiorProps.forEach((prop) => {
      drawInteractionBeacon(prop.x, prop.y, now, prop.id === "exit-street" ? "#8ef0a3" : "#ffd06d");
    });
    drawPixelRect(520, 540, 240, 40, "#40223a");
    drawText("voltar para rua", 640, 568, 22, "#fff6d8", "center");
    drawPlayer();
  }

  function drawTable(x, y, label, color) {
    drawPixelRect(x - 78, y - 38, 156, 76, "#2a1b26");
    drawPixelRect(x - 64, y - 28, 128, 56, color);
    drawText(label, x, y + 7, 18, "#07101c", "center");
    drawPixelRect(x - 98, y - 10, 18, 30, "#161b2b");
    drawPixelRect(x + 80, y - 10, 18, 30, "#161b2b");
  }

  function updatePlayer(delta) {
    const p = state.player;
    const dx = p.targetX - p.x;
    const dy = p.targetY - p.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 2) return;
    const speed = state.scene === "street" ? 170 : 150;
    const step = Math.min(distance, speed * delta);
    p.x += (dx / distance) * step;
    p.y += (dy / distance) * step;
    p.step += delta;
    p.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";

    if (state.scene === "street" && Math.hypot(p.x - 300, p.y - 486) < 46) {
      setPrompt("Porta encontrada. Clique novamente ou aperte Enter para entrar no salão.");
    }
  }

  function setPrompt(text) {
    if (prompt) prompt.textContent = text;
  }

  function renderPanelChips(chips) {
    if (!panelChips) return;
    panelChips.innerHTML = "";
    chips.forEach((chip) => {
      const chipNode = document.createElement("span");
      chipNode.textContent = chip;
      panelChips.appendChild(chipNode);
    });
  }

  function renderPanelActions(actions) {
    if (!panelActions) return;
    panelActions.innerHTML = "";
    actions.forEach((actionItem) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = actionItem.label;
      button.dataset.panelAction = actionItem.action;
      if (actionItem.primary) button.classList.add("is-primary");
      panelActions.appendChild(button);
    });
  }

  function openPanel(id) {
    const content = panelCopy[id];
    if (!content || !microPanel) return;
    state.activePanelId = id;
    microPanel.hidden = false;
    if (panelKicker) panelKicker.textContent = content.kicker;
    if (panelTitle) panelTitle.textContent = content.title;
    if (panelBody) panelBody.textContent = content.body;
    renderPanelChips(content.chips || []);
    renderPanelActions(content.actions || []);
  }

  function closePanel() {
    state.activePanelId = null;
    if (microPanel) microPanel.hidden = true;
    if (panelActions) panelActions.innerHTML = "";
  }

  function setSelectedTable(tableId) {
    state.selectedTable = tableId;
    document.querySelectorAll("[data-select-table]").forEach((item) => {
      item.classList.toggle("is-active", item.dataset.selectTable === tableId);
    });
    const copy = document.querySelector("[data-table-copy]");
    if (copy) copy.textContent = tableCopy[tableId] || tableCopy.darts;
  }

  function runPanelAction(actionId) {
    if (actionId === "reset-test") {
      state.mode = "teste seguro";
      state.testCoins = 100;
      setPrompt("Bartender: 100 créditos de teste recarregados para seguir explorando.");
      return;
    }

    if (actionId === "suggest-table") {
      setSelectedTable("darts");
      setPrompt("Bartender: vá de Dardos primeiro. É a melhor leitura de ritmo e resposta rápida.");
      return;
    }

    if (actionId === "toggle-stage-event") {
      state.stageEventActive = !state.stageEventActive;
      setPrompt(
        state.stageEventActive
          ? "Palco ativado: o salão ficou mais vivo e o evento visual entrou em cena."
          : "Palco desativado: o evento visual foi encerrado."
      );
      openPanel("stage");
      return;
    }

    if (actionId === "queue-casual") {
      state.loungeQueue = "casual";
      setSelectedTable("checkers");
      setPrompt("Fila casual criada na mesa oeste. Dama virou a mesa sugerida do momento.");
      return;
    }

    if (actionId === "pick-checkers") {
      setSelectedTable("checkers");
      setPrompt("Mesa oeste: foco mudado para Dama.");
      return;
    }

    if (actionId === "queue-premium") {
      state.loungeQueue = "premium";
      setSelectedTable("poker");
      setPrompt("Fila premium criada na mesa leste. Poker virou a vitrine social do salão.");
      return;
    }

    if (actionId === "pick-poker") {
      setSelectedTable("poker");
      setPrompt("Mesa leste: foco mudado para Poker.");
    }
  }

  function getNearestInteriorProp() {
    if (state.scene !== "interior") return null;
    let nearest = null;
    let bestDistance = Infinity;
    interiorProps.forEach((prop) => {
      const distance = Math.hypot(state.player.x - prop.x, state.player.y - prop.y);
      if (distance < prop.radius && distance < bestDistance) {
        bestDistance = distance;
        nearest = { ...prop, distance };
      }
    });
    return nearest;
  }

  function updateFocus() {
    if (state.scene === "street") {
      state.focusLabel = Math.hypot(state.player.x - 300, state.player.y - 486) < 74 ? "porta principal" : "calçada";
      return;
    }
    const nearestProp = getNearestInteriorProp();
    state.focusLabel = nearestProp ? nearestProp.label : "salão livre";
  }

  function triggerFocusedInteraction() {
    const now = performance.now();
    if (now < state.interactionCooldownUntil) return;
    state.interactionCooldownUntil = now + 280;

    if (state.scene === "street") {
      if (Math.hypot(state.player.x - 300, state.player.y - 486) < 74) {
        enterInterior();
      } else {
        setPrompt("Caminhe até a porta para entrar. A rua também vai crescer com novos atalhos.");
      }
      return;
    }

    const nearestProp = getNearestInteriorProp();
    if (nearestProp) {
      nearestProp.action();
      return;
    }
    setPrompt("Explore o salão. Chegue perto do balcão, do palco, das mesas lounge ou da saída.");
  }

  function goToStreet(message) {
    closePanel();
    state.scene = "street";
    state.player.x = 304;
    state.player.y = 514;
    state.player.targetX = 304;
    state.player.targetY = 562;
    setPrompt(message);
  }

  function updateHud() {
    updateFocus();
    if (sceneName) sceneName.textContent = state.scene === "street" ? "Rua do PubPaid" : "Salão PvP";
    if (modeName) modeName.textContent = state.mode;
    if (testCoins) testCoins.textContent = String(state.testCoins);
    if (realCoins) realCoins.textContent = String(state.realCoins);
    if (focusName) focusName.textContent = state.focusLabel;
  }

  function loop(now) {
    const delta = Math.min(0.04, (now - state.tick || 16) / 1000);
    state.tick = now;
    updatePlayer(delta);
    if (state.scene === "street") drawStreet(now);
    else drawInterior(now);
    updateHud();
    requestAnimationFrame(loop);
  }

  function resizeCanvas() {
    const screen = canvas.closest(".ppv2-screen");
    if (!screen) return;
    const rect = screen.getBoundingClientRect();
    const compactHud = rect.width < 760;
    state.viewport.compactHud = compactHud;
    state.viewport.width = canvas.width;
    state.viewport.height = canvas.height;
    canvas.width = compactHud ? 960 : 1280;
    canvas.height = compactHud ? 540 : 720;
    state.player.targetX = Math.max(34, Math.min(canvas.width - 34, state.player.targetX));
    state.player.targetY = Math.max(110, Math.min(canvas.height - 34, state.player.targetY));
  }

  function getCanvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height
    };
  }

  function enterInterior() {
    state.scene = "interior";
    state.player.x = 640;
    state.player.y = 610;
    state.player.targetX = 640;
    state.player.targetY = 520;
    closePanel();
    setPrompt("Salão conceitual: as mesas reais começam por Dardos e Dama, depois Truco e Poker.");
  }

  function movePlayerByDirection(direction) {
    const move = 54;
    if (direction === "left") state.player.targetX = state.player.x - move;
    if (direction === "right") state.player.targetX = state.player.x + move;
    if (direction === "up") state.player.targetY = state.player.y - move;
    if (direction === "down") state.player.targetY = state.player.y + move;
    if (state.scene === "street") {
      state.player.targetX = Math.max(34, Math.min(canvas.width - 34, state.player.targetX));
      state.player.targetY = Math.max(392, Math.min(canvas.height - 46, state.player.targetY));
      setPrompt("Controle touch ativo. Vá até a porta e toque em OK.");
    } else {
      state.player.targetX = Math.max(90, Math.min(1190, state.player.targetX));
      state.player.targetY = Math.max(170, Math.min(610, state.player.targetY));
    }
  }

  function triggerTouchAction() {
    if (state.scene === "street") {
      if (Math.hypot(state.player.x - 300, state.player.y - 486) < 74) {
        enterInterior();
        return;
      }
      state.player.targetX = 300;
      state.player.targetY = 486;
      setPrompt("Indo até a porta. Toque em OK novamente para entrar.");
      return;
    }
    triggerFocusedInteraction();
  }

  canvas.addEventListener("click", (event) => {
    const point = getCanvasPoint(event);
    if (state.scene === "street") {
      const nearDoor = point.x >= 244 && point.x <= 356 && point.y >= 268 && point.y <= 505;
      if (nearDoor || Math.hypot(state.player.x - 300, state.player.y - 486) < 48) {
        state.player.targetX = 300;
        state.player.targetY = 486;
        window.setTimeout(() => {
          if (Math.hypot(state.player.x - 300, state.player.y - 486) < 58) enterInterior();
        }, 480);
        return;
      }
      state.player.targetX = Math.max(34, Math.min(canvas.width - 34, point.x));
      state.player.targetY = Math.max(392, Math.min(canvas.height - 46, point.y));
      setPrompt("Rua viva: clique na porta, explore a calçada ou prepare futuros atalhos.");
      return;
    }

    for (const prop of interiorProps) {
      const hit = point.x >= prop.x - 56 && point.x <= prop.x + 56 && point.y >= prop.y - 56 && point.y <= prop.y + 56;
      if (hit) {
        state.player.targetX = prop.x;
        state.player.targetY = Math.min(610, prop.y + (prop.id === "exit-street" ? 18 : 42));
        window.setTimeout(() => {
          if (Math.hypot(state.player.x - prop.x, state.player.y - prop.y) < prop.radius) {
            prop.action();
          } else {
            setPrompt(prop.hint);
          }
        }, 420);
        return;
      }
    }

    if (point.x >= 520 && point.x <= 760 && point.y >= 528 && point.y <= 592) {
      goToStreet("De volta à rua. Futuramente ela fecha um círculo com outras áreas da cidade.");
      return;
    }
    state.player.targetX = Math.max(90, Math.min(1190, point.x));
    state.player.targetY = Math.max(170, Math.min(610, point.y));
  });

  document.querySelector("[data-enter-street]")?.addEventListener("click", () => {
    state.started = true;
    state.player.targetX = 300;
    state.player.targetY = 486;
    setPrompt("Chegando pela rua. A porta do PubPaid é o primeiro objetivo.");
  });

  document.querySelector("[data-open-test]")?.addEventListener("click", () => {
    if (modal) modal.hidden = false;
  });

  document.querySelector("[data-close-test]")?.addEventListener("click", () => {
    if (modal) modal.hidden = true;
    state.mode = "teste seguro";
    state.testCoins = 100;
    setPrompt("100 créditos de teste ativos. Eles não entram em PvP real nem saque.");
  });

  document.querySelectorAll("[data-select-table]").forEach((button) => {
    button.addEventListener("click", () => {
      setSelectedTable(button.dataset.selectTable || "darts");
    });
  });

  document.querySelectorAll("[data-touch-move]").forEach((button) => {
    button.addEventListener("click", () => movePlayerByDirection(button.dataset.touchMove || ""));
  });

  document.querySelector("[data-touch-action]")?.addEventListener("click", triggerTouchAction);
  document.querySelector("[data-close-panel]")?.addEventListener("click", closePanel);
  panelActions?.addEventListener("click", (event) => {
    const actionButton = event.target.closest("[data-panel-action]");
    if (!actionButton) return;
    runPanelAction(actionButton.dataset.panelAction || "");
  });

  setSelectedTable("darts");

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closePanel();
    if (event.key === "Enter" && state.scene === "street" && Math.hypot(state.player.x - 300, state.player.y - 486) < 64) {
      enterInterior();
    }
    if (event.key === "Enter" && state.scene === "interior") {
      triggerFocusedInteraction();
    }
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") movePlayerByDirection("left");
    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") movePlayerByDirection("right");
    if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") movePlayerByDirection("up");
    if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") movePlayerByDirection("down");
  });

  requestAnimationFrame(loop);
})();
