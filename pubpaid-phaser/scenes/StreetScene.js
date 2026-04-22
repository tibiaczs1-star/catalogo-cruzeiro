import { GAME_HEIGHT, GAME_WIDTH, STREET_BOUNDS } from "../config/gameConfig.js";
import { addSpriteActor, TEXTURE_KEYS } from "../core/spriteFactory.js";
import { NERD_TEAM, formatNerdAgent } from "../config/nerdTeam.js";
import { openPanel } from "../ui/panelActions.js";
import { updateGameState } from "../core/gameState.js";

const STREET_PANEL = {
  kicker: "porta",
  title: "Entrada do PubPaid",
  body: "A rua agora já vive dentro do núcleo definitivo. O próximo passo é a transição completa de cena para o salão, substituindo o fluxo antigo.",
  chips: ["street scene", "camera", "input", "transição"],
  actions: [{ id: "close-panel", label: "Fechar", primary: true }]
};

export class StreetScene extends Phaser.Scene {
  constructor() {
    super("street-scene");
    this.player = null;
    this.targetMarker = null;
    this.targetPoint = null;
    this.cursors = null;
    this.interactionCooldown = 0;
  }

  create() {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "street-bg").setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
    this.add.rectangle(300, 486, 108, 184, 0xffd06d, 0.08).setStrokeStyle(2, 0xffd06d, 0.5);
    this.add.text(300, 370, "Entrada", {
      fontFamily: "Trebuchet MS",
      fontSize: "22px",
      fontStyle: "bold",
      color: "#fff6dc"
    }).setOrigin(0.5);

    this.player = this.buildPlayer(176, 560);
    this.targetMarker = this.add.circle(this.player.x, this.player.y, 10, 0x50efff, 0.25).setVisible(false);

    this.cameras.main.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    this.scale.on("resize", this.handleResize, this);
    this.handleResize(this.scale.gameSize);

    this.input.on("pointerdown", (pointer) => {
      const worldPoint = pointer.positionToCamera(this.cameras.main);
      this.targetPoint = new Phaser.Math.Vector2(
        Phaser.Math.Clamp(worldPoint.x, STREET_BOUNDS.minX, STREET_BOUNDS.maxX),
        Phaser.Math.Clamp(worldPoint.y, STREET_BOUNDS.minY, STREET_BOUNDS.maxY)
      );
      this.targetMarker.setPosition(this.targetPoint.x, this.targetPoint.y).setVisible(true);
      updateGameState({
        currentScene: "street",
        focus: "rua viva",
        objective: "Aproximar da porta principal",
        nerdAgent: formatNerdAgent(NERD_TEAM.physics),
        prompt: "Destino marcado. Caminhe até a porta ou siga pelo beco para o futuro mapa circular."
      });
    });

    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.on("keydown-W", () => this.nudgePlayer(0, -40));
    this.input.keyboard.on("keydown-A", () => this.nudgePlayer(-40, 0));
    this.input.keyboard.on("keydown-S", () => this.nudgePlayer(0, 40));
    this.input.keyboard.on("keydown-D", () => this.nudgePlayer(40, 0));
    this.input.keyboard.on("keydown-ENTER", () => this.tryDoorInteraction());

    updateGameState({
      currentScene: "street",
      focus: "porta principal",
      objective: "Entrar no PubPaid pela porta principal",
      nerdAgent: formatNerdAgent(NERD_TEAM.engine),
      prompt: "Clique na rua para mover. Entre pela porta ou use a saída para alternar entre rua e salão."
    });
  }

  buildPlayer(x, y) {
    return addSpriteActor(this, TEXTURE_KEYS.player, x, y, 1.04);
  }

  handleResize(gameSize) {
    if (!gameSize) return;
    this.cameras.main.setZoom(gameSize.width < 700 ? 0.82 : 1);
  }

  nudgePlayer(dx, dy) {
    this.targetPoint = new Phaser.Math.Vector2(
      Phaser.Math.Clamp(this.player.x + dx, STREET_BOUNDS.minX, STREET_BOUNDS.maxX),
      Phaser.Math.Clamp(this.player.y + dy, STREET_BOUNDS.minY, STREET_BOUNDS.maxY)
    );
    this.targetMarker.setPosition(this.targetPoint.x, this.targetPoint.y).setVisible(true);
  }

  tryDoorInteraction() {
    const now = this.time.now;
    if (now < this.interactionCooldown) return;
    this.interactionCooldown = now + 250;

    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, 300, 486);
    if (distance < 74) {
      openPanel(STREET_PANEL);
      this.scene.start("interior-scene");
      return;
    }
    updateGameState({
      focus: "calçada",
      objective: "Chegar mais perto da entrada",
      nerdAgent: formatNerdAgent(NERD_TEAM.physics),
      prompt: "Chegue mais perto da porta para entrar no salão definitivo em Phaser."
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
      this.player.x = Phaser.Math.Clamp(this.player.x + keyboardVector.x, STREET_BOUNDS.minX, STREET_BOUNDS.maxX);
      this.player.y = Phaser.Math.Clamp(this.player.y + keyboardVector.y, STREET_BOUNDS.minY, STREET_BOUNDS.maxY);
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

    const nearDoor = Phaser.Math.Distance.Between(this.player.x, this.player.y, 300, 486) < 74;
    updateGameState({
      currentScene: "street",
      focus: nearDoor ? "porta principal" : "rua viva",
      objective: nearDoor ? "Apertar Enter para entrar" : "Entrar no PubPaid pela porta principal",
      nerdAgent: formatNerdAgent(nearDoor ? NERD_TEAM.engine : NERD_TEAM.physics),
      prompt: nearDoor
        ? "Porta encontrada. Aperte Enter para entrar no salão em Phaser."
        : "Rua viva carregada no núcleo definitivo. Explore ou siga para a porta."
    });
  }
}
