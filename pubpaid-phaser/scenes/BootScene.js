import { ensureCoreSprites } from "../core/spriteFactory.js";
import { updateGameState } from "../core/gameState.js";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot-scene");
  }

  preload() {
    for (let index = 1; index <= 16; index += 1) {
      const padded = String(index).padStart(2, "0");
      this.load.image(`intro-frame-${padded}`, `./assets/pubpaid/intro/pubpaid-intro-seq-${padded}.jpeg`);
    }
    this.load.image("street-bg", "./assets/pubpaid-v2-street-bg-v1.png");
    this.load.image("interior-bg", "./assets/pubpaid-interior-v5.png");
    this.load.image("game-lobby-bg", "./assets/pubpaid/lobby/pubpaid-lobby-bg-v2-crowd.png");
    this.load.image("game-darts-room", "./assets/pubpaid/lobby/pubpaid-darts-room-v1.png");
    this.load.image("game-checkers-room", "./assets/pubpaid/lobby/pubpaid-checkers-room-v1.png");
    this.load.image("game-menu-damas-card", "./assets/pubpaid/lobby/pubpaid-menu-damas-card-v1.png");
    this.load.image("game-menu-dardos-card", "./assets/pubpaid/lobby/pubpaid-menu-dardos-card-v1.png");
    this.load.spritesheet("checkers-wood-tiles", "./assets/pubpaid/checkers/wood-tiles-oga.png", {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet("checkers-pieces", "./assets/pubpaid/checkers/checker-pieces-oga.png", {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.image("ppg-waiter-hero-sprite", "./assets/pubpaid/characters/waiter-salon-small-v1.png");
    this.load.image("ppg-waiter-lobby-sprite", "./assets/pubpaid/characters/waiter-lobby-large-v1.png");
    this.load.image("ppg-waiter-lobby-speaking-sprite", "./assets/pubpaid/characters/waiter-lobby-speaking-v1.png");
    this.load.image("ppg-player-sprite", "./assets/pubpaid/sprites/adult-standing-tight-v1.png");
    this.load.image("ppg-singer-lobby-sprite", "./assets/pubpaid/characters/singer-lobby-v1.png");
    this.load.image("ppg-singer-sprite", "./assets/pubpaid/sprites/singer-stage-tight-v1.png");
    this.load.image("ppg-guest-a-sprite", "./assets/pubpaid/sprites/adult-standing-tight-v1.png");
    this.load.image("ppg-guest-b-sprite", "./assets/pubpaid/sprites/guest-seated-tight-v1.png");
  }

  create() {
    ensureCoreSprites(this);
    updateGameState({
      currentScene: "intro",
      focus: "placa PUB PAID",
      objective: "Liberar som e tela cheia",
      prompt: "Toque em Ativar e começar para liberar áudio, tela cheia e iniciar a abertura."
    });
  }
}
