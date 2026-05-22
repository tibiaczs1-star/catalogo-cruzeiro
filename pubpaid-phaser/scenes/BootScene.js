import { applyPixelTextureFilters } from "../core/assetRegistry.js";
import { updateGameState } from "../core/gameState.js";

const ASSET_VERSION = window.pubpaidBuildVersion || "20260522-gameux1";
const versionedAsset = (path) => `${path}?v=${ASSET_VERSION}`;

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot-scene");
  }

  preload() {
    this.load.on("progress", (progress = 0) => {
      window.pubpaidAssetProgress = Math.max(0, Math.min(1, progress));
      this.game.events.emit("pubpaid:assets-progress", { progress: window.pubpaidAssetProgress });
    });
    [13, 16].forEach((index) => {
      const padded = String(index).padStart(2, "0");
      this.load.image(`intro-frame-${padded}`, versionedAsset(`./assets/pubpaid/intro/pubpaid-intro-seq-${padded}.jpeg`));
    });
    this.load.image("street-bg", versionedAsset("./assets/pubpaid-v2-street-bg-v1.png"));
    this.load.image("interior-bg", versionedAsset("./assets/pubpaid-interior-v5.png"));
    this.load.image("game-lobby-bg", versionedAsset("./assets/pubpaid/lobby/pubpaid-lobby-bg-v2-crowd.png"));
    this.load.spritesheet("checkers-wood-tiles", versionedAsset("./assets/pubpaid/checkers/wood-tiles-oga.png"), {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet("checkers-pieces", versionedAsset("./assets/pubpaid/checkers/checker-pieces-oga.png"), {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.image("ppg-waiter-hero-sprite", versionedAsset("./assets/pubpaid/characters/waiter-salon-small-v1.png"));
    this.load.image("ppg-waiter-lobby-sprite", versionedAsset("./assets/pubpaid/characters/waiter-lobby-large-v1.png"));
    this.load.image("ppg-waiter-lobby-speaking-sprite", versionedAsset("./assets/pubpaid/characters/waiter-lobby-speaking-v1.png"));
    this.load.image("ppg-player-sprite", versionedAsset("./assets/pubpaid/sprites/adult-standing-tight-v1.png"));
    this.load.spritesheet("ppg-player-male-walk-sheet", versionedAsset("./assets/pubpaid/sprites/protagonist/protagonist-male-generated-walk-8dir-4f.png"), { frameWidth: 96, frameHeight: 144 });
    this.load.spritesheet("ppg-player-male-idle-breathe-sheet", versionedAsset("./assets/pubpaid/sprites/protagonist/protagonist-male-generated-idle-breathe-8dir-4f.png"), { frameWidth: 96, frameHeight: 144 });
    this.load.spritesheet("ppg-player-male-idle-phone-sheet", versionedAsset("./assets/pubpaid/sprites/protagonist/protagonist-male-generated-idle-phone-8dir-4f.png"), { frameWidth: 96, frameHeight: 144 });
    this.load.spritesheet("ppg-player-female-walk-sheet", versionedAsset("./assets/pubpaid/sprites/protagonist/protagonist-female-generated-walk-8dir-4f.png"), { frameWidth: 96, frameHeight: 144 });
    this.load.spritesheet("ppg-player-female-idle-breathe-sheet", versionedAsset("./assets/pubpaid/sprites/protagonist/protagonist-female-generated-idle-breathe-8dir-4f.png"), { frameWidth: 96, frameHeight: 144 });
    this.load.spritesheet("ppg-player-female-idle-phone-sheet", versionedAsset("./assets/pubpaid/sprites/protagonist/protagonist-female-generated-idle-phone-8dir-4f.png"), { frameWidth: 96, frameHeight: 144 });
    this.load.spritesheet("ppg-traffic-vehicles-4f", versionedAsset("./assets/pubpaid/traffic/pubpaid-traffic-vehicles-4f.png"), {
      frameWidth: 256,
      frameHeight: 128
    });
  }

  create() {
    applyPixelTextureFilters(this);
    window.pubpaidAssetsReady = true;
    window.pubpaidAssetProgress = 1;
    updateGameState({
      currentScene: "intro",
      focus: "placa PUB PAID",
      objective: "Entrar no PubPaid",
      prompt: "Entre com Google e comece. O som pode ser ligado depois."
    });
    this.game.events.emit("pubpaid:assets-ready");
  }
}
