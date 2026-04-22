import { GAME_HEIGHT, GAME_WIDTH, INTERIOR_BOUNDS } from "../config/gameConfig.js";
import { addSpriteActor, TEXTURE_KEYS } from "../core/spriteFactory.js";
import { NERD_TEAM, formatNerdAgent } from "../config/nerdTeam.js";
import { openPanel, runPanelAction } from "../ui/panelActions.js";
import { gameState, updateGameState } from "../core/gameState.js";

const INTERIOR_PANELS = {
  bartender: {
    kicker: "balcão",
    title: "Bartender operacional",
    body: "O bartender já virou um ponto real do núcleo: daqui saem recarga de teste, orientação de mesa e, depois, drinks e onboarding premium.",
    chips: ["tutorial", "drinks", "mesa sugerida", NERD_TEAM.hud.name],
    actions: [
      { id: "reset-test", label: "Recarregar teste", primary: true },
      { id: "suggest-darts", label: "Sugerir mesa" }
    ]
  },
  stage: {
    kicker: "palco",
    title: "Cantora ao vivo",
    body: "O palco agora é um nó de evento do salão. Ele pode ativar clima de noite, buff visual e chamadas para mesas ou torneios.",
    chips: ["evento", "buff visual", "crowd mood", NERD_TEAM.sprite.name],
    actions: [{ id: "toggle-stage-event", label: "Ativar evento", primary: true }]
  },
  west: {
    kicker: "lounge",
    title: "Mesa oeste",
    body: "A mesa oeste agora representa a fila casual e a camada de descoberta. É o espaço mais natural para Dama e onboarding social.",
    chips: ["fila casual", "dama", "descoberta", NERD_TEAM.engine.name],
    actions: [
      { id: "queue-casual", label: "Entrar na fila casual", primary: true },
      { id: "close-panel", label: "Fechar" }
    ]
  },
  east: {
    kicker: "premium",
    title: "Mesa leste",
    body: "A mesa leste é a ponta premium do salão. Ela já serve para simular espera social e foco em Poker como núcleo de mesa avançada.",
    chips: ["fila premium", "poker", "social", NERD_TEAM.qa.name],
    actions: [
      { id: "queue-premium", label: "Entrar na fila premium", primary: true },
      { id: "close-panel", label: "Fechar" }
    ]
  }
};

export class InteriorScene extends Phaser.Scene {
  constructor() {
    super("interior-scene");
    this.player = null;
    this.targetPoint = null;
    this.targetMarker = null;
    this.cursors = null;
    this.interactionCooldown = 0;
    this.zones = [];
    this.stageGlow = null;
  }

  create() {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "interior-bg").setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
    addSpriteActor(this, TEXTURE_KEYS.bartender, 176, 244, 1.05);
    addSpriteActor(this, TEXTURE_KEYS.singer, 1058, 250, 1.04);
    addSpriteActor(this, TEXTURE_KEYS.guestA, 320, 504, 0.96);
    addSpriteActor(this, TEXTURE_KEYS.guestB, 862, 492, 0.96);
    this.player = this.buildPlayer(640, 608);
    this.targetMarker = this.add.circle(this.player.x, this.player.y, 10, 0x50efff, 0.25).setVisible(false);
    this.stageGlow = this.add.rectangle(1046, 226, 180, 160, 0xff4fb8, 0).setBlendMode(Phaser.BlendModes.SCREEN);

    this.zones = [
      { id: "bartender", x: 180, y: 252, radius: 84 },
      { id: "stage", x: 1060, y: 242, radius: 84 },
      { id: "west", x: 318, y: 490, radius: 84 },
      { id: "east", x: 860, y: 480, radius: 84 },
      { id: "exit", x: 640, y: 580, radius: 96 }
    ];

    this.zones.forEach((zone) => {
      const color = zone.id === "exit" ? 0x8ef0a3 : 0xffd06d;
      this.add.circle(zone.x, zone.y, 14, color, 0.2).setStrokeStyle(2, color, 0.45);
    });

    this.cameras.main.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.on("keydown-W", () => this.nudgePlayer(0, -40));
    this.input.keyboard.on("keydown-A", () => this.nudgePlayer(-40, 0));
    this.input.keyboard.on("keydown-S", () => this.nudgePlayer(0, 40));
    this.input.keyboard.on("keydown-D", () => this.nudgePlayer(40, 0));
    this.input.keyboard.on("keydown-ENTER", () => this.tryInteraction());

    this.input.on("pointerdown", (pointer) => {
      const worldPoint = pointer.positionToCamera(this.cameras.main);
      const clickedZone = this.getZoneAt(worldPoint.x, worldPoint.y);
      if (clickedZone) {
        this.targetPoint = new Phaser.Math.Vector2(
          Phaser.Math.Clamp(clickedZone.x, INTERIOR_BOUNDS.minX, INTERIOR_BOUNDS.maxX),
          Phaser.Math.Clamp(clickedZone.y + (clickedZone.id === "exit" ? 20 : 42), INTERIOR_BOUNDS.minY, INTERIOR_BOUNDS.maxY)
        );
        this.targetMarker.setPosition(this.targetPoint.x, this.targetPoint.y).setVisible(true);
        updateGameState({
          currentScene: "interior",
          focus: this.getZoneLabel(clickedZone.id),
          objective: clickedZone.id === "exit" ? "Voltar para a rua" : "Interagir com o ponto ativo",
          nerdAgent: formatNerdAgent(clickedZone.id === "exit" ? NERD_TEAM.engine : NERD_TEAM.physics),
          prompt:
            clickedZone.id === "exit"
              ? "Indo para a saída. Aperte Enter quando chegar perto."
              : "Indo para o ponto ativo. Aperte Enter quando chegar perto."
        });
        return;
      }
      this.targetPoint = new Phaser.Math.Vector2(
        Phaser.Math.Clamp(worldPoint.x, INTERIOR_BOUNDS.minX, INTERIOR_BOUNDS.maxX),
        Phaser.Math.Clamp(worldPoint.y, INTERIOR_BOUNDS.minY, INTERIOR_BOUNDS.maxY)
      );
      this.targetMarker.setPosition(this.targetPoint.x, this.targetPoint.y).setVisible(true);
      updateGameState({
        currentScene: "interior",
        focus: "salão",
        objective: "Explorar pontos ativos do salão",
        nerdAgent: formatNerdAgent(NERD_TEAM.physics),
        prompt: "Destino marcado dentro do salão. Aproxime-se de um ponto ativo e aperte Enter."
      });
    });

