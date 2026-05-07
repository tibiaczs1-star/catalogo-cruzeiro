import { GAME_HEIGHT, GAME_WIDTH } from "../config/gameConfig.js";
import { gameState, updateGameState } from "../core/gameState.js";

const WALLET_PHONE_TEXTURE = "ppg-wallet-phone-ui";
const WALLET_DIGIT_TEXTURE = "ppg-wallet-pixel-digits";
const WALLET_DIGIT_FRAMES = {
  "0": 0,
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "-": 10,
  ".": 11
};
const WALLET_VALUE_ANCHORS = {
  test: { x: -84, y: 8 },
  real: { x: 24, y: 8 },
  livre: { x: -84, y: 110 },
  mesa: { x: 24, y: 110 }
};

export class WalletScene extends Phaser.Scene {
  constructor() {
    super("wallet-scene");
    this.fromScene = "street";
    this.originX = GAME_WIDTH / 2;
    this.originY = GAME_HEIGHT - 120;
    this.closeRequested = false;
  }

  init(data = {}) {
    this.fromScene = data.fromScene || gameState.currentScene || "street";
    this.originX = Phaser.Math.Clamp(data.originX ?? GAME_WIDTH / 2, 80, GAME_WIDTH - 80);
    this.originY = Phaser.Math.Clamp((data.originY ?? GAME_HEIGHT - 120) - 118, 80, GAME_HEIGHT - 80);
    this.closeRequested = false;
  }

  create() {
    this.cameras.main.setRoundPixels(true);
    this.buildCinematicWallet();
    this.input.keyboard?.on("keydown-ESC", this.closeWallet, this);
    this.input.keyboard?.on("keydown-BACKSPACE", this.closeWallet, this);
    this.game.events.on("pubpaid:wallet-close-request", this.closeWallet, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off("keydown-ESC", this.closeWallet, this);
      this.input.keyboard?.off("keydown-BACKSPACE", this.closeWallet, this);
      this.game.events.off("pubpaid:wallet-close-request", this.closeWallet, this);
    });

    updateGameState({
      currentScene: "wallet",
      walletOpen: true,
      walletPhase: "menu",
      focus: "carteira PubPaid",
      objective: "Conferir saldo da carteira",
      prompt: "Carteira aberta. Adicionar e retirar entram no Pix da carteira 2.0."
    });
  }

  buildCinematicWallet() {
    const panel = this.buildWalletPanel();
    panel
      .setPosition(this.originX, this.originY)
      .setScale(0.18)
      .setRotation(-0.22)
      .setDepth(112);

    this.cameras.main.flash(90, 80, 239, 255, 0.05);
    this.cameras.main.shake(90, 0.0012);
    this.tweens.add({
      targets: panel,
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT / 2,
      scale: 1,
      rotation: 0,
      duration: 620,
      ease: "Expo.easeOut"
    });
  }

  buildWalletPanel() {
    const panel = this.add.container(0, 0);
    this.textures.get(WALLET_PHONE_TEXTURE)?.setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.textures.get(WALLET_DIGIT_TEXTURE)?.setFilter(Phaser.Textures.FilterMode.NEAREST);

    const phone = this.add.image(0, 0, WALLET_PHONE_TEXTURE).setOrigin(0.5);
    const balances = [
      this.createSpriteNumber(WALLET_VALUE_ANCHORS.test.x, WALLET_VALUE_ANCHORS.test.y, gameState.testBalance),
      this.createSpriteNumber(WALLET_VALUE_ANCHORS.real.x, WALLET_VALUE_ANCHORS.real.y, gameState.realBalance),
      this.createSpriteNumber(WALLET_VALUE_ANCHORS.livre.x, WALLET_VALUE_ANCHORS.livre.y, gameState.availableBalance),
      this.createSpriteNumber(WALLET_VALUE_ANCHORS.mesa.x, WALLET_VALUE_ANCHORS.mesa.y, gameState.lockedMatchBalance)
    ];
    const depositZone = this.createPhoneHotspot(-44, 186, 84, 38, () => this.openWalletPix("deposit"));
    const withdrawZone = this.createPhoneHotspot(44, 186, 84, 38, () => this.openWalletPix("withdraw"));
    const closeZone = this.createPhoneHotspot(83, -131, 42, 30, () => this.closeWallet());

    panel.add([phone, ...balances, depositZone, withdrawZone, closeZone]);
    return panel;
  }

  createSpriteNumber(x, y, value) {
    const formatted = this.formatWalletValue(value);
    const group = this.add.container(x, y);
    const spacing = 18;

    [...formatted].forEach((char, index) => {
      const frame = WALLET_DIGIT_FRAMES[char] ?? WALLET_DIGIT_FRAMES["0"];
      group.add(this.add.image(index * spacing, 0, WALLET_DIGIT_TEXTURE, frame).setOrigin(0, 0.5));
    });

    return group;
  }

  formatWalletValue(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "0";
    if (Number.isInteger(numeric)) return String(numeric);
    return numeric.toFixed(2).replace(/\.00$/, "");
  }

  createPhoneHotspot(x, y, width, height, handler) {
    const zone = this.add.zone(x, y, width, height)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    zone.on("pointerdown", handler);
    return zone;
  }

  openWalletPix(mode) {
    const walletMode = mode === "withdraw" ? "withdraw" : "deposit";
    updateGameState({
      walletPhase: walletMode === "withdraw" ? "pix-withdraw" : "pix-deposit",
      focus: walletMode === "withdraw" ? "retirada Pix" : "deposito Pix",
      objective: walletMode === "withdraw" ? "Retirar dinheiro via Pix" : "Adicionar dinheiro via Pix",
      prompt: walletMode === "withdraw"
        ? "Informe a chave Pix para pedir retirada pela carteira."
        : "Gere o Pix dentro da carteira e avise o pagamento."
    });
    this.game.events.emit("pubpaid:wallet-action", { type: walletMode });
  }

  closeWallet(event) {
    event?.preventDefault?.();
    if (this.closeRequested) return;
    this.closeRequested = true;
    this.game.events.emit("pubpaid:wallet-action", { type: "close" });
    updateGameState({
      currentScene: this.fromScene === "interior" ? "interior" : "street",
      walletOpen: false,
      walletPhase: "phone-pocket",
      focus: this.fromScene === "interior" ? "salão" : "rua principal",
      objective: this.fromScene === "interior" ? "Explorar o salão" : "Entrar no PubPaid pela porta principal",
      prompt: this.fromScene === "interior"
        ? "Guardando o celular. Em seguida, use E para interagir com o salão."
        : "Guardando o celular. Em seguida, use E perto da porta para entrar no salão."
    });
    this.game.events.emit("pubpaid:wallet-closed", { fromScene: this.fromScene });
    this.cameras.main.fadeOut(180, 2, 4, 10);
    this.time.delayedCall(190, () => this.scene.stop());
  }
}