    updateGameState({
      currentScene: "interior",
      focus: "salão",
      objective: "Escolher um ponto ativo no salão",
      nerdAgent: formatNerdAgent(NERD_TEAM.hud),
      prompt: "Salão definitivo carregado. Bartender, palco, mesas lounge e saída já vivem em scene própria."
    });
  }

  buildPlayer(x, y) {
    return addSpriteActor(this, TEXTURE_KEYS.player, x, y, 1.04);
  }

  nudgePlayer(dx, dy) {
    this.targetPoint = new Phaser.Math.Vector2(
      Phaser.Math.Clamp(this.player.x + dx, INTERIOR_BOUNDS.minX, INTERIOR_BOUNDS.maxX),
      Phaser.Math.Clamp(this.player.y + dy, INTERIOR_BOUNDS.minY, INTERIOR_BOUNDS.maxY)
    );
    this.targetMarker.setPosition(this.targetPoint.x, this.targetPoint.y).setVisible(true);
  }

  getNearestZone() {
    let nearest = null;
    let bestDistance = Infinity;
    this.zones.forEach((zone) => {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, zone.x, zone.y);
      if (distance < zone.radius && distance < bestDistance) {
        bestDistance = distance;
        nearest = zone;
      }
    });
    return nearest;
  }

  getZoneAt(x, y) {
    return this.zones.find((zone) => Phaser.Math.Distance.Between(x, y, zone.x, zone.y) < zone.radius) || null;
  }

  getZoneLabel(zoneId) {
    if (zoneId === "bartender") return "balcão do bartender";
    if (zoneId === "stage") return "palco da cantora";
    if (zoneId === "west") return "mesa lounge oeste";
    if (zoneId === "east") return "mesa lounge leste";
    if (zoneId === "exit") return "saída para rua";
    return "salão";
  }

  tryInteraction() {
    const now = this.time.now;
    if (now < this.interactionCooldown) return;
    this.interactionCooldown = now + 250;

    const zone = this.getNearestZone();
    if (!zone) {
      updateGameState({
        prompt: "Chegue perto do balcão, palco, mesa oeste, mesa leste ou saída."
      });
      return;
    }

    if (zone.id === "exit") {
      runPanelAction("close-panel");
      this.scene.start("street-scene");
      return;
    }

    openPanel(INTERIOR_PANELS[zone.id]);
    updateGameState({
      focus: this.getZoneLabel(zone.id),
      objective: "Escolher ação no painel",
      nerdAgent: formatNerdAgent(zone.id === "stage" ? NERD_TEAM.sprite : NERD_TEAM.hud)
    });
  }

  update() {
    const keyboardVector = new Phaser.Math.Vector2(0, 0);
    if (this.cursors.left.isDown) keyboardVector.x -= 1;
    if (this.cursors.right.isDown) keyboardVector.x += 1;
    if (this.cursors.up.isDown) keyboardVector.y -= 1;
    if (this.cursors.down.isDown) keyboardVector.y += 1;

    if (keyboardVector.lengthSq() > 0) {
      keyboardVector.normalize().scale(2.6);
      this.player.x = Phaser.Math.Clamp(this.player.x + keyboardVector.x, INTERIOR_BOUNDS.minX, INTERIOR_BOUNDS.maxX);
      this.player.y = Phaser.Math.Clamp(this.player.y + keyboardVector.y, INTERIOR_BOUNDS.minY, INTERIOR_BOUNDS.maxY);
      this.targetPoint = null;
      this.targetMarker.setVisible(false);
    } else if (this.targetPoint) {
      const dx = this.targetPoint.x - this.player.x;
      const dy = this.targetPoint.y - this.player.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 3) {
        this.player.setPosition(this.targetPoint.x, this.targetPoint.y);
        this.targetPoint = null;
        this.targetMarker.setVisible(false);
      } else {
        const speed = 2.8;
        this.player.x += (dx / distance) * speed;
        this.player.y += (dy / distance) * speed;
      }
    }

    this.stageGlow.alpha = gameState.stageEventActive ? 0.22 + (Math.sin(this.time.now / 180) + 1) * 0.08 : 0;

    const zone = this.getNearestZone();
    updateGameState({
      currentScene: "interior",
      focus: zone ? this.getZoneLabel(zone.id) : "salão",
      objective: zone
        ? zone.id === "exit"
          ? "Voltar para a rua"
          : "Apertar Enter para interagir"
        : "Explorar pontos ativos do salão",
      nerdAgent: formatNerdAgent(zone ? NERD_TEAM.hud : NERD_TEAM.physics),
      prompt: zone
        ? zone.id === "exit"
          ? "Saída localizada. Aperte Enter para voltar para a rua."
          : "Ponto ativo localizado. Aperte Enter para abrir a interface do núcleo."
        : "Explore o salão definitivo em Phaser. Os pontos ativos brilham no mapa."
    });
  }
}
